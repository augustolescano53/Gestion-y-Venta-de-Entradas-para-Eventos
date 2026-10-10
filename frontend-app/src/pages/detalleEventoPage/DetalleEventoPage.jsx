import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getEvent } from '../../api/events.js';
import { getTicketTypes } from '../../api/ticketTypes.js';
import { getTicketSummary } from '../../api/tickets.js';
import { useAuth } from '../../auth/useAuth.js';
import AuthModal from '../../components/auth/AuthModal.jsx';
import Modal from '../../components/Modal.jsx';
import { EVENT_STATUS, MAX_TICKETS_PER_PURCHASE, eventStatusLabel } from '../../constants/statuses.js';
import { parseEventKey } from '../../shared/refs.helpers.js';
import { checkoutPath } from '../../shared/routes.js';
import { formatEventDate, formatPrice, formatTime } from '../../shared/format.helpers.js';
import { loadPurchaseSelection, savePurchaseSelection } from '../../shared/purchaseSelection.js';
import {
  buildSelection,
  buildTicketOptions,
  canIncrement,
  eventLoadErrorMessage,
  isEventPurchasable,
  restoreQuantities,
  selectionTotals,
  venueAddress,
} from './DetalleEventoPage.helpers.js';

function DetalleEventoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [options, setOptions] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coverFailed, setCoverFailed] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const loadEvent = useCallback(async () => {
    const { venue, event: idEvent } = parseEventKey(id);
    setLoading(true);
    setError(null);
    setQuantities({});
    setCoverFailed(false);
    if (!Number.isInteger(venue) || !Number.isInteger(idEvent)) {
      setEvent(null);
      setError('El evento no existe.');
      setLoading(false);
      return;
    }
    try {
      const [detail, ticketTypes, summary] = await Promise.all([
        getEvent(venue, idEvent),
        getTicketTypes(venue),
        getTicketSummary({ venue, event: idEvent }),
      ]);
      const nextOptions = buildTicketOptions(detail.ticketTypeIds ?? [], ticketTypes, summary);
      setEvent(detail);
      setOptions(nextOptions);
      // Si el comprador vuelve (por ejemplo, desde el checkout), recupera su
      // selección ajustada a la disponibilidad actual.
      const stored = loadPurchaseSelection(id);
      if (stored) setQuantities(restoreQuantities(nextOptions, stored.selection));
    } catch (loadError) {
      setEvent(null);
      setError(eventLoadErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  if (loading) {
    return <p>Cargando evento...</p>;
  }

  if (error) {
    return (
      <p className="banner banner--error">
        {error}{' '}
        <button type="button" className="btn" onClick={loadEvent}>
          Reintentar
        </button>
      </p>
    );
  }

  const purchasable = isEventPurchasable(event);
  const soldOut = options.every((option) => option.available === 0);
  const canSelect = purchasable && !soldOut;
  const { count, amount } = selectionTotals(options, quantities);
  const limitReached = count >= MAX_TICKETS_PER_PURCHASE;
  const venueId = event.venue?.id ?? event.venue;
  const address = venueAddress(event.venue);

  function changeQuantity(idTicketType, delta) {
    setQuantities((previous) => ({
      ...previous,
      [idTicketType]: Math.max(0, (previous[idTicketType] ?? 0) + delta),
    }));
  }

  // La selección se guarda antes de pedir el login: así no se pierde al
  // registrarse ni al recargar el checkout.
  function goToCheckout() {
    navigate(checkoutPath(venueId, event.idEvent), {
      state: { selection: buildSelection(options, quantities) },
    });
  }

  function handleBuy() {
    savePurchaseSelection(id, buildSelection(options, quantities));
    if (user) goToCheckout();
    else setShowAuth(true);
  }

  function handleAuthSuccess() {
    setShowAuth(false);
    goToCheckout();
  }

  function closeExpiredNotice() {
    navigate(location.pathname, { replace: true, state: null });
  }

  return (
    <section className="event-detail">
      <div className="event-detail__purchase">
        <h3>Comprar entradas</h3>

        {event.status === EVENT_STATUS.SOLD_OUT || (purchasable && soldOut) ? (
          <p className="banner banner--error">Entradas agotadas.</p>
        ) : (
          !purchasable && <p className="banner banner--error">Este evento no está a la venta.</p>
        )}

        <div className="purchase-card">
          {options.length === 0 ? (
            <p className="form-note">Este evento no tiene tipos de entrada.</p>
          ) : (
            options.map((option) => {
              const quantity = quantities[option.idTicketType] ?? 0;
              return (
                <div key={option.idTicketType} className="ticket-option">
                  <div className="ticket-option__header">
                    {option.location}
                    {option.isNumbered && <span className="tag">Numerada</span>}
                  </div>
                  <div className="ticket-option__row">
                    <div>
                      <p className="ticket-option__price">{formatPrice(option.price)}</p>
                      {quantity > 0 && (
                        <p className="ticket-option__subtotal">
                          {quantity} × {formatPrice(option.price)} = {formatPrice(quantity * option.price)}
                        </p>
                      )}
                    </div>
                    {option.available === 0 ? (
                      <span className="status-badge status-badge--sold_out">Agotado</span>
                    ) : (
                      <div className="qty-stepper">
                        <button
                          type="button"
                          aria-label={`Quitar una entrada ${option.location}`}
                          onClick={() => changeQuantity(option.idTicketType, -1)}
                          disabled={!canSelect || quantity === 0}
                        >
                          −
                        </button>
                        <span aria-live="polite">{quantity}</span>
                        <button
                          type="button"
                          aria-label={`Agregar una entrada ${option.location}`}
                          onClick={() => changeQuantity(option.idTicketType, 1)}
                          disabled={!canSelect || !canIncrement(option, quantities, count)}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {canSelect && limitReached && (
            <p className="form-note text-right">
              Máximo {MAX_TICKETS_PER_PURCHASE} entradas por compra.
            </p>
          )}

          <div className="purchase-card__footer">
            {count > 0 && (
              <p className="purchase-card__summary">
                <span>
                  {count} {count === 1 ? 'entrada' : 'entradas'}
                </span>
                <strong>{formatPrice(amount)}</strong>
              </p>
            )}
            <button
              type="button"
              className="btn btn--primary btn--buy"
              onClick={handleBuy}
              disabled={!canSelect || count === 0}
            >
              Comprar ahora
            </button>
          </div>
        </div>
      </div>

      {/* La imagen se muestra entera (contain) sobre una copia desenfocada
          que rellena los costados: sirve para cualquier proporción. */}
      <aside className="event-card">
        <div className="event-cover">
          {event.coverImage && !coverFailed ? (
            <>
              <img className="event-cover__bg" src={event.coverImage} alt="" aria-hidden="true" />
              <img
                className="event-cover__img"
                src={event.coverImage}
                alt={event.name}
                onError={() => setCoverFailed(true)}
              />
            </>
          ) : (
            <span className="event-cover__fallback">{event.name}</span>
          )}
        </div>

        <div className="event-info">
          <div className="flex flex-wrap items-center gap-3">
            <h2>{event.name}</h2>
            {event.status !== EVENT_STATUS.SCHEDULED && (
              <span className={`status-badge status-badge--${event.status}`}>
                {eventStatusLabel(event.status)}
              </span>
            )}
          </div>
          <p className="event-info__meta">
            {formatEventDate(event.date)} · {formatTime(event.startTime)} h
          </p>
          {event.venue?.name && (
            <p className="event-info__meta">
              {event.venue.name}
              {address && ` — ${address}`}
            </p>
          )}
          {event.description && <p className="event-info__description">{event.description}</p>}
          {event.organizer?.firstName && (
            <p className="event-info__meta">
              Organiza: {event.organizer.firstName} {event.organizer.lastName}
            </p>
          )}
        </div>
      </aside>

      {showAuth && <AuthModal onSuccess={handleAuthSuccess} onClose={() => setShowAuth(false)} />}

      {location.state?.expired && (
        <Modal title="Se terminó el tiempo" onClose={closeExpiredNotice}>
          <p className="m-0">
            Se agotó el tiempo límite para realizar la compra y no se registró ninguna entrada. Elegí tus
            entradas nuevamente.
          </p>
          <div className="form-actions">
            <button type="button" className="btn btn--primary" onClick={closeExpiredNotice}>
              Entendido
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}

export default DetalleEventoPage;
