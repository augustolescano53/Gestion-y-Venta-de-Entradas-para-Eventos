import { Router } from "express";
import { sanitizeOrganizerInput, findAll, findOne, add, update, remove } from "./organizer.controller.js";

export const organizerRouter = Router()

organizerRouter.get('/', findAll)
organizerRouter.get('/:id', findOne)
organizerRouter.post('/', sanitizeOrganizerInput, add)
organizerRouter.put('/:id', sanitizeOrganizerInput, update)
organizerRouter.patch('/:id', sanitizeOrganizerInput, update)
organizerRouter.delete('/:id', remove)