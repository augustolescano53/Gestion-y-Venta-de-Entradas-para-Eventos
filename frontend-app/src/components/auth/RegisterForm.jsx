import { useState } from 'react';
import { Link } from 'react-router-dom';
import FormField from '../FormField.jsx';
import { useAuth } from '../../auth/useAuth.js';
import { localToday } from '../../constants/statuses.js';
import { PUBLIC_PATHS } from '../../shared/routes.js';
import { DNI_MAX_LENGTH, sanitizeDniInput } from '../../shared/user.helpers.js';
import {
  EMPTY_REGISTER_FORM,
  getRegisterErrors,
  normalizeRegisterForm,
  registerErrorMessage,
} from './auth.helpers.js';

// Único formulario de registro: lo usan /register y el modal de compra. Solo
// pide los campos del modelo User. Al registrarse se inicia sesión.
function RegisterForm({ onSuccess, onSwitchToLogin }) {
  const { register } = useAuth();
  const [formData, setFormData] = useState(EMPTY_REGISTER_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name } = event.target;
    const value = name === 'identityDocument' ? sanitizeDniInput(event.target.value) : event.target.value;
    const nextData = { ...formData, [name]: value };
    setFormData(nextData);
    if (submitAttempted) setFieldErrors(getRegisterErrors(nextData));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setSubmitAttempted(true);

    const errors = getRegisterErrors(formData);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError('Revisá los campos marcados.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const user = await register(normalizeRegisterForm(formData));
      onSuccess?.(user);
    } catch (error) {
      setFieldErrors(error.fieldErrors ?? {});
      setFormError(registerErrorMessage(error));
      setSubmitting(false);
    }
  }

  const fieldProps = (name) => ({
    name,
    value: formData[name],
    onChange: handleChange,
    'aria-invalid': Boolean(fieldErrors[name]),
  });

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {formError && (
        <p className="banner banner--error" role="alert">
          {formError}
        </p>
      )}

      <div className="form-grid">
        <FormField label="Nombre" error={fieldErrors.firstName}>
          <input autoComplete="given-name" {...fieldProps('firstName')} />
        </FormField>
        <FormField label="Apellido" error={fieldErrors.lastName}>
          <input autoComplete="family-name" {...fieldProps('lastName')} />
        </FormField>
      </div>

      <FormField label="Email" error={fieldErrors.email}>
        <input type="email" autoComplete="email" {...fieldProps('email')} />
      </FormField>

      <div className="form-grid">
        <FormField label="DNI" error={fieldErrors.identityDocument}>
          <input
            inputMode="numeric"
            maxLength={DNI_MAX_LENGTH}
            placeholder="Ej: 40123456"
            {...fieldProps('identityDocument')}
          />
        </FormField>
        <FormField label="Fecha de nacimiento" error={fieldErrors.birthDate}>
          <input type="date" max={localToday()} {...fieldProps('birthDate')} />
        </FormField>
      </div>

      <div className="form-grid">
        <FormField label="Contraseña" error={fieldErrors.password}>
          <input type="password" autoComplete="new-password" {...fieldProps('password')} />
        </FormField>
        <FormField label="Repetir contraseña" error={fieldErrors.confirmPassword}>
          <input type="password" autoComplete="new-password" {...fieldProps('confirmPassword')} />
        </FormField>
      </div>

      <button type="submit" className="btn btn--primary w-full" disabled={submitting}>
        {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
      </button>

      <p className="auth-form__switch">
        ¿Ya tenés una cuenta?{' '}
        {onSwitchToLogin ? (
          <button type="button" className="auth-form__link" onClick={onSwitchToLogin}>
            Iniciá sesión
          </button>
        ) : (
          <Link to={PUBLIC_PATHS.login}>Iniciá sesión</Link>
        )}
      </p>
    </form>
  );
}

export default RegisterForm;
