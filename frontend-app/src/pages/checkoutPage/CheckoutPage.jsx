import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { getEvent } from '../../api/events.js';
import { getPaymentMethods } from '../../api/paymentMethods.js';
import { getTicketTypes } from '../../api/ticketTypes.js';
import { getTicketSummary, purchaseTickets } from '../../api/tickets.js';
import { useAuth } from '../../auth/useAuth.js';
import AuthModal from '../../components/auth/AuthModal.jsx';
import FormField from '../../components/FormField.jsx';
import TicketQr from '../../components/TicketQr.jsx';
import { parseEventKey } from '../../shared/refs.helpers.js';
import { MI_CUENTA_PATHS, PUBLIC_PATHS, eventoPath } from '../../shared/routes.js';
import { formatLongDate, formatPrice, formatTime } from '../../shared/format.helpers.js';
import {
  clearPurchaseSelection,
  loadPurchaseSelection,
  startPurchaseTimer,
} from '../../shared/purchaseSelection.js';
import {
  buildTicketOptions,
  eventLoadErrorMessage,
  isEventPurchasable,
  venueAddress,
} from '../detalleEventoPage/DetalleEventoPage.helpers.js';
import {
  AVAILABILITY_ERROR,
  CARD_MONTHS,
  EMPTY_CARD_FORM,
  buildCheckoutItems,
  buildPurchasePayload,
  cardYears,
  formatCardNumber,
  formatCountdown,
  getCardErrors,
  groupSoldTickets,
  hasUnavailableItems,
  isCardMethod,
  isInvalidSessionError,
  itemsTotal,
  purchaseErrorMessage,
  timerLevel,
} from './CheckoutPage.helpers.js';

// No hay pasarela de pago: la aprobación se simula con esta espera.
const SIMULATED_PAYMENT_MS = 1500;

function CheckoutPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { venue, event: idEvent } = parseEventKey(id);
  const backToEvent = eventoPath(venue, idEvent);

  // La selección llega en el state de la navegación o, si se recargó la
  // página, desde sessionStorage.
  const [selection] = useState(
    () => location.state?.selection ?? loadPurchaseSelection(id)?.selection ?? null,
  );

  const [event, setEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [options, setOptions] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [card, setCard] = useState(EMPTY_CARD_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [stage, setStage] = useState(null);
  const [purchaseError, setPurchaseError] = useState(null);
  const [soldTickets, setSoldTickets] = useState(null);

  const [expiresAt, setExpiresAt] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    if (!Number.isInteger(venue) || !Number.isInteger(idEvent)) {
      setLoadError('El evento no existe.');
      setLoading(false);
      return;
    }
    try {
      const [detail, types, summary, methods] = await Promise.all([
        getEvent(venue, idEvent),
        getTicketTypes(venue),
        getTicketSummary({ venue, event: idEvent }),
        getPaymentMethods(),
      ]);
      setEvent(detail);
      setTicketTypes(types);
      setOptions(buildTicketOptions(detail.ticketTypeIds ?? [], types, summary));
      setPaymentMethods(methods);
    } catch (error) {
      setLoadError(eventLoadErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [venue, idEvent]);

  useEffect(() => {
    if (selection) loadData();
  }, [selection, loadData]);

  // El tiempo límite corre desde que el comprador, ya autenticado, ve el
  // checkout. Se guarda con la selección: recargar no lo reinicia.
  const ready = Boolean(user && selection && event && !soldTickets);
  useEffect(() => {
    if (!ready) return;
    setExpiresAt(startPurchaseTimer(id, selection));
    setNow(Date.now());
  }, [ready, id, selection]);

  useEffect(() => {
    if (!expiresAt || soldTickets) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [expiresAt, soldTickets]);

  const remaining = expiresAt ? expiresAt - now : null;

  // Si la confirmación está en curso se espera su resultado.
  useEffect(() => {
    if (remaining === null || remaining > 0 || soldTickets || stage) return;
    clearPurchaseSelection(id);
    navigate(backToEvent, { replace: true, state: { expired: true } });
  }, [remaining, soldTickets, stage, id, navigate, backToEvent]);

  if (!selection) {
    return (
      <section className="auth-card">
        <h2>Comprar entradas</h2>
        <p>No hay entradas seleccionadas para este evento.</p>
        <Link to={backToEvent}>Elegir entradas</Link>
      </section>
    );
  }

  if (loading) {
    return <p>Cargando compra...</p>;
  }

  if (loadError) {
    return (
      <p className="banner banner--error">
        {loadError}{' '}
        <button type="button" className="btn" onClick={loadData}>
          Reintentar
        </button>
      </p>
    );
  }

  const items = buildCheckoutItems(selection, options);
  const { count, amount } = itemsTotal(items);
  const unavailable = hasUnavailableItems(items);
  const purchasable = isEventPurchasable(event);
  const selectedMethod = paymentMethods.find((pm) => String(pm.id) === paymentMethodId);
  const cardSelected = isCardMethod(selectedMethod);
  const address = venueAddress(event.venue);

  if (soldTickets) {
    const groups = groupSoldTickets(soldTickets);
    return (
      <section className="checkout-success">
        <p className="banner banner--success" role="status">
          <strong>Compra realizada correctamente.</strong>
        </p>
        <h2>{event.name}</h2>
        <p className="event-info__meta">
          {formatLongDate(event.date)} - {formatTime(event.startTime)} h · {event.venue?.name}
        </p>
        {soldTickets.length !== count && (
          <p className="banner banner--error">
            Se registraron {soldTickets.length} de las {count} entradas elegidas. Revisá tus entradas en Mi cuenta.
          </p>
        )}
        {groups.map((group) => (
          <div key={group.location} className="checkout-summary">
            <h3>
              {group.location} · {group.tickets.length} {group.tickets.length === 1 ? 'entrada' : 'entradas'}
            </h3>
            <ul className="checkout-success__codes">
              {group.tickets.map((ticket) => (
                <li key={ticket.id} className="checkout-success__ticket">
                  <TicketQr ticket={ticket} />
                  <span>
                    Entrada #{ticket.id}
                    {ticket.seatNumber != null && ` · Asiento ${ticket.seatNumber}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="form-actions justify-start">
          <Link className="btn btn--primary no-underline" to={MI_CUENTA_PATHS.misEventos}>
            Ver mis entradas
          </Link>
          <Link className="btn no-underline" to={backToEvent}>
            Volver al evento
          </Link>
          <Link className="btn no-underline" to={PUBLIC_PATHS.home}>
            Ir al inicio
          </Link>
        </div>
      </section>
    );
  }

  function validate(nextMethodId = paymentMethodId, nextCard = card) {
    const errors = {};
    const method = paymentMethods.find((pm) => String(pm.id) === nextMethodId);
    if (!method) errors.paymentMethod = 'Elegí un medio de pago.';
    else if (isCardMethod(method)) Object.assign(errors, getCardErrors(nextCard));
    return errors;
  }

  function handleMethodChange(eventChange) {
    const nextId = eventChange.target.value;
    setPaymentMethodId(nextId);
    if (submitAttempted) setFieldErrors(validate(nextId));
  }

  function handleCardChange(eventChange) {
    const { name, value } = eventChange.target;
    let nextValue = value;
    if (name === 'number') nextValue = formatCardNumber(value);
    if (name === 'cvv') nextValue = value.replace(/\D/g, '').slice(0, 3);
    if (name === 'dni') nextValue = value.replace(/[^\d.]/g, '').slice(0, 10);
    const nextCard = { ...card, [name]: nextValue };
    setCard(nextCard);
    if (submitAttempted) setFieldErrors(validate(paymentMethodId, nextCard));
  }

  async function refreshAvailability() {
    const summary = await getTicketSummary({ venue, event: idEvent });
    const fresh = buildTicketOptions(event.ticketTypeIds ?? [], ticketTypes, summary);
    setOptions(fresh);
    return fresh;
  }

  async function handleConfirm(eventSubmit) {
    eventSubmit.preventDefault();
    if (stage) return;
    setSubmitAttempted(true);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setPurchaseError('Revisá los datos del pago.');
      return;
    }

    setPurchaseError(null);
    setStage('checking');
    try {
      // La disponibilidad puede haber cambiado desde que se eligieron las
      // entradas. El backend vuelve a controlarla dentro de la compra.
      const fresh = await refreshAvailability();
      if (hasUnavailableItems(buildCheckoutItems(selection, fresh))) {
        setPurchaseError(AVAILABILITY_ERROR);
        return;
      }

      setStage('paying');
      await new Promise((resolve) => setTimeout(resolve, SIMULATED_PAYMENT_MS));
      const sold = await purchaseTickets(
        buildPurchasePayload({
          venue,
          idEvent,
          participantId: user.id,
          paymentMethodId: Number(paymentMethodId),
          items,
        }),
      );
      clearPurchaseSelection(id);
      setSoldTickets(sold);
    } catch (error) {
      if (isInvalidSessionError(error)) {
        logout();
        setPurchaseError('Tu sesión ya no es válida. Iniciá sesión nuevamente.');
      } else {
        setPurchaseError(purchaseErrorMessage(error));
        if (error.fieldErrors?.availability) refreshAvailability().catch(() => {});
      }
    } finally {
      setStage(null);
    }
  }

  const level = remaining !== null ? timerLevel(remaining) : 'normal';
  const canConfirm = purchasable && !unavailable && paymentMethods.length > 0 && Boolean(user);

  return (
    <section className="checkout">
      <div className="page-toolbar mb-0">
        <h2>Finalizá tu compra</h2>
        <Link to={backToEvent}>Volver al evento</Link>
      </div>

      {remaining !== null && (
        <div className={`timer-banner timer-banner--${level}`}>
          <span>Tiempo límite para realizar la compra</span>
          <strong className="timer-banner__clock" aria-label={`Quedan ${formatCountdown(remaining)} minutos`}>
            {formatCountdown(remaining)}
          </strong>
        </div>
      )}

      <div className="checkout__grid">
        <form className="form-card mb-0" onSubmit={handleConfirm} noValidate>
          <h3>Medio de pago</h3>

          {!purchasable && <p className="banner banner--error">Este evento ya no está a la venta.</p>}
          {unavailable && (
            <p className="banner banner--error">
              {AVAILABILITY_ERROR} <Link to={backToEvent}>Volver a elegir entradas</Link>
            </p>
          )}

          {paymentMethods.length === 0 ? (
            <p className="banner banner--error">Todavía no hay medios de pago disponibles.</p>
          ) : (
            <fieldset className={`form-fieldset ${fieldErrors.paymentMethod ? 'form-fieldset--invalid' : ''}`}>
              <legend>Elegí cómo pagar</legend>
              {paymentMethods.map((method) => (
                <label key={method.id} className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={String(method.id)}
                    checked={paymentMethodId === String(method.id)}
                    onChange={handleMethodChange}
                  />
                  <span>{method.type}</span>
                </label>
              ))}
              {fieldErrors.paymentMethod && (
                <span className="field__error" role="alert">
                  {fieldErrors.paymentMethod}
                </span>
              )}
            </fieldset>
          )}

          {cardSelected && (
            <fieldset className="form-fieldset">
              <legend>Datos de la tarjeta</legend>
              <FormField label="Titular (como figura en la tarjeta)" error={fieldErrors.holder}>
                <input name="holder" autoComplete="cc-name" value={card.holder} onChange={handleCardChange} />
              </FormField>
              <div className="form-grid">
                <FormField label="DNI del titular" error={fieldErrors.dni}>
                  <input name="dni" inputMode="numeric" value={card.dni} onChange={handleCardChange} />
                </FormField>
                <FormField label="Número de tarjeta" error={fieldErrors.number}>
                  <input
                    name="number"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    value={card.number}
                    onChange={handleCardChange}
                  />
                </FormField>
              </div>
              <div className="form-grid">
                <FormField label="Vencimiento" error={fieldErrors.expiry}>
                  <div className="flex gap-2">
                    <select name="month" aria-label="Mes" value={card.month} onChange={handleCardChange}>
                      <option value="">Mes</option>
                      {CARD_MONTHS.map((month) => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))}
                    </select>
                    <select name="year" aria-label="Año" value={card.year} onChange={handleCardChange}>
                      <option value="">Año</option>
                      {cardYears().map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </FormField>
                <FormField label="Código de seguridad (CVV)" error={fieldErrors.cvv}>
                  <input
                    name="cvv"
                    type="password"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    maxLength={3}
                    value={card.cvv}
                    onChange={handleCardChange}
                  />
                </FormField>
              </div>
            </fieldset>
          )}

          {purchaseError && (
            <p className="banner banner--error" role="alert">
              {purchaseError}
            </p>
          )}

          <div className="form-actions">
            <button type="submit" className="btn btn--primary btn--buy" disabled={!canConfirm || Boolean(stage)}>
              {stage === 'checking'
                ? 'Verificando disponibilidad...'
                : stage === 'paying'
                  ? 'Procesando pago...'
                  : 'Confirmar compra'}
            </button>
          </div>
        </form>

        <aside className="checkout-summary">
          <h3>Resumen de compra</h3>
          <div>
            <p className="checkout-summary__event">{event.name}</p>
            <p className="event-info__meta">
              {formatLongDate(event.date)} - {formatTime(event.startTime)} h
            </p>
            {event.venue?.name && (
              <p className="event-info__meta">
                {event.venue.name}
                {address && ` — ${address}`}
              </p>
            )}
          </div>

          <ul className="checkout-summary__items">
            {items.map((item) => (
              <li key={item.idTicketType}>
                <strong>Entrada {item.location}</strong>
                <span>Cantidad: {item.quantity}</span>
                <span>{formatPrice(item.price)} c/u</span>
                <span>Subtotal: {formatPrice(item.subtotal)}</span>
                {item.quantity > item.available && (
                  <span className="field__error">
                    {item.available === 0 ? 'Agotado' : `Solo quedan ${item.available}`}
                  </span>
                )}
              </li>
            ))}
          </ul>

          <div className="checkout-summary__total">
            <span>
              TOTAL · {count} {count === 1 ? 'entrada' : 'entradas'}
            </span>
            <strong>{formatPrice(amount)}</strong>
          </div>
        </aside>
      </div>

      {!user && <AuthModal onSuccess={() => {}} onClose={() => navigate(backToEvent)} />}
    </section>
  );
}

export default CheckoutPage;
