import { Router } from "express";
import { sanitizeEventInput, findAllEvents, findByOrganizer, findAll, findOne, add, update, cancel, remove } from "./event.controller.js";

export const eventRouter = Router({ mergeParams: true })

eventRouter.get('/', findAll)
eventRouter.get('/:idEvent', findOne)
eventRouter.post('/', sanitizeEventInput, add)
eventRouter.put('/:idEvent', sanitizeEventInput, update)
eventRouter.patch('/:idEvent/cancel', cancel)
eventRouter.patch('/:idEvent', sanitizeEventInput, update)
eventRouter.delete('/:idEvent', remove)

export const allEventsRouter = Router()

allEventsRouter.get('/', findAllEvents)

// Eventos de un organizador ("Mi cuenta"): mismos handlers, que con
// :idOrganizer verifican la pertenencia y los campos permitidos. Sin eliminar.
export const organizerEventRouter = Router({ mergeParams: true })

organizerEventRouter.get('/event', findByOrganizer)
organizerEventRouter.post('/venue/:idVenue/event', sanitizeEventInput, add)
organizerEventRouter.get('/venue/:idVenue/event/:idEvent', findOne)
organizerEventRouter.put('/venue/:idVenue/event/:idEvent', sanitizeEventInput, update)
organizerEventRouter.patch('/venue/:idVenue/event/:idEvent/cancel', cancel)
