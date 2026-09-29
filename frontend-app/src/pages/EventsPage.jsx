import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import VenueSelect from '../components/VenueSelect.jsx';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../api/events.js';
import { getOrganizers } from '../api/organizers.js';
import './EventsPage.css';

const EMPTY_FORM = {
  name: '',
  description: '',
  status: '',
  coverImage: '',
  date: '',
  startTime: '',
  endTime: '',
  organizer: '',
};

// El backend, al listar eventos, no "populate"-a el organizador (viene
// como una referencia sin expandir). Esta función saca el id sin importar
// si llegó como un número plano o como un objeto { id: ... }.
function resolveId(ref) {
  if (ref == null) return null;
  return typeof ref === 'object' ? (ref.id ?? null) : ref;
}

function EventsPage() {
  const [selectedVenueId, setSelectedVenueId] = useState(null);
  const [hasVenues, setHasVenues] = useState(true);

  const [organizers, setOrganizers] = useState([]);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Los organizadores no dependen del lugar elegido, así que se cargan una
  // sola vez al montar la página (se usan para el <select> del form y para
  // mostrar el nombre en cada tarjeta de la lista).
  useEffect(() => {
    getOrganizers()
      .then(setOrganizers)
      .catch(() => setOrganizers([]));
  }, []);

  async function loadEvents(venueId) {
    setLoading(true);
    setListError(null);
    try {
      const data = await getEvents(venueId);
      setEvents(data);
    } catch (error) {
      setListError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedVenueId != null) {
      loadEvents(selectedVenueId);
    }
  }, [selectedVenueId]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  function handleVenueChange(venueId) {
    setSelectedVenueId(venueId);
    closeForm();
  }

  function openCreateForm() {
    setEditingEvent(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
    setIsFormOpen(true);
  }

  function openEditForm(event) {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      description: event.description,
      status: event.status,
      coverImage: event.coverImage,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      organizer: String(resolveId(event.organizer) ?? ''),
    });
    setFormError(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingEvent(null);
    setFormError(null);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  }

  function validateForm() {
    const requiredFields = [
      ['name', 'El nombre del evento es obligatorio.'],
      ['description', 'La descripción es obligatoria.'],
      ['status', 'El estado es obligatorio.'],
      ['coverImage', 'La imagen de portada es obligatoria.'],
      ['date', 'La fecha es obligatoria.'],
      ['startTime', 'El horario de inicio es obligatorio.'],
      ['endTime', 'El horario de fin es obligatorio.'],
    ];

    for (const [field, message] of requiredFields) {
      if (!formData[field].trim()) {
        return message;
      }
    }

    if (!formData.organizer) {
      return 'Elegí un organizador.';
    }

    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      status: formData.status.trim(),
      coverImage: formData.coverImage.trim(),
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      organizer: Number(formData.organizer),
    };

    setSubmitting(true);
    setFormError(null);
    try {
      if (editingEvent) {
        await updateEvent(selectedVenueId, editingEvent.idEvent, payload);
        setSuccessMessage('Evento actualizado correctamente.');
      } else {
        await createEvent(selectedVenueId, payload);
        setSuccessMessage('Evento creado correctamente.');
      }
      closeForm();
      await loadEvents(selectedVenueId);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(event) {
    // El backend borra en cascada las entradas vendidas de este evento sin
    // avisar, así que se lo advertimos acá antes de confirmar.
    const confirmed = window.confirm(
      `¿Seguro que querés eliminar el evento "${event.name}"? Esto también eliminará todas las entradas vendidas para este evento.`,
    );
    if (!confirmed) return;

    setDeletingId(event.idEvent);
    setListError(null);
    try {
      await deleteEvent(selectedVenueId, event.idEvent);
      setEvents((previous) => previous.filter((e) => e.idEvent !== event.idEvent));
      setSuccessMessage('Evento eliminado correctamente.');
    } catch (error) {
      setListError(error.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="events-page">
      <div className="events-page__toolbar">
        <h2>Eventos</h2>
        {selectedVenueId != null && (
          <button type="button" className="btn btn--primary" onClick={openCreateForm}>
            + Nuevo evento
          </button>
        )}
      </div>

      <VenueSelect
        value={selectedVenueId}
        onChange={handleVenueChange}
        onLoaded={(venues) => setHasVenues(venues.length > 0)}
      />

      {!hasVenues && <p>Primero necesitás crear un lugar para poder cargar eventos.</p>}

      {hasVenues && selectedVenueId != null && (
        <>
          {successMessage && <p className="banner banner--success">{successMessage}</p>}
          {listError && (
            <p className="banner banner--error">
              {listError}{' '}
              <button type="button" className="btn" onClick={() => loadEvents(selectedVenueId)}>
                Reintentar
              </button>
            </p>
          )}

          {isFormOpen && (
            <form className="event-form" onSubmit={handleSubmit}>
              <h3>{editingEvent ? 'Editar evento' : 'Nuevo evento'}</h3>

              {formError && <p className="banner banner--error">{formError}</p>}

              {organizers.length === 0 && (
                <p className="banner banner--error">
                  Todavía no hay organizadores cargados.{' '}
                  <Link to="/organizadores">Creá uno primero</Link>.
                </p>
              )}

              <label className="field">
                <span>Nombre</span>
                <input name="name" value={formData.name} onChange={handleChange} />
              </label>

              <label className="field">
                <span>Descripción</span>
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                />
              </label>

              <div className="event-form__grid">
                <label className="field">
                  <span>Estado</span>
                  <input
                    name="status"
                    placeholder="Ej: Programado, Cancelado..."
                    value={formData.status}
                    onChange={handleChange}
                  />
                </label>

                <label className="field">
                  <span>Imagen de portada (URL)</span>
                  <input
                    name="coverImage"
                    placeholder="https://..."
                    value={formData.coverImage}
                    onChange={handleChange}
                  />
                </label>

                <label className="field">
                  <span>Fecha</span>
                  <input
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                  />
                </label>

                <label className="field">
                  <span>Hora de inicio</span>
                  <input
                    name="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={handleChange}
                  />
                </label>

                <label className="field">
                  <span>Hora de fin</span>
                  <input
                    name="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={handleChange}
                  />
                </label>

                <label className="field">
                  <span>Organizador</span>
                  <select name="organizer" value={formData.organizer} onChange={handleChange}>
                    <option value="" disabled>
                      Elegí un organizador...
                    </option>
                    {organizers.map((organizer) => (
                      <option key={organizer.id} value={organizer.id}>
                        {organizer.firstName} {organizer.lastName}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="event-form__actions">
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
            <p>Este lugar todavía no tiene eventos cargados.</p>
          ) : (
            <ul className="event-list">
              {events.map((event) => {
                const organizer = organizers.find(
                  (o) => o.id === resolveId(event.organizer),
                );
                return (
                  <li key={event.idEvent} className="event-card">
                    <h3>{event.name}</h3>
                    <p>{event.description}</p>
                    <p>
                      {event.date} · {event.startTime} a {event.endTime}
                    </p>
                    <p>Estado: {event.status}</p>
                    <p>
                      Organizador:{' '}
                      {organizer ? `${organizer.firstName} ${organizer.lastName}` : 'Sin datos'}
                    </p>
                    <div className="event-card__actions">
                      <button type="button" onClick={() => openEditForm(event)}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn--danger"
                        onClick={() => handleDelete(event)}
                        disabled={deletingId === event.idEvent}
                      >
                        {deletingId === event.idEvent ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

export default EventsPage;
