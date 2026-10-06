import { Router } from "express";
import { validateUserInput } from "../user/user.controller.js";
import { sanitizeOrganizerInput, findAll, findOne, add, update, remove } from "./organizer.controller.js";

export const organizerRouter = Router()

organizerRouter.get('/', findAll)
organizerRouter.get('/:id', findOne)
organizerRouter.post('/', sanitizeOrganizerInput, validateUserInput, add)
organizerRouter.put('/:id', sanitizeOrganizerInput, validateUserInput, update)
organizerRouter.patch('/:id', sanitizeOrganizerInput, validateUserInput, update)
organizerRouter.delete('/:id', remove)