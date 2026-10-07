import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  getTickets,
  getTicketSummary,
  purchaseTickets,
  scanTicket,
  updateTicket,
  deleteTicket,
} from '../../api/tickets.js';
import { getAllEvents } from '../../api/events.js';
import { getVenues } from '../../api/venues.js';
import { getParticipants } from '../../api/participants.js';
import { getPaymentMethods } from '../../api/paymentMethods.js';
import FormField from '../../components/FormField.jsx';
import TicketSummaryTable from '../../components/TicketSummaryTable.jsx';
import { useConfirm } from '../../components/confirmDialog/useConfirm.js';
import {
  EDITABLE_TICKET_STATUSES,
  EVENT_STATUS,
  MAX_TICKETS_PER_PURCHASE,
  TICKET_STATUS,
  TICKET_STATUS_LABELS,
  ticketStatusLabel,
} from '../../constants/statuses.js';
import { resolveId } from '../../shared/refs.helpers.js';
import { EMPTY_FILTERS, EMPTY_PURCHASE } from './TicketsPage.data.js';
import {
  buildPurchasePayload,
  buildTicketEditPayload,
  deleteConfirmMessage,
  eventKey,
  getParticipantName,
  getPaymentMethodName,
  getVenueName,
  parseEventKey,
  purchaseSuccessMessage,
  ticketToEditData,
  validatePurchase,
  validateTicketEdit,
} from './TicketsPage.helpers.js';
import { DELETE_CONFIRM, PAGE_SIZE, SUCCESS_MESSAGES } from './TicketsPage.consts.js';

