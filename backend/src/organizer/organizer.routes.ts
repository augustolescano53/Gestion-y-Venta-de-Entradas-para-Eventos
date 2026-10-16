import { Router } from "express";
import { changePasswordFor, validateUserInput } from "../user/user.controller.js";
import { requireAdmin, requireSelfOrAdmin } from "../shared/auth.js";
import { Organizer } from "./organizer.entity.js";
import { organizerEventRouter } from "../event/event.routes.js";
import { sanitizeOrganizerInput, findAll, findOne, add, update, remove } from "./organizer.controller.js";

export const organizerRouter = Router()

const selfOrAdmin = requireSelfOrAdmin('organizer')

organizerRouter.get('/', requireAdmin, findAll)
organizerRouter.get('/:id', selfOrAdmin, findOne)
organizerRouter.post('/', requireAdmin, sanitizeOrganizerInput, validateUserInput, add)
organizerRouter.put('/:id', selfOrAdmin, sanitizeOrganizerInput, validateUserInput, update)
organizerRouter.patch('/:id/password', selfOrAdmin, changePasswordFor(Organizer, 'El organizador no existe.'))
organizerRouter.patch('/:id', selfOrAdmin, sanitizeOrganizerInput, validateUserInput, update)
organizerRouter.delete('/:id', requireAdmin, remove)

// Eventos del organizador: solo él (o un admin).
organizerRouter.use('/:idOrganizer', requireSelfOrAdmin('organizer', 'idOrganizer'), organizerEventRouter)
