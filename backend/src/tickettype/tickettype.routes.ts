import { Router } from "express";
import { requireAdmin } from "../shared/auth.js";
import { sanitizeTicketTypeInput, findAll, findOne, add, update, remove } from "./tickettype.controller.js";

export const tickettypeRouter = Router({ mergeParams: true })

// Lectura pública (compra, formulario de eventos); el resto solo el admin.
tickettypeRouter.get('/', findAll)
tickettypeRouter.get('/:idTicketType', findOne)
tickettypeRouter.post('/', requireAdmin, sanitizeTicketTypeInput, add)
tickettypeRouter.put('/:idTicketType', requireAdmin, sanitizeTicketTypeInput, update)
tickettypeRouter.patch('/:idTicketType', requireAdmin, sanitizeTicketTypeInput, update)
tickettypeRouter.delete('/:idTicketType', requireAdmin, remove)
