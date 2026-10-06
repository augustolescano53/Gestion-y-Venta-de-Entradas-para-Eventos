import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import VenueSelect from '../components/VenueSelect.jsx';
import FormField from '../components/FormField.jsx';
import TimeField from '../components/TimeField.jsx';
import {
  getAllEvents,
  getEvent,
  createEvent,
  updateEvent,
  cancelEvent,
  deleteEvent,
} from '../api/events.js';
import { getTicketTypes } from '../api/ticketTypes.js';
import { getOrganizers } from '../api/organizers.js';
import { EVENT_STATUS, eventStatusLabel, localToday } from '../constants/statuses.js';
import { RELATED_FIELDS, validateEventForm } from '../validation/eventForm.js';

const EMPTY_FORM = {
  name: '',
  description: '',
  coverImage: '',
  date: '',
  startTime: '',
  endTime: '',
  organizer: '',
  ticketTypes: [],
};

function resolveId(ref) {
  if (ref == null) return null;
  return typeof ref === 'object' ? (ref.id ?? null) : ref;
}

// Un evento se identifica por su id + el id de su lugar (clave compuesta).
function eventKey(event) {
  return `${resolveId(event.venue)}-${event.idEvent}`;
}

function isLocked(event) {
  return event.status === EVENT_STATUS.CANCELLED || event.status === EVENT_STATUS.FINISHED;
}

