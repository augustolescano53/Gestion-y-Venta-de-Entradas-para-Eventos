import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import FormField from '../../components/FormField.jsx';
import EventForm from '../../components/eventForm/EventForm.jsx';
import { useEventForm } from '../../components/eventForm/useEventForm.js';
import { useConfirm } from '../../components/confirmDialog/useConfirm.js';
import {
  getAllEvents,
  getEvent,
  createEvent,
  updateEvent,
  cancelEvent,
  deleteEvent,
} from '../../api/events.js';
import { getOrganizers } from '../../api/organizers.js';
import { eventStatusLabel } from '../../constants/statuses.js';
import { resolveId } from '../../shared/refs.helpers.js';
import {
  buildEventPayload,
  cancelConfirmMessage,
  deleteConfirmMessage,
  eventKey,
  eventToFormData,
  isLocked,
  updatedEventMessage,
} from './EventsPage.helpers.js';
import { CANCEL_CONFIRM, DELETE_CONFIRM, SUCCESS_MESSAGES } from './EventsPage.consts.js';

function EventsPage() {
  const confirm = useConfirm();

  const [organizers, setOrganizers] = useState([]);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [busyKey, setBusyKey] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const form = useEventForm();

  useEffect(() => {
    getOrganizers()
      .then(setOrganizers)
      .catch(() => setOrganizers([]));
  }, []);

  async function loadEvents() {
    setLoading(true);
    setListError(null);
    try {
      const data = await getAllEvents();
      setEvents(data);
    } catch (error) {
      setListError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  function openCreateForm() {
    setEditingEvent(null);
    form.reset();
    setIsFormOpen(true);
  }

  async function openEditForm(event) {
    const venueId = resolveId(event.venue);
    setEditingEvent(event);
    form.reset({ data: eventToFormData(event), venue: venueId, event });
    setIsFormOpen(true);
    try {
      const detail = await getEvent(venueId, event.idEvent);
      form.setAssociatedTypeIds(detail.ticketTypeIds ?? []);
    } catch (error) {
      form.setFormError(error.message);
    }
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingEvent(null);
    form.reset();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.validate()) return;

    const payload = buildEventPayload(form.formData);

    setSubmitting(true);
    try {
      if (editingEvent) {
        const updated = await updateEvent(form.venueId, editingEvent.idEvent, payload);
        toast.success(updatedEventMessage(updated));
      } else {
        await createEvent(form.venueId, payload);
        toast.success(SUCCESS_MESSAGES.created);
      }
      closeForm();
      await loadEvents();
    } catch (error) {
      form.showServerError(error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelEvent(event) {
    const confirmed = await confirm({
      ...CANCEL_CONFIRM,
      message: cancelConfirmMessage(event),
    });
    if (!confirmed) return;

    setBusyKey(eventKey(event));
    setListError(null);
    try {
      const updated = await cancelEvent(resolveId(event.venue), event.idEvent);
      setEvents((previous) =>
        previous.map((e) => (eventKey(e) === eventKey(event) ? { ...e, status: updated.status } : e)),
      );
      toast.success(SUCCESS_MESSAGES.cancelled);
    } catch (error) {
      setListError(error.message);
    } finally {
      setBusyKey(null);
    }
  }

  async function handleDelete(event) {
    const confirmed = await confirm({
      ...DELETE_CONFIRM,
      message: deleteConfirmMessage(event),
    });
    if (!confirmed) return;

    setBusyKey(eventKey(event));
    setListError(null);
    try {
      await deleteEvent(resolveId(event.venue), event.idEvent);
      setEvents((previous) => previous.filter((e) => eventKey(e) !== eventKey(event)));
      toast.success(SUCCESS_MESSAGES.deleted);
    } catch (error) {
      setListError(error.message);
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <section>
      <div className="page-toolbar">
        <h2>Eventos</h2>
        <button type="button" className="btn btn--primary" onClick={openCreateForm}>
          + Nuevo evento
        </button>
      </div>

      {listError && (
        <p className="banner banner--error">
          {listError}{' '}
          <button type="button" className="btn" onClick={loadEvents}>
            Reintentar
          </button>
        </p>
      )}

      {isFormOpen && (
        <EventForm
          form={form}
          title={editingEvent ? 'Editar evento' : 'Nuevo evento'}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          submitting={submitting}
          venueName={editingEvent?.venue?.name}
          adminLinks
          notice={
            organizers.length === 0 && (
              <p className="banner banner--error">
                Todavía no hay organizadores cargados. <Link to="/organizadores">Creá uno primero</Link>.
              </p>
            )
          }
          organizerField={
            <FormField label="Organizador" error={form.fieldErrors.organizer}>
              <select
                name="organizer"
                value={form.formData.organizer}
                onChange={form.handleChange}
                aria-invalid={Boolean(form.fieldErrors.organizer)}
              >
                <option value="" disabled>
                  Elegí un organizador...
                </option>
                {organizers.map((organizer) => (
                  <option key={organizer.id} value={organizer.id}>
                    {organizer.firstName} {organizer.lastName}
                  </option>
                ))}
              </select>
            </FormField>
          }
        />
      )}

      {loading ? (
        <p>Cargando eventos...</p>
      ) : events.length === 0 ? (
        <p>Todavía no hay eventos cargados.</p>
      ) : (
        <ul className="card-list">
          {events.map((event) => {
            const organizer = organizers.find((o) => o.id === resolveId(event.organizer));
            const key = eventKey(event);
            const locked = isLocked(event);
            return (
              <li key={key} className="card">
                <h3>{event.name}</h3>
                <span className={`status-badge status-badge--${event.status}`}>
                  {eventStatusLabel(event.status)}
                </span>
                <p>{event.description}</p>
                <p>Lugar: {event.venue?.name ?? `#${resolveId(event.venue)}`}</p>
                <p>
                  {event.date} · {event.startTime.slice(0, 5)} a {event.endTime.slice(0, 5)}
                </p>
                <p>
                  Organizador:{' '}
                  {organizer ? `${organizer.firstName} ${organizer.lastName}` : 'Sin datos'}
                </p>
                {locked && <p>Este evento ya no se puede modificar.</p>}
                <div className="card__actions">
                  {!locked && (
                    <>
                      <button type="button" onClick={() => openEditForm(event)}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn--danger"
                        onClick={() => handleCancelEvent(event)}
                        disabled={busyKey === key}
                      >
                        Anular evento
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className="btn--danger"
                    onClick={() => handleDelete(event)}
                    disabled={busyKey === key}
                  >
                    {busyKey === key ? 'Procesando...' : 'Eliminar'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default EventsPage;
