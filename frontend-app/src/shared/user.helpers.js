import { localToday } from '../constants/statuses.js';
import { REQUIRED_USER_FIELDS } from './user.data.js';

// La contraseña no se trae del backend: si queda en blanco no se envía y el
// backend conserva la actual.
export function userToFormData(user) {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    identityDocument: user.identityDocument,
    password: '',
    birthDate: user.birthDate ?? '',
  };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mismo criterio que isValidDateString del backend: 'YYYY-MM-DD' de un día real.
function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

// Devuelve todos los errores a la vez: { campo: mensaje }.
export function getUserFormErrors(formData, { editing = false } = {}) {
  const errors = {};
  for (const [field, message] of REQUIRED_USER_FIELDS) {
    if (!formData[field].trim()) {
      errors[field] = message;
    }
  }

  if (!errors.email && !EMAIL_PATTERN.test(formData.email.trim())) {
    errors.email = 'Ingresá un email válido.';
  }

  if (!editing && !formData.password.trim()) {
    errors.password = 'La contraseña es obligatoria.';
  }

  if (!errors.birthDate && formData.birthDate) {
    if (!isValidDate(formData.birthDate)) {
      errors.birthDate = 'La fecha de nacimiento no es válida.';
    } else if (formData.birthDate > localToday()) {
      errors.birthDate = 'La fecha de nacimiento no puede ser futura.';
    }
  }

  return errors;
}

// Devuelve el primer error encontrado o null.
export function validateUserForm(formData, options) {
  return Object.values(getUserFormErrors(formData, options))[0] ?? null;
}

export function buildUserPayload(formData) {
  return {
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    email: formData.email.trim(),
    identityDocument: formData.identityDocument.trim(),
    birthDate: formData.birthDate,
    ...(formData.password.trim() ? { password: formData.password.trim() } : {}),
  };
}

export function userDeleteConfirmMessage(user) {
  return `¿Seguro que querés eliminar a "${user.firstName} ${user.lastName}"? Esta acción no se puede deshacer.`;
}
