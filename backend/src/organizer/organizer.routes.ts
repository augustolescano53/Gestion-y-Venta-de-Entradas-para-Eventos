import { Router } from "express";
import { changePasswordFor, validateUserInput } from "../user/user.controller.js";
import { Organizer } from "./organizer.entity.js";
import { organizerEventRouter } from "../event/event.routes.js";
import { sanitizeOrganizerInput, findAll, findOne, add, update, remove } from "./organizer.controller.js";

export const organizerRouter = Router()

organizerRouter.get('/', findAll)
organizerRouter.get('/:id', findOne)
organizerRouter.post('/', sanitizeOrganizerInput, validateUserInput, add)
organizerRouter.put('/:id', sanitizeOrganizerInput, validateUserInput, update)
organizerRouter.patch('/:id/password', changePasswordFor(Organizer, 'El organizador no existe.'))
organizerRouter.patch('/:id', sanitizeOrganizerInput, validateUserInput, update)
organizerRouter.delete('/:id', remove)

organizerRouter.use('/:idOrganizer', organizerEventRouter)
