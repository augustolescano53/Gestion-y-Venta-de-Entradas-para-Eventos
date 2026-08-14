import { Router } from "express";
import { sanitizeTicketTypeInput, findAll, findOne, add, update, remove } from "./tickettype.controller.js";

export const tickettypeRouter = Router()

tickettypeRouter.get('/', findAll)
tickettypeRouter.get('/:id', findOne)
tickettypeRouter.post('/', sanitizeTicketTypeInput, add)
tickettypeRouter.put('/:id', sanitizeTicketTypeInput, update)
tickettypeRouter.patch('/:id', sanitizeTicketTypeInput, update)
tickettypeRouter.delete('/:id', remove)