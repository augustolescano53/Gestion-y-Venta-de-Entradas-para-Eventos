import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getParticipant, updateParticipant } from '../../../api/participants.js';
import FormField from '../../../components/FormField.jsx';
import { ErrorState, LoadingState } from '../../../components/miCuenta/AccountStates.jsx';
import { localToday } from '../../../constants/statuses.js';
import { getCurrentParticipantId } from '../../../shared/currentUser.js';
import { buildUserPayload, getUserFormErrors, userToFormData } from '../../../shared/user.helpers.js';
import { userUpdateErrorMessage } from '../miCuenta.helpers.js';

const EDITABLE_FIELDS = ['firstName', 'lastName', 'email', 'identityDocument', 'birthDate'];

function hasChanges(formData, original) {
  return EDITABLE_FIELDS.some((field) => formData[field].trim() !== original[field].trim());
}

function InformacionPersonalPage() {
  const participantId = getCurrentParticipantId();

  const [original, setOriginal] = useState(null);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadParticipant() {
    setLoading(true);
    setLoadError(null);
    try {
      const data = userToFormData(await getParticipant(participantId));
      setOriginal(data);
      setFormData(data);
    } catch {
      setLoadError('No pudimos cargar tus datos. Intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadParticipant();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantId]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setFieldErrors((previous) => {
      const next = { ...previous };
      delete next[name];
      return next;
    });
  }

  function handleCancel() {
    setFormData(original);
    setFieldErrors({});
    setSubmitError(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const errors = getUserFormErrors(formData, { editing: true });
    setFieldErrors(errors);
    setSubmitError(null);
    if (Object.keys(errors).length > 0) return;

    if (!hasChanges(formData, original)) {
      toast.info('No hay cambios para guardar.');
      return;
    }

    setSubmitting(true);
    try {
      const updated = userToFormData(await updateParticipant(participantId, buildUserPayload(formData)));
      setOriginal(updated);
      setFormData(updated);
      toast.success('Datos actualizados correctamente.');
    } catch (error) {
      setFieldErrors(error.fieldErrors ?? {});
      setSubmitError(userUpdateErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState message="Cargando tus datos..." />;
  if (loadError) return <ErrorState message={loadError} onRetry={loadParticipant} />;

  const dirty = hasChanges(formData, original);

  return (
    <form className="form-card" onSubmit={handleSubmit} noValidate>
      <div>
        <h2>Información personal</h2>
        <p className="form-note">Revisá y actualizá tus datos.</p>
      </div>

      {submitError && (
        <p className="banner banner--error" role="alert">
          {submitError}
        </p>
      )}

      <div className="form-grid">
        <FormField label="Nombre" error={fieldErrors.firstName}>
          <input name="firstName" autoComplete="given-name" value={formData.firstName} onChange={handleChange} />
        </FormField>

        <FormField label="Apellido" error={fieldErrors.lastName}>
          <input name="lastName" autoComplete="family-name" value={formData.lastName} onChange={handleChange} />
        </FormField>

        <FormField label="Email" error={fieldErrors.email}>
          <input name="email" type="email" autoComplete="email" value={formData.email} onChange={handleChange} />
        </FormField>

        <FormField label="Documento" error={fieldErrors.identityDocument}>
          <input name="identityDocument" value={formData.identityDocument} onChange={handleChange} />
        </FormField>

        <FormField label="Fecha de nacimiento" error={fieldErrors.birthDate}>
          <input
            name="birthDate"
            type="date"
            max={localToday()}
            autoComplete="bday"
            value={formData.birthDate}
            onChange={handleChange}
          />
        </FormField>
      </div>

      <div className="form-actions">
        <button type="button" onClick={handleCancel} disabled={submitting || !dirty}>
          Cancelar
        </button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}

export default InformacionPersonalPage;
