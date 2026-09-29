import { useEffect, useState } from 'react';
import { getVenues, createVenue, updateVenue, deleteVenue } from '../api/venues.js';
import './VenuesPage.css';

// Valores iniciales del formulario. Lo guardamos como constante para no
// repetir el objeto cada vez que se abre "Nuevo lugar".
const EMPTY_FORM = {
  name: '',
  street: '',
  streetNumber: '',
  postalCode: '',
  locality: '',
  province: '',
  googleMapsUrl: '',
};

// Esta es la ÚNICA página de la CRUD de Venue: muestra el listado Y el
// formulario de alta/edición en el mismo componente. Cuando tengamos más
// pantallas y se repita lógica entre ellas, ahí sí vale la pena separar
// en componentes más chicos.
function VenuesPage() {
  // useState guarda un "estado": un valor que React recuerda entre
  // renders y que, al cambiar (con el "setter", ej. setVenues), hace que
  // el componente se vuelva a dibujar con el valor nuevo.
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null); // null = alta, venue = edición
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

  // useEffect ejecuta código después de que el componente se muestra en
  // pantalla ("efecto secundario"). Con el segundo argumento en [] (lista
  // de dependencias vacía), el código de adentro corre una sola vez, al
  // montar el componente: es el lugar típico para pedir datos a una API.
  useEffect(() => {
    loadVenues();
  }, []);

  // El mensaje de éxito se muestra un ratito y se borra solo, para no
  // dejar un cartel verde pegado en la pantalla para siempre.
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer); // limpieza: cancela el timer anterior
  }, [successMessage]);

  function openCreateForm() {
    setEditingVenue(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
    setIsFormOpen(true);
  }

  function openEditForm(venue) {
    setEditingVenue(venue);
    setFormData({
      name: venue.name,
      street: venue.address.street,
      streetNumber: venue.address.streetNumber,
      postalCode: venue.address.postalCode,
      locality: venue.address.locality,
      province: venue.address.province,
      googleMapsUrl: venue.address.googleMapsUrl ?? '',
    });
    setFormError(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingVenue(null);
    setFormError(null);
  }

  // Handler genérico para los inputs: cada <input> tiene su "name" igual
  // a la clave del formData que le corresponde, así que un solo handler
  // sirve para todos ("input controlado": el value siempre sale del
  // estado, y cada tecleo dispara onChange y actualiza ese estado).
  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  }

  // Valida en el cliente lo mismo que valida el backend, para avisarle al
  // usuario sin esperar el viaje de ida y vuelta a la API. El backend
  // vuelve a validar igual: nunca hay que confiar solo en el frontend.
  function validateForm() {
    const requiredFields = [
      ['name', 'El nombre del lugar es obligatorio.'],
      ['street', 'La calle es obligatoria.'],
      ['streetNumber', 'El número es obligatorio.'],
      ['postalCode', 'El código postal es obligatorio.'],
      ['locality', 'La localidad es obligatoria.'],
      ['province', 'La provincia es obligatoria.'],
    ];

    for (const [field, message] of requiredFields) {
      if (!formData[field].trim()) {
        return message;
      }
    }

    if (formData.googleMapsUrl.trim()) {
      try {
        const url = new URL(formData.googleMapsUrl.trim());
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          return 'El enlace de Google Maps debe empezar con http:// o https://.';
        }
      } catch {
        return 'El enlace de Google Maps no es una URL válida.';
      }
    }

    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault(); // evita que el navegador recargue la página al enviar el form

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      address: {
        street: formData.street.trim(),
        streetNumber: formData.streetNumber.trim(),
        postalCode: formData.postalCode.trim(),
        locality: formData.locality.trim(),
        province: formData.province.trim(),
        ...(formData.googleMapsUrl.trim()
          ? { googleMapsUrl: formData.googleMapsUrl.trim() }
          : {}),
      },
    };

    setSubmitting(true);
    setFormError(null);
    try {
      if (editingVenue) {
        await updateVenue(editingVenue.id, payload);
        setSuccessMessage('Lugar actualizado correctamente.');
      } else {
        await createVenue(payload);
        setSuccessMessage('Lugar creado correctamente.');
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
    const confirmed = window.confirm(
      `¿Seguro que querés eliminar "${venue.name}"? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    setDeletingId(venue.id);
    setListError(null);
    try {
      await deleteVenue(venue.id);
      setVenues((previous) => previous.filter((v) => v.id !== venue.id));
      setSuccessMessage('Lugar eliminado correctamente.');
    } catch (error) {
      // Acá cae, por ejemplo, el 409 que devuelve el backend cuando el
      // lugar todavía tiene eventos o tipos de entrada asociados.
      setListError(error.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="venues-page">
      <div className="venues-page__toolbar">
        <h2>Lugares</h2>
        <button type="button" className="btn btn--primary" onClick={openCreateForm}>
          + Nuevo lugar
        </button>
      </div>

      {/* Renderizado condicional: el && solo muestra el elemento de la
          derecha cuando la condición de la izquierda es verdadera. */}
      {successMessage && <p className="banner banner--success">{successMessage}</p>}
      {listError && <p className="banner banner--error">{listError}</p>}

      {isFormOpen && (
        <form className="venue-form" onSubmit={handleSubmit}>
          <h3>{editingVenue ? 'Editar lugar' : 'Nuevo lugar'}</h3>

          {formError && <p className="banner banner--error">{formError}</p>}

          <label className="field">
            <span>Nombre</span>
            <input name="name" value={formData.name} onChange={handleChange} />
          </label>

          <fieldset className="address-fieldset">
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

          <div className="venue-form__actions">
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
        // Al recorrer una lista con .map(), cada elemento necesita una
        // prop "key" única y estable (acá, el id) para que React sepa
        // qué tarjeta cambió, se agregó o se borró entre un render y otro.
        <ul className="venue-list">
          {venues.map((venue) => (
            <li key={venue.id} className="venue-card">
              <h3>{venue.name}</h3>
              <p>
                {venue.address.street} {venue.address.streetNumber},{' '}
                {venue.address.locality}, {venue.address.province} (CP{' '}
                {venue.address.postalCode})
              </p>
              {venue.address.googleMapsUrl && (
                // target="_blank" abre en otra pestaña; rel="noopener
                // noreferrer" es la forma segura de hacerlo: evita que la
                // pestaña nueva pueda acceder a "window.opener" (la
                // pestaña original) y bloquea el envío del referrer.
                <a
                  href={venue.address.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="venue-card__map-link"
                >
                  Ver en Google Maps
                </a>
              )}
              <div className="venue-card__actions">
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
