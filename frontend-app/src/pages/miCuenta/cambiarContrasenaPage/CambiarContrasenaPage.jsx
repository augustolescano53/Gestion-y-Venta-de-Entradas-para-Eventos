import { useState } from 'react';
import { toast } from 'react-toastify';
import { changeParticipantPassword } from '../../../api/participants.js';
import FormField from '../../../components/FormField.jsx';
import { getCurrentParticipantId } from '../../../shared/currentUser.js';

const EMPTY_PASSWORDS = { currentPassword: '', newPassword: '', repeatPassword: '' };

// Reglas del backend (PATCH /participant/:id/password): la nueva no puede
// quedar vacía ni ser igual a la actual.
function validatePasswords({ currentPassword, newPassword, repeatPassword }) {
  const errors = {};
  if (!currentPassword) errors.currentPassword = 'Ingresá tu contraseña actual.';
  if (!newPassword) errors.newPassword = 'Ingresá una nueva contraseña.';
  else if (!newPassword.trim()) errors.newPassword = 'La nueva contraseña no cumple los requisitos.';
  else if (currentPassword && newPassword.trim() === currentPassword.trim()) {
    errors.newPassword = 'La nueva contraseña debe ser distinta de la actual.';
  }
  if (!repeatPassword) errors.repeatPassword = 'Repetí la nueva contraseña.';
  else if (newPassword && repeatPassword !== newPassword) errors.repeatPassword = 'Las contraseñas no coinciden.';
  return errors;
}

function CambiarContrasenaPage() {
  const [passwords, setPasswords] = useState(EMPTY_PASSWORDS);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setPasswords((previous) => ({ ...previous, [name]: value }));
    setFieldErrors((previous) => {
      const next = { ...previous };
      delete next[name];
      return next;
    });
  }

  function handleCancel() {
    setPasswords(EMPTY_PASSWORDS);
    setFieldErrors({});
    setSubmitError(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const errors = validatePasswords(passwords);
    setFieldErrors(errors);
    setSubmitError(null);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await changeParticipantPassword(getCurrentParticipantId(), {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords(EMPTY_PASSWORDS);
      toast.success('Contraseña actualizada correctamente.');
    } catch (error) {
      const backendErrors = error.status === 400 ? (error.fieldErrors ?? {}) : {};
      setFieldErrors(backendErrors);
      if (Object.keys(backendErrors).length === 0) {
        setSubmitError('No se pudo cambiar la contraseña. Intentá nuevamente.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form-card max-w-xl" onSubmit={handleSubmit} noValidate>
      <div>
        <h2>Cambiar contraseña</h2>
        <p className="form-note">Para tu seguridad, primero ingresá tu contraseña actual.</p>
      </div>

      {submitError && (
        <p className="banner banner--error" role="alert">
          {submitError}
        </p>
      )}

      <FormField label="Contraseña actual" error={fieldErrors.currentPassword}>
        <input
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          value={passwords.currentPassword}
          onChange={handleChange}
        />
      </FormField>

      <FormField label="Nueva contraseña" error={fieldErrors.newPassword}>
        <input
          name="newPassword"
          type="password"
          autoComplete="new-password"
          value={passwords.newPassword}
          onChange={handleChange}
        />
      </FormField>

      <FormField label="Repetir nueva contraseña" error={fieldErrors.repeatPassword}>
        <input
          name="repeatPassword"
          type="password"
          autoComplete="new-password"
          value={passwords.repeatPassword}
          onChange={handleChange}
        />
      </FormField>

      <div className="form-actions">
        <button type="button" onClick={handleCancel} disabled={submitting}>
          Cancelar
        </button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Cambiando...' : 'Cambiar contraseña'}
        </button>
      </div>
    </form>
  );
}

export default CambiarContrasenaPage;
