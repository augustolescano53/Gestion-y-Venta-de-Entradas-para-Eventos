import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import VenueSelect from '../../components/VenueSelect.jsx';
import { useConfirm } from '../../components/confirmDialog/useConfirm.js';
import {
  getTicketTypes,
  createTicketType,
  updateTicketType,
  deleteTicketType,
} from '../../api/ticketTypes.js';
import { EMPTY_FORM } from './TicketTypesPage.data.js';
import {
  buildTicketTypePayload,
  deleteConfirmMessage,
  ticketTypeToFormData,
  validateTicketTypeForm,
} from './TicketTypesPage.helpers.js';
import { DELETE_CONFIRM, SUCCESS_MESSAGES } from './TicketTypesPage.consts.js';

function TicketTypesPage() {
  const confirm = useConfirm();

  const [selectedVenueId, setSelectedVenueId] = useState(null);
  const [hasVenues, setHasVenues] = useState(true);

  const [ticketTypes, setTicketTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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

  useEffect(() => {
    if (selectedVenueId != null) {
      loadTicketTypes(selectedVenueId);
    }
  }, [selectedVenueId]);

  function handleVenueChange(venueId) {
    setSelectedVenueId(venueId);
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
    setFormData(ticketTypeToFormData(ticketType));
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

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateTicketTypeForm(formData);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload = buildTicketTypePayload(formData);

    setSubmitting(true);
    setFormError(null);
    try {
      if (editingTicketType) {
        await updateTicketType(selectedVenueId, editingTicketType.idTicketType, payload);
        toast.success(SUCCESS_MESSAGES.updated);
      } else {
        await createTicketType(selectedVenueId, payload);
        toast.success(SUCCESS_MESSAGES.created);
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
    const confirmed = await confirm({
      ...DELETE_CONFIRM,
      message: deleteConfirmMessage(ticketType),
    });
    if (!confirmed) return;

    setDeletingId(ticketType.idTicketType);
    setListError(null);
    try {
      await deleteTicketType(selectedVenueId, ticketType.idTicketType);
      setTicketTypes((previous) =>
        previous.filter((tt) => tt.idTicketType !== ticketType.idTicketType),
      );
      toast.success(SUCCESS_MESSAGES.deleted);
    } catch (error) {
      setListError(error.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section>
      <div className="page-toolbar">
        <h2>Tipos de entrada</h2>
        {selectedVenueId != null && (
          <button type="button" className="btn btn--primary" onClick={openCreateForm}>
            + Nuevo tipo de entrada
          </button>
        )}
      </div>

      <div className="filter-bar">
        <VenueSelect
          value={selectedVenueId}
          onChange={handleVenueChange}
          onLoaded={(venues) => setHasVenues(venues.length > 0)}
        />
      </div>

      {!hasVenues && (
        <p>Primero necesitás crear un lugar para poder cargar tipos de entrada.</p>
      )}

      {hasVenues && selectedVenueId != null && (
        <>
          {listError && (
            <p className="banner banner--error">
              {listError}{' '}
              <button type="button" className="btn" onClick={() => loadTicketTypes(selectedVenueId)}>
                Reintentar
              </button>
            </p>
          )}

          {isFormOpen && (
            <form className="form-card" onSubmit={handleSubmit}>
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
            <p>Cargando tipos de entrada...</p>
          ) : ticketTypes.length === 0 ? (
            <p>Este lugar todavía no tiene tipos de entrada cargados.</p>
          ) : (
            <ul className="card-list">
              {ticketTypes.map((ticketType) => (
                <li key={ticketType.idTicketType} className="card">
                  <h3>{ticketType.location}</h3>
                  <p>Cantidad: {ticketType.quantity}</p>
                  <p>{ticketType.isNumbered ? 'Entrada numerada' : 'Entrada no numerada'}</p>
                  <div className="card__actions">
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
