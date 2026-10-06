import { useEffect, useState } from 'react';
import {
  getOrganizers,
  createOrganizer,
  updateOrganizer,
  deleteOrganizer,
} from '../api/organizers.js';
import { localToday } from '../constants/statuses.js';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  identityDocument: '',
  password: '',
  birthDate: '',
};

function OrganizersPage() {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrganizer, setEditingOrganizer] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadOrganizers() {
    setLoading(true);
    setListError(null);
    try {
      const data = await getOrganizers();
      setOrganizers(data);
    } catch (error) {
      setListError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrganizers();
  }, []);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  function openCreateForm() {
    setEditingOrganizer(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
    setIsFormOpen(true);
  }

  function openEditForm(organizer) {
    setEditingOrganizer(organizer);
    // La contraseña no se trae del backend: si queda en blanco no se envía
    // y el backend conserva la actual.
    setFormData({
      firstName: organizer.firstName,
      lastName: organizer.lastName,
      email: organizer.email,
      identityDocument: organizer.identityDocument,
      password: '',
      birthDate: organizer.birthDate ?? '',
    });
    setFormError(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingOrganizer(null);
    setFormError(null);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  }

  function validateForm() {
    const requiredFields = [
      ['firstName', 'El nombre es obligatorio.'],
      ['lastName', 'El apellido es obligatorio.'],
      ['email', 'El email es obligatorio.'],
      ['identityDocument', 'El documento es obligatorio.'],
    ];

    for (const [field, message] of requiredFields) {
      if (!formData[field].trim()) {
        return message;
      }
    }

    if (!editingOrganizer && !formData.password.trim()) {
      return 'La contraseña es obligatoria.';
    }

    if (formData.birthDate && formData.birthDate > localToday()) {
      return 'La fecha de nacimiento no puede ser futura.';
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
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      identityDocument: formData.identityDocument.trim(),
      birthDate: formData.birthDate || null,
      ...(formData.password.trim() ? { password: formData.password.trim() } : {}),
    };

    setSubmitting(true);
    setFormError(null);
    try {
      if (editingOrganizer) {
        await updateOrganizer(editingOrganizer.id, payload);
        setSuccessMessage('Organizador actualizado correctamente.');
      } else {
        await createOrganizer(payload);
        setSuccessMessage('Organizador creado correctamente.');
      }
      closeForm();
      await loadOrganizers();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(organizer) {
    const confirmed = window.confirm(
      `¿Seguro que querés eliminar a "${organizer.firstName} ${organizer.lastName}"? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    setDeletingId(organizer.id);
    setListError(null);
    try {
      await deleteOrganizer(organizer.id);
      setOrganizers((previous) => previous.filter((o) => o.id !== organizer.id));
      setSuccessMessage('Organizador eliminado correctamente.');
    } catch (error) {
      // El backend todavía no valida antes de borrar un organizador con
      // eventos: ese caso puede mostrar un error genérico.
      setListError(error.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section>
      <div className="page-toolbar">
        <h2>Organizadores</h2>
        <button type="button" className="btn btn--primary" onClick={openCreateForm}>
          + Nuevo organizador
        </button>
      </div>

      {successMessage && <p className="banner banner--success">{successMessage}</p>}
      {listError && (
        <p className="banner banner--error">
          {listError}{' '}
          <button type="button" className="btn" onClick={loadOrganizers}>
            Reintentar
          </button>
        </p>
      )}

      {isFormOpen && (
        <form className="form-card" onSubmit={handleSubmit}>
          <h3>{editingOrganizer ? 'Editar organizador' : 'Nuevo organizador'}</h3>

          {formError && <p className="banner banner--error">{formError}</p>}

          <div className="form-grid">
            <label className="field">
              <span>Nombre</span>
              <input name="firstName" value={formData.firstName} onChange={handleChange} />
            </label>

            <label className="field">
              <span>Apellido</span>
              <input name="lastName" value={formData.lastName} onChange={handleChange} />
            </label>

            <label className="field">
              <span>Email</span>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </label>

            <label className="field">
              <span>Documento</span>
              <input
                name="identityDocument"
                value={formData.identityDocument}
                onChange={handleChange}
              />
            </label>

            <label className="field">
              <span>Fecha de nacimiento (opcional)</span>
              <input
                name="birthDate"
                type="date"
                max={localToday()}
                value={formData.birthDate}
                onChange={handleChange}
              />
            </label>

            <label className="field field--wide">
              <span>Contraseña</span>
              <input
                name="password"
                type="password"
                placeholder={editingOrganizer ? 'Dejar en blanco para no cambiarla' : ''}
                value={formData.password}
                onChange={handleChange}
              />
            </label>
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
        <p>Cargando organizadores...</p>
      ) : organizers.length === 0 ? (
        <p>Todavía no hay organizadores cargados.</p>
      ) : (
        <ul className="card-list">
          {organizers.map((organizer) => (
            <li key={organizer.id} className="card">
              <h3>
                {organizer.firstName} {organizer.lastName}
              </h3>
              <p>{organizer.email}</p>
              <p>Documento: {organizer.identityDocument}</p>
              {organizer.birthDate && <p>Fecha de nacimiento: {organizer.birthDate}</p>}
              <div className="card__actions">
                <button type="button" onClick={() => openEditForm(organizer)}>
                  Editar
                </button>
                <button
                  type="button"
                  className="btn--danger"
                  onClick={() => handleDelete(organizer)}
                  disabled={deletingId === organizer.id}
                >
                  {deletingId === organizer.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default OrganizersPage;
