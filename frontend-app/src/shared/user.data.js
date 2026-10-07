// Participantes y organizadores comparten el formulario de usuario
// (backend/src/user/user.entity.ts).

export const EMPTY_USER_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  identityDocument: '',
  password: '',
  birthDate: '',
};

export const REQUIRED_USER_FIELDS = [
  ['firstName', 'El nombre es obligatorio.'],
  ['lastName', 'El apellido es obligatorio.'],
  ['email', 'El email es obligatorio.'],
  ['identityDocument', 'El documento es obligatorio.'],
  ['birthDate', 'La fecha de nacimiento es obligatoria.'],
];
