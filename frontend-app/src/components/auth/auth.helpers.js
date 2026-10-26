import { EMPTY_USER_FORM } from '../../shared/user.data.js';
import { EMAIL_PATTERN, getUserFormErrors } from '../../shared/user.helpers.js';

export const EMPTY_LOGIN_FORM = { email: '', password: '' };

export const EMPTY_REGISTER_FORM = { ...EMPTY_USER_FORM, confirmPassword: '' };

const NAME_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]+$/;
const DNI_PATTERN = /^\d{7,8}$/;

export function getLoginErrors(formData) {
  const errors = {};
  const email = formData.email.trim();
  if (!email) errors.email = 'Ingresá tu email.';
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Ingresá un email válido.';
  if (!formData.password) errors.password = 'Ingresá tu contraseña.';
  return errors;
}

// Parte de las validaciones del formulario de usuario de los CRUD y agrega
// las propias del registro.
export function getRegisterErrors(formData) {
  const errors = getUserFormErrors(formData);
  for (const field of ['firstName', 'lastName']) {
    if (!errors[field] && !NAME_PATTERN.test(formData[field].trim())) {
      errors[field] = field === 'firstName'
        ? 'El nombre solo puede tener letras y espacios.'
        : 'El apellido solo puede tener letras y espacios.';
    }
  }
  if (!errors.identityDocument && !DNI_PATTERN.test(formData.identityDocument.replace(/\./g, '').trim())) {
    errors.identityDocument = 'El DNI debe tener 7 u 8 números, sin espacios.';
  }
  if (!errors.password && !formData.confirmPassword) {
    errors.confirmPassword = 'Repetí la contraseña.';
  } else if (!errors.password && formData.password.trim() !== formData.confirmPassword.trim()) {
    errors.confirmPassword = 'Las contraseñas no coinciden.';
  }
  return errors;
}

// El DNI se guarda sin puntos.
export function normalizeRegisterForm(formData) {
  return { ...formData, identityDocument: formData.identityDocument.replace(/\./g, '').trim() };
}

// Los errores del backend llegan como mensajes legibles solo en los casos
// previstos; el resto se reemplaza por un mensaje genérico.
export function loginErrorMessage(error) {
  return error.status === 401 ? 'Email o contraseña incorrectos.' : 'No pudimos iniciar sesión. Intentá nuevamente.';
}

export function registerErrorMessage(error) {
  if (error.status === 409 || error.status === 400) return error.message;
  return 'No pudimos crear tu cuenta. Intentá nuevamente.';
}
