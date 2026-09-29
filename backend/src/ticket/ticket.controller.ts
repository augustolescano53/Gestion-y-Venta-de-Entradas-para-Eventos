import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { Ticket } from './ticket.entity.js';
import { orm } from '../shared/db/orm.js';

const em = orm.em;

function sanitizeTicketInput(req: Request, res: Response, next: NextFunction) {
  const { venue, event, ticketType } = req.body;

  req.body.sanitizedInput = {
    status: req.body.status,
    seatNumber: req.body.seatNumber,
    purchaseDate: req.body.purchaseDate,
    paymentMethod: req.body.paymentMethod,
    participant: req.body.participant,
    event: event !== undefined && venue !== undefined ? [event, venue] : undefined,
    ticketType: ticketType !== undefined && venue !== undefined ? [ticketType, venue]: undefined,
  };

  Object.keys(req.body.sanitizedInput).forEach((key) => {
    if (req.body.sanitizedInput[key] === undefined) {
      delete req.body.sanitizedInput[key];
    }
  });

  next();
}

async function findAll(req: Request, res: Response) {
  try {
    const tickets = await em.find(Ticket, {});
    res.json({ data: tickets });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id as string);
    const ticket = await em.findOneOrFail(Ticket, { id });
    res.json({ data: ticket });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

async function add(req: Request, res: Response) {
  try {
    const ticket = em.create(Ticket, {...req.body.sanitizedInput, qr: randomUUID()});
    await em.flush();
    res.status(201).send({ message: 'Ticket created', data: ticket });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

async function update(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id as string);
    const ticketToUpdate = await em.findOneOrFail(Ticket, { id });
    em.assign(ticketToUpdate, req.body.sanitizedInput);
    await em.flush();
    res.status(200).send({
      message: 'Ticket updated successfully',
      data: ticketToUpdate,
    });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

async function remove(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id as string);
    const ticket = await em.findOneOrFail(Ticket, { id });
    await em.removeAndFlush(ticket);
    res.status(200).send({ message: 'Ticket deleted successfully' });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

export { sanitizeTicketInput, findAll, findOne, add, update, remove };
