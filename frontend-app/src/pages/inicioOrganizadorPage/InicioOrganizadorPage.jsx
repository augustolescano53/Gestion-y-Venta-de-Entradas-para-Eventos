import { Fragment, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getEvent } from '../../api/events.js';
import { cancelOrganizerEvent, getOrganizerEvents } from '../../api/organizers.js';
import { getTicketSummary } from '../../api/tickets.js';
import { useConfirm } from '../../components/confirmDialog/useConfirm.js';
import EventBanner from '../../components/event/EventBanner.jsx';
import EventInfoCard from '../../components/event/EventInfoCard.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/miCuenta/AccountStates.jsx';
import { TICKET_COUNT_COLUMNS, eventStatusLabel } from '../../constants/statuses.js';
import { getCurrentUser } from '../../shared/currentUser.js';
import { resolveId } from '../../shared/refs.helpers.js';
import { editarMiEventoPath } from '../../shared/routes.js';
import { SUCCESS_MESSAGES } from '../eventsPage/EventsPage.consts.js';
import { eventKey } from '../eventsPage/EventsPage.helpers.js';
import {
  CANCEL_EVENT_CONFIRM,
  STATUS_FILTERS,
  canModify,
  cancelEventMessage,
  filterByStatus,
  groupSummaryByEvent,
  formatEventDateTime,
  sortOrganizerEvents,
} from './InicioOrganizadorPage.helpers.js';

// Evento (nombre, fecha y estado), Tipo de entrada, cantidades y acciones.
const COLUMN_COUNT = 3 + TICKET_COUNT_COLUMNS.length;

// Editar y Anular (cancelar) un evento: los mismos botones en la tabla y al
// final del detalle desplegable (misma ruta, mismo cuadro de confirmación).
// En el detalle, "Anular" va primero y discreto, y "Editar" a la derecha
// como acción principal.
function EventActions({ event, busy, onCancel, inDetail = false }) {
  if (!canModify(event)) return null;
  const editLink = (
    <Link
      to={editarMiEventoPath(resolveId(event.venue), event.idEvent)}
      className={`btn no-underline ${inDetail ? 'btn--primary detail-panel__edit' : ''}`}
    >
      Editar
    </Link>
  );
  const cancelButton = (
    <button
      type="button"
      className={`btn--danger ${inDetail ? 'detail-panel__cancel' : ''}`}
      onClick={() => onCancel(event)}
      disabled={busy}
    >
      {busy ? 'Anulando...' : 'Anular'}
    </button>
  );
  return inDetail ? (
    <div className="table-actions detail-panel__actions">
      {cancelButton}
      {editLink}
    </div>
  ) : (
    <div className="table-actions">
      {editLink}
      {cancelButton}
    </div>
  );
}

