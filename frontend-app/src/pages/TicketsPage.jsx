import { useEffect, useState } from 'react';
import VenueSelect from '../components/VenueSelect.jsx';
import { getTickets, createTicket, updateTicket, deleteTicket } from '../api/tickets.js';
import { getVenues } from '../api/venues.js';
import { getEvents } from '../api/events.js';
import { getTicketTypes } from '../api/ticketTypes.js';
import { getParticipants } from '../api/participants.js';
import { getPaymentMethods } from '../api/paymentMethods.js';
import './TicketsPage.css';

const EMPTY_FORM = {
  event: '',
  ticketType: '',
  status: '',
  seatNumber: '',
  purchaseDate: '',
  paymentMethod: '',
  participant: '',
};

// A diferencia de TicketTypesPage/EventsPage, acá el listado NO está
// escopeado a un lugar (GET /api/ticket trae todas las entradas). El
// selector de Lugar solo se usa DENTRO del formulario, para poder ofrecer
// los eventos y tipos de entrada de ESE lugar al crear/editar una entrada.
function TicketsPage() {
  const [venues, setVenues] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [formVenueId, setFormVenueId] = useState(null);
  const [scopedEvents, setScopedEvents] = useState([]);
  const [scopedTicketTypes, setScopedTicketTypes] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Datos de apoyo (para los <select> del form y para mostrar nombres en
  // las tarjetas en vez de ids sueltos), cargados una sola vez al montar.
  useEffect(() => {
    getVenues().then(setVenues).catch(() => setVenues([]));
    getParticipants().then(setParticipants).catch(() => setParticipants([]));
    getPaymentMethods().then(setPaymentMethods).catch(() => setPaymentMethods([]));
  }, []);

  async function loadTickets() {
    setLoading(true);
    setListError(null);
    try {
      const data = await getTickets();
      setTickets(data);
    } catch (error) {
      setListError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  // Cada vez que cambia el lugar elegido DENTRO DEL FORM, se traen sus
  // eventos y tipos de entrada. Esto corre tanto cuando el usuario cambia
  // el select a mano como cuando abrimos "Editar" y precargamos el lugar
  // de la entrada existente.
  useEffect(() => {
    if (formVenueId == null) {
      setScopedEvents([]);
      setScopedTicketTypes([]);
      return;
    }
    getEvents(formVenueId).then(setScopedEvents).catch(() => setScopedEvents([]));
    getTicketTypes(formVenueId).then(setScopedTicketTypes).catch(() => setScopedTicketTypes([]));
  }, [formVenueId]);

  // Este SÍ es el que se usa desde el <select> de Lugar del form: además
  // de cambiar el lugar, limpia el evento/tipo de entrada elegidos, porque
  // pertenecían al lugar anterior y ya no tienen sentido.
  function handleFormVenueChange(venueId) {
    setFormVenueId(venueId);
    setFormData((previous) => ({ ...previous, event: '', ticketType: '' }));
  }

  function openCreateForm() {
    setEditingTicket(null);
    setFormVenueId(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
    setIsFormOpen(true);
  }

  function openEditForm(ticket) {
    setEditingTicket(ticket);
    // event/ticketType vienen del backend como { idEvent, venue } /
    // { idTicketType, venue } (su clave es compuesta). Los dos comparten
    // el mismo "venue", así que alcanza con mirar uno para saber el lugar.
    setFormVenueId(ticket.event.venue);
    setFormData({
      event: String(ticket.event.idEvent),
      ticketType: String(ticket.ticketType.idTicketType),
      status: ticket.status,
      seatNumber: ticket.seatNumber != null ? String(ticket.seatNumber) : '',
      purchaseDate: ticket.purchaseDate ? ticket.purchaseDate.slice(0, 10) : '',
      paymentMethod: ticket.paymentMethod != null ? String(ticket.paymentMethod) : '',
      participant: ticket.participant != null ? String(ticket.participant) : '',
    });
    setFormError(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingTicket(null);
    setFormVenueId(null);
    setFormError(null);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  }

  function validateForm() {
    if (formVenueId == null) {
      return 'Elegí un lugar.';
    }
    if (!formData.event) {
      return 'Elegí un evento.';
    }
    if (!formData.ticketType) {
      return 'Elegí un tipo de entrada.';
    }
    if (!formData.status.trim()) {
      return 'El estado es obligatorio.';
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

    // Los campos opcionales solo se incluyen en el payload si tienen
    // valor: así el backend no los pisa con algo vacío sin querer.
    const payload = {
      venue: formVenueId,
      event: Number(formData.event),
      ticketType: Number(formData.ticketType),
      status: formData.status.trim(),
      ...(formData.seatNumber ? { seatNumber: Number(formData.seatNumber) } : {}),
      ...(formData.purchaseDate ? { purchaseDate: formData.purchaseDate } : {}),
      ...(formData.paymentMethod ? { paymentMethod: Number(formData.paymentMethod) } : {}),
      ...(formData.participant ? { participant: Number(formData.participant) } : {}),
    };

    setSubmitting(true);
    setFormError(null);
    try {
      if (editingTicket) {
        await updateTicket(editingTicket.id, payload);
        setSuccessMessage('Entrada actualizada correctamente.');
      } else {
        await createTicket(payload);
        setSuccessMessage('Entrada creada correctamente.');
      }
      closeForm();
      await loadTickets();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(ticket) {
    const confirmed = window.confirm(
      `¿Seguro que querés eliminar la entrada #${ticket.id}? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    setDeletingId(ticket.id);
    setListError(null);
    try {
      await deleteTicket(ticket.id);
      setTickets((previous) => previous.filter((t) => t.id !== ticket.id));
      setSuccessMessage('Entrada eliminada correctamente.');
    } catch (error) {
      setListError(error.message);
    } finally {
      setDeletingId(null);
    }
  }

  function venueName(venueId) {
    return venues.find((v) => v.id === venueId)?.name ?? `Lugar #${venueId}`;
  }

  function participantName(participantId) {
    if (participantId == null) return 'Sin asignar';
    const participant = participants.find((p) => p.id === participantId);
    return participant ? `${participant.firstName} ${participant.lastName}` : `#${participantId}`;
  }

  function paymentMethodName(paymentMethodId) {
    if (paymentMethodId == null) return 'Sin asignar';
    return paymentMethods.find((pm) => pm.id === paymentMethodId)?.type ?? `#${paymentMethodId}`;
  }

  return (
    <section className="tickets-page">
      <div className="tickets-page__toolbar">
        <h2>Entradas</h2>
        <button type="button" className="btn btn--primary" onClick={openCreateForm}>
          + Nueva entrada
        </button>
      </div>

      {successMessage && <p className="banner banner--success">{successMessage}</p>}
      {listError && (
        <p className="banner banner--error">
          {listError}{' '}
          <button type="button" className="btn" onClick={loadTickets}>
            Reintentar
          </button>
        </p>
      )}

      {isFormOpen && (
        <form className="ticket-form" onSubmit={handleSubmit}>
          <h3>{editingTicket ? 'Editar entrada' : 'Nueva entrada'}</h3>

          {formError && <p className="banner banner--error">{formError}</p>}

          {/* El selector de lugar vive acá, no como parámetro de la URL
              de React Router: solo sirve para filtrar qué eventos y tipos
              de entrada se pueden elegir a continuación. */}
          <VenueSelect value={formVenueId} onChange={handleFormVenueChange} />

          {formVenueId != null && (
            <div className="ticket-form__grid">
              <label className="field">
                <span>Evento</span>
                <select name="event" value={formData.event} onChange={handleChange}>
                  <option value="" disabled>
                    Elegí un evento...
                  </option>
                  {scopedEvents.map((ev) => (
                    <option key={ev.idEvent} value={ev.idEvent}>
                      {ev.name}
                    </option>
                  ))}
                </select>
                {scopedEvents.length === 0 && (
                  <span className="field__hint">Este lugar todavía no tiene eventos.</span>
                )}
              </label>

              <label className="field">
                <span>Tipo de entrada</span>
                <select name="ticketType" value={formData.ticketType} onChange={handleChange}>
                  <option value="" disabled>
                    Elegí un tipo de entrada...
                  </option>
                  {scopedTicketTypes.map((tt) => (
                    <option key={tt.idTicketType} value={tt.idTicketType}>
                      {tt.location}
                    </option>
                  ))}
                </select>
                {scopedTicketTypes.length === 0 && (
                  <span className="field__hint">
                    Este lugar todavía no tiene tipos de entrada.
                  </span>
                )}
              </label>

              <label className="field">
                <span>Estado</span>
                <input
                  name="status"
                  placeholder="Ej: Reservado, Pagado..."
                  value={formData.status}
                  onChange={handleChange}
                />
              </label>

              <label className="field">
                <span>Número de asiento (opcional)</span>
                <input
                  name="seatNumber"
                  type="number"
                  min="1"
                  value={formData.seatNumber}
                  onChange={handleChange}
                />
              </label>

              <label className="field">
                <span>Fecha de compra (opcional)</span>
                <input
                  name="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                />
              </label>

              <label className="field">
                <span>Participante (opcional)</span>
                <select name="participant" value={formData.participant} onChange={handleChange}>
                  <option value="">Sin asignar</option>
                  {participants.map((participant) => (
                    <option key={participant.id} value={participant.id}>
                      {participant.firstName} {participant.lastName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Medio de pago (opcional)</span>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                >
                  <option value="">Sin asignar</option>
                  {paymentMethods.map((paymentMethod) => (
                    <option key={paymentMethod.id} value={paymentMethod.id}>
                      {paymentMethod.type}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <div className="ticket-form__actions">
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
        <p>Cargando entradas...</p>
      ) : tickets.length === 0 ? (
        <p>Todavía no hay entradas cargadas.</p>
      ) : (
        <ul className="ticket-list">
          {tickets.map((ticket) => (
            <li key={ticket.id} className="ticket-card">
              <h3>Entrada #{ticket.id}</h3>
              <p>Estado: {ticket.status}</p>
              <p>Lugar: {venueName(ticket.event.venue)}</p>
              {/* Mostramos el id del evento y del tipo de entrada: resolver
                  sus nombres exigiría pedir los eventos/tipos de entrada
                  de cada lugar involucrado (N pedidos extra), así que se
                  deja así a propósito, sin ir a buscar más datos de los
                  necesarios. */}
              <p>Evento: #{ticket.event.idEvent}</p>
              <p>Tipo de entrada: #{ticket.ticketType.idTicketType}</p>
              <p>Participante: {participantName(ticket.participant)}</p>
              <p>Medio de pago: {paymentMethodName(ticket.paymentMethod)}</p>
              <p className="ticket-card__qr">QR: {ticket.qr}</p>
              <div className="ticket-card__actions">
                <button type="button" onClick={() => openEditForm(ticket)}>
                  Editar
                </button>
                <button
                  type="button"
                  className="btn--danger"
                  onClick={() => handleDelete(ticket)}
                  disabled={deletingId === ticket.id}
                >
                  {deletingId === ticket.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default TicketsPage;
