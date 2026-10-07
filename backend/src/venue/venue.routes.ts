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

export const venueRouter = Router();

venueRouter.get('/', findAll);
venueRouter.get('/:id', findOne);
venueRouter.post('/', sanitizeVenueInput, validateVenueInput, add);
venueRouter.put('/:id', sanitizeVenueInput, validateVenueInput, update);
venueRouter.patch('/:id', sanitizeVenueInput, validateVenueInput, update);
venueRouter.delete('/:id', remove);

venueRouter.use('/:idVenue/tickettype', tickettypeRouter);
venueRouter.use('/:idVenue/event', eventRouter);
