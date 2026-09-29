import { useEffect, useState } from 'react';
import VenueSelect from '../components/VenueSelect.jsx';
import {
  getTicketTypes,
  createTicketType,
  updateTicketType,
  deleteTicketType,
} from '../api/ticketTypes.js';
import './TicketTypesPage.css';

const EMPTY_FORM = { quantity: '', location: '', isNumbered: false };

// Primer CRUD "dependiente": un tipo de entrada siempre pertenece a un
// Lugar, así que la pantalla necesita un selector de Lugar (VenueSelect)
// además del listado y el form de siempre. El id de ese lugar NO va en la
// URL de React Router (seguimos en /tipos-de-entrada): es solo un estado
// interno de esta página que se usa para armar la URL del fetch hacia el
// backend, que sí es una ruta anidada de verdad (/api/venue/:id/tickettype).
function TicketTypesPage() {
  const [selectedVenueId, setSelectedVenueId] = useState(null);
  const [hasVenues, setHasVenues] = useState(true);

  const [ticketTypes, setTicketTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTicketType, setEditingTicketType] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadTicketTypes(venueId) {
    setLoading(true);
    setListError(null);
    try {
      const data = await getTicketTypes(venueId);
      setTicketTypes(data);
    } catch (error) {
      setListError(error.message);
    } finally {
      setLoading(false);
    }
  }

  // Cada vez que cambia el lugar elegido, se vuelve a pedir la lista de
  // tipos de entrada de ESE lugar.
  useEffect(() => {
    if (selectedVenueId != null) {
      loadTicketTypes(selectedVenueId);
    }
  }, [selectedVenueId]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  function handleVenueChange(venueId) {
    setSelectedVenueId(venueId);
    // Al cambiar de lugar cerramos el form para no dejar en pantalla datos
    // que correspondían al lugar anterior.
    closeForm();
  }

  function openCreateForm() {
    setEditingTicketType(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
    setIsFormOpen(true);
  }

  function openEditForm(ticketType) {
    setEditingTicketType(ticketType);
    setFormData({
      quantity: String(ticketType.quantity),
      location: ticketType.location,
      isNumbered: ticketType.isNumbered,
    });
    setFormError(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingTicketType(null);
    setFormError(null);
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function validateForm() {
    if (!formData.location.trim()) {
      return 'La ubicación es obligatoria.';
    }
    const quantity = Number(formData.quantity);
    if (!formData.quantity || !Number.isInteger(quantity) || quantity <= 0) {
      return 'La cantidad debe ser un número entero mayor a 0.';
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
      quantity: Number(formData.quantity),
      location: formData.location.trim(),
      isNumbered: formData.isNumbered,
    };

    setSubmitting(true);
    setFormError(null);
    try {
      if (editingTicketType) {
        await updateTicketType(selectedVenueId, editingTicketType.idTicketType, payload);
        setSuccessMessage('Tipo de entrada actualizado correctamente.');
      } else {
        await createTicketType(selectedVenueId, payload);
        setSuccessMessage('Tipo de entrada creado correctamente.');
      }
      closeForm();
      await loadTicketTypes(selectedVenueId);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(ticketType) {
    const confirmed = window.confirm(
      `¿Seguro que querés eliminar el tipo de entrada "${ticketType.location}"? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    setDeletingId(ticketType.idTicketType);
    setListError(null);
    try {
      await deleteTicketType(selectedVenueId, ticketType.idTicketType);
      setTicketTypes((previous) =>
        previous.filter((tt) => tt.idTicketType !== ticketType.idTicketType),
      );
      setSuccessMessage('Tipo de entrada eliminado correctamente.');
    } catch (error) {
      // El backend no avisa antes de borrar si ya se vendieron entradas de
      // este tipo, así que acá puede aparecer un mensaje técnico si eso
      // llega a pasar.
      setListError(error.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="ticket-types-page">
      <div className="ticket-types-page__toolbar">
        <h2>Tipos de entrada</h2>
        {selectedVenueId != null && (
          <button type="button" className="btn btn--primary" onClick={openCreateForm}>
            + Nuevo tipo de entrada
          </button>
        )}
      </div>

      <VenueSelect
        value={selectedVenueId}
        onChange={handleVenueChange}
        onLoaded={(venues) => setHasVenues(venues.length > 0)}
      />

      {!hasVenues && (
        <p>Primero necesitás crear un lugar para poder cargar tipos de entrada.</p>
      )}

      {hasVenues && selectedVenueId != null && (
        <>
          {successMessage && <p className="banner banner--success">{successMessage}</p>}
          {listError && (
            <p className="banner banner--error">
              {listError}{' '}
              <button type="button" className="btn" onClick={() => loadTicketTypes(selectedVenueId)}>
                Reintentar
              </button>
            </p>
          )}

          {isFormOpen && (
            <form className="ticket-type-form" onSubmit={handleSubmit}>
              <h3>{editingTicketType ? 'Editar tipo de entrada' : 'Nuevo tipo de entrada'}</h3>

              {formError && <p className="banner banner--error">{formError}</p>}

              <label className="field">
                <span>Ubicación</span>
                <input
                  name="location"
                  placeholder="Ej: Campo, Platea, VIP..."
                  value={formData.location}
                  onChange={handleChange}
                />
              </label>

              <label className="field">
                <span>Cantidad</span>
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={handleChange}
                />
              </label>

              <label className="field field--checkbox">
                <input
                  name="isNumbered"
                  type="checkbox"
                  checked={formData.isNumbered}
                  onChange={handleChange}
                />
                <span>Es una entrada numerada</span>
              </label>

              <div className="ticket-type-form__actions">
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
            <p>Cargando tipos de entrada...</p>
          ) : ticketTypes.length === 0 ? (
            <p>Este lugar todavía no tiene tipos de entrada cargados.</p>
          ) : (
            <ul className="ticket-type-list">
              {ticketTypes.map((ticketType) => (
                <li key={ticketType.idTicketType} className="ticket-type-card">
                  <h3>{ticketType.location}</h3>
                  <p>Cantidad: {ticketType.quantity}</p>
                  <p>{ticketType.isNumbered ? 'Entrada numerada' : 'Entrada no numerada'}</p>
                  <div className="ticket-type-card__actions">
                    <button type="button" onClick={() => openEditForm(ticketType)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn--danger"
                      onClick={() => handleDelete(ticketType)}
                      disabled={deletingId === ticketType.idTicketType}
                    >
                      {deletingId === ticketType.idTicketType ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

export default TicketTypesPage;
