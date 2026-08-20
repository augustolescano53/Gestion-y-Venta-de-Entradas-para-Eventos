import { Router } from 'express';
import {
  sanitizeVenueInput,
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
venueRouter.post('/', sanitizeVenueInput, add);
venueRouter.put('/:id', sanitizeVenueInput, update);
venueRouter.patch('/:id', sanitizeVenueInput, update);
venueRouter.delete('/:id', remove);

venueRouter.use('/:idVenue/tickettype', tickettypeRouter);
venueRouter.use('/:idVenue/event', eventRouter);
