import { Router } from "express";
import { sanitizeEventInput, findAll, findOne, add, update, remove } from "./event.controller.js";

export const eventRouter = Router({ mergeParams: true })

eventRouter.get('/', findAll)
eventRouter.get('/:idEvent', findOne)
eventRouter.post('/', sanitizeEventInput, add)
eventRouter.put('/:idEvent', sanitizeEventInput, update)
eventRouter.patch('/:idEvent', sanitizeEventInput, update)
eventRouter.delete('/:idEvent', remove)
