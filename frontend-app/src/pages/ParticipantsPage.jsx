import { useEffect, useState } from 'react';
import {
  getParticipants,
  createParticipant,
  updateParticipant,
  deleteParticipant,
} from '../api/participants.js';
import { localToday } from '../constants/statuses.js';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  identityDocument: '',
  password: '',
  birthDate: '',
};

function ParticipantsPage() {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadParticipants() {
    setLoading(true);
    setListError(null);
    try {
      const data = await getParticipants();
      setParticipants(data);
    } catch (error) {
      setListError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadParticipants();
  }, []);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  function openCreateForm() {
    setEditingParticipant(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
    setIsFormOpen(true);
  }

  function openEditForm(participant) {
    setEditingParticipant(participant);
    setFormData({
      firstName: participant.firstName,
      lastName: participant.lastName,
      email: participant.email,
      identityDocument: participant.identityDocument,
      password: '',
      birthDate: participant.birthDate ?? '',
    });
    setFormError(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingParticipant(null);
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

    if (!editingParticipant && !formData.password.trim()) {
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
      if (editingParticipant) {
        await updateParticipant(editingParticipant.id, payload);
        setSuccessMessage('Participante actualizado correctamente.');
      } else {
        await createParticipant(payload);
        setSuccessMessage('Participante creado correctamente.');
      }
      closeForm();
      await loadParticipants();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(participant) {
    const confirmed = window.confirm(
      `¿Seguro que querés eliminar a "${participant.firstName} ${participant.lastName}"? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    setDeletingId(participant.id);
    setListError(null);
    try {
      await deleteParticipant(participant.id);
      setParticipants((previous) => previous.filter((p) => p.id !== participant.id));
      setSuccessMessage('Participante eliminado correctamente.');
    } catch (error) {
      setListError(error.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section>
      <div className="page-toolbar">
        <h2>Participantes</h2>
        <button type="button" className="btn btn--primary" onClick={openCreateForm}>
          + Nuevo participante
        </button>
      </div>

      {successMessage && <p className="banner banner--success">{successMessage}</p>}
      {listError && (
        <p className="banner banner--error">
          {listError}{' '}
          <button type="button" className="btn" onClick={loadParticipants}>
            Reintentar
          </button>
        </p>
      )}

      {isFormOpen && (
        <form className="form-card" onSubmit={handleSubmit}>
          <h3>{editingParticipant ? 'Editar participante' : 'Nuevo participante'}</h3>

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
                placeholder={editingParticipant ? 'Dejar en blanco para no cambiarla' : ''}
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
        <p>Cargando participantes...</p>
      ) : participants.length === 0 ? (
        <p>Todavía no hay participantes cargados.</p>
      ) : (
        <ul className="card-list">
          {participants.map((participant) => (
            <li key={participant.id} className="card">
              <h3>
                {participant.firstName} {participant.lastName}
              </h3>
              <p>{participant.email}</p>
              <p>Documento: {participant.identityDocument}</p>
              {participant.birthDate && <p>Fecha de nacimiento: {participant.birthDate}</p>}
              <div className="card__actions">
                <button type="button" onClick={() => openEditForm(participant)}>
                  Editar
                </button>
                <button
                  type="button"
                  className="btn--danger"
                  onClick={() => handleDelete(participant)}
                  disabled={deletingId === participant.id}
                >
                  {deletingId === participant.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default ParticipantsPage;