function EventsPage() {
  const [organizers, setOrganizers] = useState([]);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [busyKey, setBusyKey] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formVenueId, setFormVenueId] = useState(null);
  const [venueTicketTypes, setVenueTicketTypes] = useState([]);
  const [associatedTypeIds, setAssociatedTypeIds] = useState([]);
  const [loadingTicketTypes, setLoadingTicketTypes] = useState(false);
  const latestVenueRequest = useRef(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  async function loadVenueTicketTypes(venueId) {
    latestVenueRequest.current = venueId;
    setVenueTicketTypes([]);
    setLoadingTicketTypes(true);
    try {
      const data = await getTicketTypes(venueId);
      // Si mientras tanto se eligió otro lugar, esta respuesta ya no sirve.
      if (latestVenueRequest.current === venueId) setVenueTicketTypes(data);
    } catch {
      if (latestVenueRequest.current === venueId) setVenueTicketTypes([]);
    } finally {
      if (latestVenueRequest.current === venueId) setLoadingTicketTypes(false);
    }
  }

  // Después del primer intento de guardar, cada cambio vuelve a validar el
  // campo (y los que dependen de él) para actualizar o quitar su mensaje.
  function revalidate(nextData, field, nextVenueId = formVenueId) {
    if (!submitAttempted) return;
    const errors = validateEventForm(nextData, {
      editing: Boolean(editingEvent),
      original: editingEvent,
      venueId: nextVenueId,
    });
    setFieldErrors((previous) => {
      const next = { ...previous };
      for (const name of RELATED_FIELDS[field] ?? [field]) {
        if (errors[name]) next[name] = errors[name];
        else delete next[name];
      }
      return next;
    });
  }

  // Los tipos de entrada pertenecen a un único lugar (y sus ids se repiten
  // entre lugares): al cambiar de lugar, ninguno de los elegidos sigue
  // correspondiendo.
  function handleFormVenueChange(venueId) {
    setFormVenueId(venueId);
    const nextData = { ...formData, ticketTypes: [] };
    setFormData(nextData);
    revalidate(nextData, 'venue', venueId);
    loadVenueTicketTypes(venueId);
  }

  function resetFormState() {
    setFieldErrors({});
    setSubmitAttempted(false);
    setFormError(null);
  }

  function openCreateForm() {
    setEditingEvent(null);
    setFormVenueId(null);
    setVenueTicketTypes([]);
    setAssociatedTypeIds([]);
    setFormData(EMPTY_FORM);
    resetFormState();
    setIsFormOpen(true);
  }

  async function openEditForm(event) {
    const venueId = resolveId(event.venue);
    setEditingEvent(event);
    setFormVenueId(venueId);
    setAssociatedTypeIds([]);
    setFormData({
      name: event.name,
      description: event.description,
      coverImage: event.coverImage,
      date: event.date,
      startTime: event.startTime.slice(0, 5),
      endTime: event.endTime.slice(0, 5),
      organizer: String(resolveId(event.organizer) ?? ''),
      ticketTypes: [],
    });
    resetFormState();
    setIsFormOpen(true);
    loadVenueTicketTypes(venueId);
    try {
      const detail = await getEvent(venueId, event.idEvent);
      setAssociatedTypeIds(detail.ticketTypeIds ?? []);
    } catch (error) {
      setFormError(error.message);
    }
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingEvent(null);
    setFormVenueId(null);
    resetFormState();
  }

  function handleChange(event) {
    const { name, value } = event.target;
    const nextData = { ...formData, [name]: value };
    setFormData(nextData);
    revalidate(nextData, name);
  }

  function toggleTicketType(idTicketType) {
    const nextData = {
      ...formData,
      ticketTypes: formData.ticketTypes.includes(idTicketType)
        ? formData.ticketTypes.filter((id) => id !== idTicketType)
        : [...formData.ticketTypes, idTicketType],
    };
    setFormData(nextData);
    revalidate(nextData, 'ticketTypes');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitAttempted(true);

    const errors = validateEventForm(formData, {
      editing: Boolean(editingEvent),
      original: editingEvent,
      venueId: formVenueId,
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError('Revisá los campos marcados.');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      coverImage: formData.coverImage.trim(),
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      organizer: Number(formData.organizer),
      ticketTypes: formData.ticketTypes,
    };

    setSubmitting(true);
    setFormError(null);
    try {
      if (editingEvent) {
        const updated = await updateEvent(formVenueId, editingEvent.idEvent, payload);
        setSuccessMessage(
          updated.addedTicketTypes > 0
            ? `Evento actualizado. Se agregaron ${updated.addedTicketTypes} tipo(s) de entrada con sus entradas disponibles.`
            : 'Evento actualizado correctamente.',
        );
      } else {
        await createEvent(formVenueId, payload);
        setSuccessMessage('Evento creado correctamente, con sus entradas disponibles.');
      }
      closeForm();
      await loadEvents();
    } catch (error) {
      setFieldErrors(error.fieldErrors ?? {});
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelEvent(event) {
    const confirmed = window.confirm(
      `¿Seguro que querés anular el evento "${event.name}"? El evento y todas sus entradas pasarán a Cancelado/Cancelada. Se conservan los registros y los datos de compra, pero no se podrán vender más entradas ni registrar ingresos. Las devoluciones de dinero no se gestionan desde acá.`,
    );
    if (!confirmed) return;

    setBusyKey(eventKey(event));
    setListError(null);
    try {
      const updated = await cancelEvent(resolveId(event.venue), event.idEvent);
      setEvents((previous) =>
        previous.map((e) => (eventKey(e) === eventKey(event) ? { ...e, status: updated.status } : e)),
      );
      setSuccessMessage('Evento anulado: el evento y sus entradas quedaron cancelados.');
    } catch (error) {
      setListError(error.message);
    } finally {
      setBusyKey(null);
    }
  }

  async function handleDelete(event) {
    const confirmed = window.confirm(
      `¿Seguro que querés eliminar el evento "${event.name}"? También se eliminarán sus entradas disponibles.`,
    );
    if (!confirmed) return;

    setBusyKey(eventKey(event));
    setListError(null);
    try {
      await deleteEvent(resolveId(event.venue), event.idEvent);
      setEvents((previous) => previous.filter((e) => eventKey(e) !== eventKey(event)));
      setSuccessMessage('Evento eliminado correctamente.');
    } catch (error) {
      setListError(error.message);
    } finally {
      setBusyKey(null);
    }
  }

  const editing = Boolean(editingEvent);
  const errorProps = (field) => ({ 'aria-invalid': Boolean(fieldErrors[field]) });

  return (
    <section>
      <div className="page-toolbar">
        <h2>Eventos</h2>
        <button type="button" className="btn btn--primary" onClick={openCreateForm}>
          + Nuevo evento
        </button>
      </div>

      {successMessage && <p className="banner banner--success">{successMessage}</p>}
      {listError && (
        <p className="banner banner--error">
          {listError}{' '}
          <button type="button" className="btn" onClick={loadEvents}>
            Reintentar
          </button>
        </p>
      )}

      {isFormOpen && (
        <form className="form-card" onSubmit={handleSubmit} noValidate>
          <h3>{editing ? 'Editar evento' : 'Nuevo evento'}</h3>

          {formError && <p className="banner banner--error">{formError}</p>}

          {organizers.length === 0 && (
            <p className="banner banner--error">
              Todavía no hay organizadores cargados.{' '}
              <Link to="/organizadores">Creá uno primero</Link>.
            </p>
          )}

          {editing ? (
            <p className="form-note">
              Lugar: <strong>{editingEvent.venue?.name ?? `#${formVenueId}`}</strong>. El lugar no se
              puede cambiar porque las entradas ya generadas pertenecen a él.
            </p>
          ) : (
            <div className={fieldErrors.venue ? 'field--invalid' : ''}>
              <VenueSelect value={formVenueId} onChange={handleFormVenueChange} autoSelectFirst={false} />
              {fieldErrors.venue && (
                <span className="field__error" role="alert">
                  {fieldErrors.venue}
                </span>
              )}
            </div>
          )}

          {formVenueId != null && (
            <fieldset className={`form-fieldset ${fieldErrors.ticketTypes ? 'form-fieldset--invalid' : ''}`}>
              <legend>Tipos de entrada{editing ? ' (podés agregar nuevos)' : ''}</legend>
              {loadingTicketTypes ? (
                <p className="form-note">Cargando tipos de entrada...</p>
              ) : venueTicketTypes.length === 0 ? (
                <p className="form-note">
                  Este lugar todavía no tiene tipos de entrada.{' '}
                  <Link to="/tipos-de-entrada">Creá uno primero</Link>.
                </p>
              ) : (
                <>
                  {venueTicketTypes.map((ticketType) => {
                    const alreadyAdded = associatedTypeIds.includes(ticketType.idTicketType);
                    return (
                      <label key={ticketType.idTicketType} className="field field--checkbox">
                        <input
                          type="checkbox"
                          checked={alreadyAdded || formData.ticketTypes.includes(ticketType.idTicketType)}
                          disabled={alreadyAdded}
                          onChange={() => toggleTicketType(ticketType.idTicketType)}
                        />
                        <span>
                          {ticketType.location} — {ticketType.quantity} entradas
                          {ticketType.isNumbered ? ' (numeradas)' : ''}
                          {alreadyAdded && <span className="tag">Ya agregado</span>}
                        </span>
                      </label>
                    );
                  })}
                  <p className="form-note">
                    {editing
                      ? 'Agregar tipos es opcional: al guardar se generan solo las entradas de los tipos nuevos. Los ya agregados no se pueden quitar.'
                      : 'Al guardar se generan automáticamente todas las entradas de los tipos elegidos, en estado Disponible.'}
                  </p>
                </>
              )}
              {fieldErrors.ticketTypes && (
                <span className="field__error" role="alert">
                  {fieldErrors.ticketTypes}
                </span>
              )}
            </fieldset>
          )}

          <FormField label="Nombre" error={fieldErrors.name}>
            <input name="name" value={formData.name} onChange={handleChange} {...errorProps('name')} />
          </FormField>

          <FormField label="Descripción" error={fieldErrors.description}>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              {...errorProps('description')}
            />
          </FormField>

          <div className="form-grid">
            <FormField label="Imagen de portada (URL)" error={fieldErrors.coverImage}>
              <input
                name="coverImage"
                placeholder="https://..."
                value={formData.coverImage}
                onChange={handleChange}
                {...errorProps('coverImage')}
              />
            </FormField>

            <FormField label="Fecha" error={fieldErrors.date}>
              <input
                name="date"
                type="date"
                min={localToday()}
                value={formData.date}
                onChange={handleChange}
                {...errorProps('date')}
              />
            </FormField>

            <TimeField
              label="Hora de inicio"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              error={fieldErrors.startTime}
            />

            <TimeField
              label="Hora de fin"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              error={fieldErrors.endTime}
              hint="Formato 24 h (HH:MM). Si es menor que la de inicio, el evento termina al día siguiente."
            />

            <FormField label="Organizador" error={fieldErrors.organizer}>
              <select
                name="organizer"
                value={formData.organizer}
                onChange={handleChange}
                {...errorProps('organizer')}
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
          </div>

          <div className="form-actions">
            <button type="button" onClick={closeForm} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
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