// Con "Todos los estados" se muestra siempre el resumen (de todos los
// eventos o del elegido); con un estado puntual, el listado de entradas.
function TicketsPage() {
  const confirm = useConfirm();

  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState([]);
  const [result, setResult] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);

  const [listError, setListError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [purchaseData, setPurchaseData] = useState(EMPTY_PURCHASE);
  const [purchaseTypes, setPurchaseTypes] = useState([]);
  const [purchaseErrors, setPurchaseErrors] = useState({});
  const [purchaseError, setPurchaseError] = useState(null);
  const [purchasing, setPurchasing] = useState(false);

  const [qr, setQr] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);

  const [editingTicket, setEditingTicket] = useState(null);
  const [editData, setEditData] = useState(null);
  const [editError, setEditError] = useState(null);
  const [saving, setSaving] = useState(false);

  const showSummary = filters.status === '';
  const hasFilters = filters.event !== '' || filters.status !== '';

  useEffect(() => {
    getAllEvents().then(setEvents).catch(() => setEvents([]));
    getVenues().then(setVenues).catch(() => setVenues([]));
    getParticipants().then(setParticipants).catch(() => setParticipants([]));
    getPaymentMethods().then(setPaymentMethods).catch(() => setPaymentMethods([]));
  }, []);

  async function loadData(currentFilters = filters, currentPage = page) {
    setLoading(true);
    setListError(null);
    try {
      const eventFilter = currentFilters.event ? parseEventKey(currentFilters.event) : {};
      if (currentFilters.status === '') {
        setSummary(await getTicketSummary(eventFilter));
      } else {
        setResult(
          await getTickets({
            ...eventFilter,
            status: currentFilters.status,
            page: currentPage,
            pageSize: PAGE_SIZE,
          }),
        );
      }
    } catch (error) {
      setListError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(filters, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  async function refresh() {
    await loadData();
    getAllEvents().then(setEvents).catch(() => {});
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((previous) => ({ ...previous, [name]: value }));
    setPage(1);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }

  // --- Compra ---

  // Los Agotados no tienen entradas y los Cancelados/Finalizados no venden.
  const purchasableEvents = events.filter((e) => e.status === EVENT_STATUS.SCHEDULED);

  const selectedPurchaseType = purchaseTypes.find(
    (row) => String(row.idTicketType) === purchaseData.ticketType,
  );
  const maxQuantity = Math.min(MAX_TICKETS_PER_PURCHASE, selectedPurchaseType?.available ?? MAX_TICKETS_PER_PURCHASE);

  async function loadPurchaseTypes(key) {
    if (!key) {
      setPurchaseTypes([]);
      return;
    }
    try {
      setPurchaseTypes(await getTicketSummary(parseEventKey(key)));
    } catch {
      setPurchaseTypes([]);
    }
  }

  function openPurchaseForm() {
    setPurchaseData(EMPTY_PURCHASE);
    setPurchaseTypes([]);
    setPurchaseErrors({});
    setPurchaseError(null);
    setIsPurchaseOpen(true);
    setEditingTicket(null);
  }

  function handlePurchaseChange(event) {
    const { name, value } = event.target;
    setPurchaseData((previous) => ({
      ...previous,
      [name]: value,
      ...(name === 'event' ? { ticketType: '' } : {}),
    }));
    setPurchaseErrors((previous) => {
      const next = { ...previous };
      delete next[name];
      return next;
    });
    if (name === 'event') loadPurchaseTypes(value);
  }

  async function handlePurchase(event) {
    event.preventDefault();
    const errors = validatePurchase(purchaseData, selectedPurchaseType);
    setPurchaseErrors(errors);
    if (Object.keys(errors).length > 0) {
      setPurchaseError('Revisá los campos marcados.');
      return;
    }

    setPurchasing(true);
    setPurchaseError(null);
    try {
      const sold = await purchaseTickets(buildPurchasePayload(purchaseData));
      setIsPurchaseOpen(false);
      toast.success(purchaseSuccessMessage(sold.length));
      await refresh();
    } catch (error) {
      setPurchaseErrors(error.fieldErrors ?? {});
      setPurchaseError(error.message);
      loadPurchaseTypes(purchaseData.event);
    } finally {
      setPurchasing(false);
    }
  }

  // --- Escaneo ---

  async function handleScan(event) {
    event.preventDefault();
    if (!qr.trim()) {
      setScanResult({ ok: false, message: 'Ingresá el código QR de la entrada.' });
      return;
    }
    setScanning(true);
    try {
      const data = await scanTicket(qr.trim());
      setScanResult({
        ok: true,
        message: `Ingreso registrado: ${data.eventName} — ${data.ticketTypeName} (entrada #${data.ticket.id}).`,
      });
      setQr('');
      await refresh();
    } catch (error) {
      setScanResult({ ok: false, message: error.message });
    } finally {
      setScanning(false);
    }
  }

  // --- Edición ---

  function openEditForm(ticket) {
    setEditingTicket(ticket);
    setIsPurchaseOpen(false);
    setEditData(ticketToEditData(ticket));
    setEditError(null);
  }

  function closeEditForm() {
    setEditingTicket(null);
    setEditData(null);
    setEditError(null);
  }

  function handleEditChange(event) {
    const { name, value } = event.target;
    setEditData((previous) => ({ ...previous, [name]: value }));
  }

  async function handleEditSubmit(event) {
    event.preventDefault();
    const validationError = validateTicketEdit(editData);
    if (validationError) {
      setEditError(validationError);
      return;
    }

    const payload = buildTicketEditPayload(editData, editingTicket);

    setSaving(true);
    setEditError(null);
    try {
      await updateTicket(editingTicket.id, payload);
      toast.success(SUCCESS_MESSAGES.updated);
      closeEditForm();
      await refresh();
    } catch (error) {
      setEditError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(ticket) {
    const confirmed = await confirm({
      ...DELETE_CONFIRM,
      message: deleteConfirmMessage(ticket),
    });
    if (!confirmed) return;

    setDeletingId(ticket.id);
    setListError(null);
    try {
      await deleteTicket(ticket.id);
      toast.success(SUCCESS_MESSAGES.deleted);
      await refresh();
    } catch (error) {
      setListError(error.message);
    } finally {
      setDeletingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  return (
    <section>
      <div className="page-toolbar">
        <h2>Entradas</h2>
        <button type="button" className="btn btn--primary" onClick={openPurchaseForm}>
          Comprar entradas
        </button>
      </div>

      {listError && <p className="banner banner--error">{listError}</p>}

      {isPurchaseOpen && (
        <form className="form-card" onSubmit={handlePurchase} noValidate>
          <h3>Comprar entradas</h3>

          {purchaseError && <p className="banner banner--error">{purchaseError}</p>}

          <div className="form-grid">
            <FormField
              label="Evento"
              error={purchaseErrors.event}
              hint={purchasableEvents.length === 0 ? 'No hay eventos con entradas a la venta.' : undefined}
            >
              <select name="event" value={purchaseData.event} onChange={handlePurchaseChange}>
                <option value="" disabled>
                  Elegí un evento...
                </option>
                {purchasableEvents.map((ev) => (
                  <option key={eventKey(resolveId(ev.venue), ev.idEvent)} value={eventKey(resolveId(ev.venue), ev.idEvent)}>
                    {ev.name} ({ev.date})
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Tipo de entrada" error={purchaseErrors.ticketType}>
              <select
                name="ticketType"
                value={purchaseData.ticketType}
                onChange={handlePurchaseChange}
                disabled={!purchaseData.event}
              >
                <option value="" disabled>
                  Elegí un tipo de entrada...
                </option>
                {purchaseTypes.map((row) => (
                  <option key={row.idTicketType} value={row.idTicketType} disabled={row.available === 0}>
                    {row.ticketTypeName} ({row.available} disponibles)
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Cantidad"
              error={purchaseErrors.quantity}
              hint={`Máximo ${MAX_TICKETS_PER_PURCHASE} entradas por compra.`}
            >
              <input
                name="quantity"
                type="number"
                min="1"
                max={maxQuantity}
                value={purchaseData.quantity}
                onChange={handlePurchaseChange}
              />
            </FormField>

            <FormField label="Participante" error={purchaseErrors.participant}>
              <select name="participant" value={purchaseData.participant} onChange={handlePurchaseChange}>
                <option value="" disabled>
                  Elegí un participante...
                </option>
                {participants.map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.firstName} {participant.lastName}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Medio de pago" error={purchaseErrors.paymentMethod}>
              <select name="paymentMethod" value={purchaseData.paymentMethod} onChange={handlePurchaseChange}>
                <option value="" disabled>
                  Elegí un medio de pago...
                </option>
                {paymentMethods.map((paymentMethod) => (
                  <option key={paymentMethod.id} value={paymentMethod.id}>
                    {paymentMethod.type}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => setIsPurchaseOpen(false)} disabled={purchasing}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary" disabled={purchasing}>
              {purchasing ? 'Procesando...' : 'Confirmar compra'}
            </button>
          </div>
        </form>
      )}

      <form className="filter-bar" onSubmit={handleScan}>
        <label className="field">
          <span>Escanear QR (control de ingreso)</span>
          <input
            value={qr}
            placeholder="Código QR de la entrada"
            onChange={(event) => setQr(event.target.value)}
          />
        </label>
        <button type="submit" className="btn" disabled={scanning}>
          {scanning ? 'Verificando...' : 'Registrar ingreso'}
        </button>
      </form>
      {scanResult && (
        <p className={`banner ${scanResult.ok ? 'banner--success' : 'banner--error'}`}>
          {scanResult.message}
        </p>
      )}

      {editingTicket && editData && (
        <form className="form-card" onSubmit={handleEditSubmit} noValidate>
          <h3>Editar entrada #{editingTicket.id}</h3>

          {editError && <p className="banner banner--error">{editError}</p>}

          <p className="form-note">
            {editingTicket.event.name} — {editingTicket.ticketType.location}. El evento y el tipo de
            entrada no se pueden cambiar.
          </p>

          <div className="form-grid">
            <label className="field">
              <span>Estado</span>
              <select name="status" value={editData.status} onChange={handleEditChange}>
                {EDITABLE_TICKET_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {TICKET_STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Número de asiento (opcional)</span>
              <input
                name="seatNumber"
                type="number"
                min="1"
                value={editData.seatNumber}
                onChange={handleEditChange}
              />
            </label>

            {editData.status !== TICKET_STATUS.AVAILABLE && (
              <>
                <label className="field">
                  <span>Participante</span>
                  <select name="participant" value={editData.participant} onChange={handleEditChange}>
                    <option value="" disabled>
                      Elegí un participante...
                    </option>
                    {participants.map((participant) => (
                      <option key={participant.id} value={participant.id}>
                        {participant.firstName} {participant.lastName}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Medio de pago</span>
                  <select name="paymentMethod" value={editData.paymentMethod} onChange={handleEditChange}>
                    <option value="" disabled>
                      Elegí un medio de pago...
                    </option>
                    {paymentMethods.map((paymentMethod) => (
                      <option key={paymentMethod.id} value={paymentMethod.id}>
                        {paymentMethod.type}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Fecha de compra</span>
                  <input
                    name="purchaseDate"
                    type="date"
                    value={editData.purchaseDate}
                    onChange={handleEditChange}
                  />
                </label>
              </>
            )}
          </div>

          {editData.status === TICKET_STATUS.AVAILABLE && editingTicket.status !== TICKET_STATUS.AVAILABLE && (
            <p className="form-note">
              Al pasarla a Disponible, la entrada vuelve al stock y se borran su participante, medio
              de pago y fecha de compra.
            </p>
          )}

          <div className="form-actions">
            <button type="button" onClick={closeEditForm} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      )}

      <div className="filter-bar">
        <label className="field">
          <span>Evento</span>
          <select name="event" value={filters.event} onChange={handleFilterChange}>
            <option value="">Todos los eventos</option>
            {events.map((ev) => (
              <option key={eventKey(resolveId(ev.venue), ev.idEvent)} value={eventKey(resolveId(ev.venue), ev.idEvent)}>
                {ev.name} ({ev.date})
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Estado</span>
          <select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="">Todos los estados</option>
            {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <button type="button" className="btn" onClick={clearFilters} disabled={!hasFilters}>
          Limpiar filtros
        </button>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : showSummary ? (
        summary.length === 0 ? (
          <p>
            {filters.event
              ? 'El evento elegido no tiene entradas.'
              : 'Todavía no hay entradas. Se generan automáticamente al crear un evento.'}
          </p>
        ) : (
          <TicketSummaryTable rows={summary} />
        )
      ) : (
        <>
          <p className="page-note">
            {result.total === 1 ? '1 entrada encontrada' : `${result.total} entradas encontradas`}
          </p>

          {result.total === 0 ? (
            <p>No hay entradas que coincidan con los filtros elegidos.</p>
          ) : (
            <>
              <ul className="card-list">
                {result.items.map((ticket) => (
                  <li key={ticket.id} className="card">
                    <h3>Entrada #{ticket.id}</h3>
                    <span className={`status-badge status-badge--${ticket.status}`}>
                      {ticketStatusLabel(ticket.status)}
                    </span>
                    <p>Evento: {ticket.event.name}</p>
                    <p>Tipo de entrada: {ticket.ticketType.location}</p>
                    <p>Lugar: {getVenueName(venues, resolveId(ticket.event.venue))}</p>
                    {ticket.seatNumber != null && <p>Asiento: {ticket.seatNumber}</p>}
                    <p>Participante: {getParticipantName(participants, ticket.participant)}</p>
                    <p>Medio de pago: {getPaymentMethodName(paymentMethods, ticket.paymentMethod)}</p>
                    {ticket.status === TICKET_STATUS.CANCELLED && ticket.previousStatus && (
                      <p>Antes de la anulación: {ticketStatusLabel(ticket.previousStatus)}</p>
                    )}
                    <p className="card__qr">QR: {ticket.qr}</p>
                    <div className="card__actions">
                      {ticket.status === TICKET_STATUS.CANCELLED ? (
                        <p>El evento fue anulado: esta entrada no se puede modificar.</p>
                      ) : (
                        <button type="button" onClick={() => openEditForm(ticket)}>
                          Editar
                        </button>
                      )}
                      {ticket.status === TICKET_STATUS.AVAILABLE && (
                        <button
                          type="button"
                          className="btn--danger"
                          onClick={() => handleDelete(ticket)}
                          disabled={deletingId === ticket.id}
                        >
                          {deletingId === ticket.id ? 'Eliminando...' : 'Eliminar'}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {totalPages > 1 && (
                <div className="pagination">
                  <button type="button" className="btn" onClick={() => setPage(page - 1)} disabled={page <= 1}>
                    Anterior
                  </button>
                  <span>
                    Página {page} de {totalPages}
                  </span>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}

export default TicketsPage;
