import { Router, Request, Response, NextFunction } from "express";
import { currentUser, requireAdmin, requireRole } from "../shared/auth.js";
import { toPositiveInt } from "../shared/httpError.js";
import { sanitizeTicketInput, findAll, summary, findOne, purchase, scan, update, remove } from "./ticket.controller.js";

export const ticketRouter = Router()

// El participante solo opera con sus propias entradas (el id de la consulta o
// de la compra tiene que ser el suyo); el admin, con cualquiera.
function ownParticipant(read: (req: Request) => unknown) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = currentUser(res)!
    if (user.role === 'admin' || toPositiveInt(read(req)) === user.id) return next()
    res.status(403).send({ message: 'No tenés permiso para realizar esta acción.' })
  }
}

const participantOrAdmin = requireRole('participant', 'admin')

ticketRouter.get('/', participantOrAdmin, ownParticipant((req) => req.query.participant), findAll)
ticketRouter.get('/summary', summary)
ticketRouter.post('/purchase', participantOrAdmin, ownParticipant((req) => req.body.participant), purchase)
ticketRouter.post('/scan', requireAdmin, scan)
ticketRouter.get('/:id', requireAdmin, findOne)
ticketRouter.put('/:id', requireAdmin, sanitizeTicketInput, update)
ticketRouter.patch('/:id', requireAdmin, sanitizeTicketInput, update)
ticketRouter.delete('/:id', requireAdmin, remove)