// Detalle del evento debajo de su fila, con el diseño del detalle público
// (sin la compra). Escape o la cruz lo cierran. actions va al final.
function EventDetailRow({ id, event, error, onClose, onRetry, actions }) {
  const panelRef = useRef(null);

  // Al abrir, el foco pasa al panel para que el teclado y los lectores de
  // pantalla lleguen al detalle.
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  function handleKeyDown(keyEvent) {
    if (keyEvent.key === 'Escape') onClose();
  }

  return (
    <tr className="detail-row">
      <td colSpan={COLUMN_COUNT}>
        <div
          id={id}
          ref={panelRef}
          tabIndex={-1}
          role="region"
          aria-label="Detalle del evento"
          onKeyDown={handleKeyDown}
          className="detail-panel"
        >
          <button
            type="button"
            className="detail-panel__close"
            onClick={onClose}
            aria-label="Cerrar detalle del evento"
            title="Cerrar"
          >
            ✕
          </button>
          {error ? (
            <ErrorState message={error} onRetry={onRetry} />
          ) : !event ? (
            <LoadingState message="Cargando el evento..." />
          ) : (
            <>
              <EventBanner event={event} />
              <EventInfoCard event={event} showEndTime clampDescription className="event-card--panel" />
              {actions}
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function InicioOrganizadorPage() {
  const confirm = useConfirm();
  const { id: organizerId } = getCurrentUser();

  const [events, setEvents] = useState([]);
  // Cantidades de entradas por tipo, como en "Entradas": { "venueId-idEvent": filas }.
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyKey, setBusyKey] = useState(null);
  // Solo cambia qué eventos se ven; la tabla y el contador usan la misma lista.
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTERS[0].value);

  // Panel de detalle: un evento abierto a la vez; los detalles ya pedidos se
  // guardan para no volver a pedirlos.
  const [openKey, setOpenKey] = useState(null);
  const [details, setDetails] = useState({});
  const [detailErrors, setDetailErrors] = useState({});
  const nameButtons = useRef({});

  async function loadEvents() {
    setLoading(true);
    setError(null);
    try {
      const [eventList, summaryRows] = await Promise.all([getOrganizerEvents(organizerId), getTicketSummary()]);
      setEvents(eventList);
      setSummary(groupSummaryByEvent(summaryRows));
    } catch {
      setError('No pudimos cargar tus eventos. Intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizerId]);

  async function loadDetail(event) {
    const key = eventKey(event);
    setDetailErrors((previous) => ({ ...previous, [key]: null }));
    try {
      const detail = await getEvent(resolveId(event.venue), event.idEvent);
      setDetails((previous) => ({ ...previous, [key]: detail }));
    } catch {
      setDetailErrors((previous) => ({ ...previous, [key]: 'No pudimos cargar el detalle del evento.' }));
    }
  }

  function toggleDetail(event) {
    const key = eventKey(event);
    if (openKey === key) {
      closeDetail();
      return;
    }
    setOpenKey(key);
    if (!details[key]) loadDetail(event);
  }

  // El foco vuelve al nombre que abrió el panel.
  function closeDetail() {
    const key = openKey;
    setOpenKey(null);
    nameButtons.current[key]?.focus();
  }

  async function handleCancel(event) {
    const confirmed = await confirm({ ...CANCEL_EVENT_CONFIRM, message: cancelEventMessage(event) });
    if (!confirmed) return;

    const key = eventKey(event);
    setBusyKey(key);
    try {
      const updated = await cancelOrganizerEvent(organizerId, resolveId(event.venue), event.idEvent);
      // El estado nuevo reordena la tabla; el detalle abierto se actualiza.
      setEvents((previous) => previous.map((e) => (eventKey(e) === key ? { ...e, status: updated.status } : e)));
      setDetails((previous) =>
        previous[key] ? { ...previous, [key]: { ...previous[key], status: updated.status } } : previous,
      );
      toast.success(SUCCESS_MESSAGES.cancelled);
      // Las entradas también pasaron a Canceladas.
      getTicketSummary({ venue: resolveId(event.venue), event: event.idEvent })
        .then((rows) => setSummary((previous) => ({ ...previous, [key]: rows })))
        .catch(() => {});
    } catch (cancelError) {
      toast.error(
        cancelError.status === 409 ? cancelError.message : 'No se pudo anular el evento. Intentá nuevamente.',
      );
    } finally {
      setBusyKey(null);
    }
  }

  const activeFilter = STATUS_FILTERS.find((filter) => filter.value === statusFilter);
  const visible = filterByStatus(sortOrganizerEvents(events), activeFilter);

  return (
    <section>
      {/* "Crear evento" está en el Header. */}
      <div className="page-toolbar">
        <h2>Mis eventos</h2>
      </div>

      {loading ? (
        <LoadingState message="Cargando tus eventos..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadEvents} />
      ) : events.length === 0 ? (
        <EmptyState message="Todavía no creaste eventos." />
      ) : (
        <>
          <div className="filter-bar items-center justify-between">
            <label className="field sm:max-w-xs">
              <span>Filtrar por estado</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                {STATUS_FILTERS.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="m-0 text-base" aria-live="polite">
              <strong className="text-2xl text-sangria">{visible.length}</strong> — {activeFilter.counter}
            </p>
          </div>

          {visible.length === 0 ? (
            <EmptyState message={activeFilter.empty} />
          ) : (
            <div className="table-wrapper">
              <table className="data-table data-table--stack data-table--grouped">
                <thead>
                  <tr>
                    <th scope="col">Evento</th>
                    <th scope="col" className="text-left">
                      Tipo de entrada
                    </th>
                    {TICKET_COUNT_COLUMNS.map(([field, label]) => (
                      <th key={field} scope="col">
                        {label}
                      </th>
                    ))}
                    <th scope="col">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((event) => {
                    const key = eventKey(event);
                    const open = openKey === key;
                    const panelId = `detalle-${key}`;
                    // Una fila por tipo de entrada; los datos del evento ocupan
                    // todas sus filas (rowSpan).
                    const typeRows = summary[key] ?? [];
                    const span = Math.max(typeRows.length, 1);
                    const countCells = (row) =>
                      TICKET_COUNT_COLUMNS.map(([field, label]) => (
                        <td key={field} data-label={label} className="text-right">
                          {row[field]}
                        </td>
                      ));
                    return (
                      <Fragment key={key}>
                        <tr className="group-start">
                          <td rowSpan={span}>
                            <div className="flex flex-col items-start gap-1">
                              <button
                                type="button"
                                className="table-link"
                                aria-expanded={open}
                                aria-controls={open ? panelId : undefined}
                                ref={(element) => {
                                  nameButtons.current[key] = element;
                                }}
                                onClick={() => toggleDetail(event)}
                              >
                                {event.name}
                              </button>
                              <span className="text-xs text-tinta-muted">{formatEventDateTime(event)}</span>
                              <span className={`status-badge status-badge--${event.status}`}>
                                {eventStatusLabel(event.status)}
                              </span>
                            </div>
                          </td>
                          {typeRows.length === 0 ? (
                            <td colSpan={1 + TICKET_COUNT_COLUMNS.length} className="text-left">
                              Sin entradas
                            </td>
                          ) : (
                            <>
                              <td className="text-left font-semibold">{typeRows[0].ticketTypeName}</td>
                              {countCells(typeRows[0])}
                            </>
                          )}
                          <td rowSpan={span}>
                            <EventActions event={event} busy={busyKey === key} onCancel={handleCancel} />
                          </td>
                        </tr>
                        {typeRows.slice(1).map((row) => (
                          <tr key={row.idTicketType}>
                            <td className="text-left font-semibold">{row.ticketTypeName}</td>
                            {countCells(row)}
                          </tr>
                        ))}
                        {open && (
                          <EventDetailRow
                            id={panelId}
                            event={details[key]}
                            error={detailErrors[key]}
                            onClose={closeDetail}
                            onRetry={() => loadDetail(event)}
                            actions={
                              <EventActions
                                event={event}
                                busy={busyKey === key}
                                onCancel={handleCancel}
                                inDetail
                              />
                            }
                          />
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default InicioOrganizadorPage;
