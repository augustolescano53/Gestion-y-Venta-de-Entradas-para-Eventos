import { Router } from 'express';
import {
  sanitizeLugarEventoInput,
  findAll,
  findOne,
  add,
  update,
  remove,
} from './lugarevento.controller.js';

export const lugarEventoRouter = Router();

lugarEventoRouter.get('/', findAll);
lugarEventoRouter.get('/:id', findOne);
lugarEventoRouter.post('/', sanitizeLugarEventoInput, add);
lugarEventoRouter.put('/:id', sanitizeLugarEventoInput, update);
lugarEventoRouter.patch('/:id', sanitizeLugarEventoInput, update);
lugarEventoRouter.delete('/:id', remove);
