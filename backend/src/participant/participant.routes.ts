import { Router } from 'express';
import { validateUserInput } from '../user/user.controller.js';
import { requireAdmin, requireSelfOrAdmin } from '../shared/auth.js';
import {
  sanitizeParticipantInput,
  findAll,
  findOne,
  add,
  update,
  remove,
  changePassword,
} from './participant.controller.js';

export const participantRouter = Router();

const selfOrAdmin = requireSelfOrAdmin('participant');

// POST / es el registro público (el login está en /api/user/login).
participantRouter.get('/', requireAdmin, findAll);
participantRouter.get('/:id', selfOrAdmin, findOne);
participantRouter.post('/', sanitizeParticipantInput, validateUserInput, add);
participantRouter.put('/:id', selfOrAdmin, sanitizeParticipantInput, validateUserInput, update);
participantRouter.patch('/:id/password', selfOrAdmin, changePassword);
participantRouter.patch('/:id', selfOrAdmin, sanitizeParticipantInput, validateUserInput, update);
participantRouter.delete('/:id', requireAdmin, remove);
