import { Router } from 'express';
import {
  sanitizeEventInput,
  findAll,
  findOne,
  add,
  update,
  remove,
} from './event.controller.js';

export const eventRouter = Router();

eventRouter.get('/', findAll);
eventRouter.get('/:id', findOne);
eventRouter.post('/', sanitizeEventInput, add);
eventRouter.put('/:id', sanitizeEventInput, update);
eventRouter.patch('/:id', sanitizeEventInput, update);
eventRouter.delete('/:id', remove);
