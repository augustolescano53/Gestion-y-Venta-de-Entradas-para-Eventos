import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getVenues, createVenue, updateVenue, deleteVenue } from '../../api/venues.js';
import { useConfirm } from '../../components/confirmDialog/useConfirm.js';
import { EMPTY_FORM } from './VenuesPage.data.js';
import {
  buildVenuePayload,
  deleteConfirmMessage,
  validateVenueForm,
  venueToFormData,
} from './VenuesPage.helpers.js';
import { DELETE_CONFIRM, SUCCESS_MESSAGES } from './VenuesPage.consts.js';

function VenuesPage() {
  const confirm = useConfirm();

  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadVenues() {
    setLoading(true);
    setListError(null);
    try {
      const data = await getVenues();
      setVenues(data);
    } catch (error) {
      setListError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVenues();
  }, []);

  function openCreateForm() {
    setEditingVenue(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
    setIsFormOpen(true);
  }

  function openEditForm(venue) {
    setEditingVenue(venue);
    setFormData(venueToFormData(venue));
    setFormError(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingVenue(null);
    setFormError(null);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateVenueForm(formData);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload = buildVenuePayload(formData);

    setSubmitting(true);
    setFormError(null);
    try {
      if (editingVenue) {
        await updateVenue(editingVenue.id, payload);
        toast.success(SUCCESS_MESSAGES.updated);
      } else {
        await createVenue(payload);
        toast.success(SUCCESS_MESSAGES.created);
      }
      closeForm();
      await loadVenues();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(venue) {
    const confirmed = await confirm({
      ...DELETE_CONFIRM,
      message: deleteConfirmMessage(venue),
    });
    if (!confirmed) return;

    setDeletingId(venue.id);
    setListError(null);
    try {
      await deleteVenue(venue.id);
      setVenues((previous) => previous.filter((v) => v.id !== venue.id));
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
        <h2>Lugares</h2>
        <button type="button" className="btn btn--primary" onClick={openCreateForm}>
          + Nuevo lugar
        </button>
      </div>

      {listError && <p className="banner banner--error">{listError}</p>}

      {isFormOpen && (
        <form className="form-card" onSubmit={handleSubmit}>
          <h3>{editingVenue ? 'Editar lugar' : 'Nuevo lugar'}</h3>

          {formError && <p className="banner banner--error">{formError}</p>}

          <label className="field">
            <span>Nombre</span>
            <input name="name" value={formData.name} onChange={handleChange} />
          </label>

          <fieldset className="form-fieldset form-fieldset--grid">
            <legend>Dirección</legend>

            <label className="field">
              <span>Calle</span>
              <input name="street" value={formData.street} onChange={handleChange} />
            </label>

            <label className="field">
              <span>Número</span>
              <input
                name="streetNumber"
                value={formData.streetNumber}
                onChange={handleChange}
              />
            </label>

            <label className="field">
              <span>Código postal</span>
              <input
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
              />
            </label>

            <label className="field">
              <span>Localidad</span>
              <input name="locality" value={formData.locality} onChange={handleChange} />
            </label>

            <label className="field">
              <span>Provincia</span>
              <input name="province" value={formData.province} onChange={handleChange} />
            </label>

            <label className="field field--wide">
              <span>Link de Google Maps (opcional)</span>
              <input
                name="googleMapsUrl"
                type="url"
                placeholder="https://maps.app.goo.gl/..."
                value={formData.googleMapsUrl}
                onChange={handleChange}
              />
            </label>
          </fieldset>

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
        <p>Cargando lugares...</p>
      ) : venues.length === 0 ? (
        <p>Todavía no hay lugares cargados.</p>
      ) : (
        <ul className="card-list">
          {venues.map((venue) => (
            <li key={venue.id} className="card">
              <h3>{venue.name}</h3>
              <p>
                {venue.address.street} {venue.address.streetNumber},{' '}
                {venue.address.locality}, {venue.address.province} (CP{' '}
                {venue.address.postalCode})
              </p>
              {venue.address.googleMapsUrl && (
                <a
                  href={venue.address.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card__link"
                >
                  Ver en Google Maps
                </a>
              )}
              <div className="card__actions">
                <button type="button" onClick={() => openEditForm(venue)}>
                  Editar
                </button>
                <button
                  type="button"
                  className="btn--danger"
                  onClick={() => handleDelete(venue)}
                  disabled={deletingId === venue.id}
                >
                  {deletingId === venue.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default VenuesPage;
