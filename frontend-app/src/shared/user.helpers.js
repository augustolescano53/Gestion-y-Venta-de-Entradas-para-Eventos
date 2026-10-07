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

// Devuelve el primer error encontrado o null.
export function validateUserForm(formData, { editing = false } = {}) {
  for (const [field, message] of REQUIRED_USER_FIELDS) {
    if (!formData[field].trim()) {
      return message;
    }
  }

  if (!editing && !formData.password.trim()) {
    return 'La contraseña es obligatoria.';
  }

  if (formData.birthDate && formData.birthDate > localToday()) {
    return 'La fecha de nacimiento no puede ser futura.';
  }

  return null;
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
