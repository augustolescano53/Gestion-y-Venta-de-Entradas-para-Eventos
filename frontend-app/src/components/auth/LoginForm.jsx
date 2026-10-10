import { useState } from 'react';
import { Link } from 'react-router-dom';
import FormField from '../FormField.jsx';
import { useAuth } from '../../auth/useAuth.js';
import { PUBLIC_PATHS } from '../../shared/routes.js';
import { EMPTY_LOGIN_FORM, getLoginErrors, loginErrorMessage } from './auth.helpers.js';

// Único formulario de inicio de sesión: lo usan /login y el modal de compra.
// onSwitchToRegister cambia al registro dentro del modal; sin él se navega a
// /register.
function LoginForm({ onSuccess, onSwitchToRegister }) {
  const { login } = useAuth();
  const [formData, setFormData] = useState(EMPTY_LOGIN_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    const nextData = { ...formData, [name]: value };
    setFormData(nextData);
    if (submitAttempted) setFieldErrors(getLoginErrors(nextData));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setSubmitAttempted(true);

    const errors = getLoginErrors(formData);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setFormError(null);
    try {
      const user = await login(formData);
      onSuccess?.(user);
    } catch (error) {
      setFormError(loginErrorMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {formError && (
        <p className="banner banner--error" role="alert">
          {formError}
        </p>
      )}

      <FormField label="Email" error={fieldErrors.email}>
        <input
          name="email"
          type="email"
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          aria-invalid={Boolean(fieldErrors.email)}
        />
      </FormField>

      <FormField label="Contraseña" error={fieldErrors.password}>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          value={formData.password}
          onChange={handleChange}
          aria-invalid={Boolean(fieldErrors.password)}
        />
      </FormField>

      <button type="submit" className="btn btn--primary w-full" disabled={submitting}>
        {submitting ? 'Ingresando...' : 'Ingresar'}
      </button>

      <p className="auth-form__switch">
        ¿No tenés una cuenta?{' '}
        {onSwitchToRegister ? (
          <button type="button" className="auth-form__link" onClick={onSwitchToRegister}>
            Registrate ahora
          </button>
        ) : (
          <Link to={PUBLIC_PATHS.register}>Registrate ahora</Link>
        )}
      </p>
    </form>
  );
}

export default LoginForm;
