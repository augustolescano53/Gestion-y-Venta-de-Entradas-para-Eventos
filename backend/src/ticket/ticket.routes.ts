import { Router } from "express";
import { sanitizeTicketInput, findAll, summary, findOne, purchase, scan, update, remove } from "./ticket.controller.js";

export const ticketRouter = Router()

ticketRouter.get('/', findAll)
ticketRouter.get('/summary', summary)
ticketRouter.post('/purchase', purchase)
ticketRouter.post('/scan', scan)
ticketRouter.get('/:id', findOne)
ticketRouter.put('/:id', sanitizeTicketInput, update)
ticketRouter.patch('/:id', sanitizeTicketInput, update)
ticketRouter.delete('/:id', remove)
