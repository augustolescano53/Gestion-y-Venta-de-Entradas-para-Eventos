import { changeOrganizerPassword, getOrganizer, updateOrganizer } from '../api/organizers.js';
import { changeParticipantPassword, getParticipant, updateParticipant } from '../api/participants.js';
import { ROLES } from './currentUser.js';

// Datos personales y contraseña de "Mi cuenta" según el tipo de usuario.
const ACCOUNT_APIS = {
  [ROLES.PARTICIPANT]: { get: getParticipant, update: updateParticipant, changePassword: changeParticipantPassword },
  [ROLES.ORGANIZER]: { get: getOrganizer, update: updateOrganizer, changePassword: changeOrganizerPassword },
};

export function accountApi(role) {
  return ACCOUNT_APIS[role] ?? ACCOUNT_APIS[ROLES.PARTICIPANT];
}
