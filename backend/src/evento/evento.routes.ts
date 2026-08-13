import { Router } from 'express';
import {
  sanitizeEventoInput,
  findAll,
  findOne,
  add,
  update,
  remove,
} from './evento.controller.js';

export const eventoRouter = Router();

eventoRouter.get('/', findAll);
eventoRouter.get('/:id', findOne);
eventoRouter.post('/', sanitizeEventoInput, add);
eventoRouter.put('/:id', sanitizeEventoInput, update);
eventoRouter.patch('/:id', sanitizeEventoInput, update);
eventoRouter.delete('/:id', remove);
