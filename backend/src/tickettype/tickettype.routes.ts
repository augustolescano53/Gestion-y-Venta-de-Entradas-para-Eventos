import { Router } from "express";
import { sanitizeTicketTypeInput, findAll, findOne, add, update, remove } from "./tickettype.controller.js";

export const tickettypeRouter = Router({ mergeParams: true })

tickettypeRouter.get('/', findAll)
tickettypeRouter.get('/:idTicketType', findOne)
tickettypeRouter.post('/', sanitizeTicketTypeInput, add)
tickettypeRouter.put('/:idTicketType', sanitizeTicketTypeInput, update)
tickettypeRouter.patch('/:idTicketType', sanitizeTicketTypeInput, update)
tickettypeRouter.delete('/:idTicketType', remove)