import { Router } from 'express';
import {
  sanitizeVenueInput,
  validateVenueInput,
  findAll,
  findOne,
  add,
  update,
  remove,
} from './venue.controller.js';
import { tickettypeRouter } from '../tickettype/tickettype.routes.js';
import { eventRouter } from '../event/event.routes.js';
import { requireAdmin } from '../shared/auth.js';

export const venueRouter = Router();

// Lectura pública (detalle de eventos, formulario del organizador); el resto
// solo el administrador.
venueRouter.get('/', findAll);
venueRouter.get('/:id', findOne);
venueRouter.post('/', requireAdmin, sanitizeVenueInput, validateVenueInput, add);
venueRouter.put('/:id', requireAdmin, sanitizeVenueInput, validateVenueInput, update);
venueRouter.patch('/:id', requireAdmin, sanitizeVenueInput, validateVenueInput, update);
venueRouter.delete('/:id', requireAdmin, remove);

venueRouter.use('/:idVenue/tickettype', tickettypeRouter);
venueRouter.use('/:idVenue/event', eventRouter);
