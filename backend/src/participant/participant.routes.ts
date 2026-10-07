import { Router } from 'express';
import { validateUserInput } from '../user/user.controller.js';
import {
  sanitizeParticipantInput,
  findAll,
  findOne,
  add,
  update,
  remove,
} from './participant.controller.js';

export const participantRouter = Router();

participantRouter.get('/', findAll);
participantRouter.get('/:id', findOne);
participantRouter.post('/', sanitizeParticipantInput, validateUserInput, add);
participantRouter.put('/:id', sanitizeParticipantInput, validateUserInput, update);
participantRouter.patch('/:id', sanitizeParticipantInput, validateUserInput, update);
participantRouter.delete('/:id', remove);
