import { Request, Response, NextFunction } from 'express';
import { TicketType } from './tickettype.entity.js';
import { orm } from '../shared/db/orm.js';

const em = orm.em;

function sanitizeTicketTypeInput(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  req.body.sanitizedInput = {
    quantity: req.body.quantity,
    location: req.body.location,
    isNumbered: req.body.isNumbered,
    venue: Number.parseInt(req.params.idVenue as string),
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
    const venue = Number.parseInt(req.params.idVenue as string);
    const ticketTypes = await em.find(TicketType, { venue });
    res.json({ data: ticketTypes });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const idTicketType = Number.parseInt(req.params.idTicketType as string);
    const venue = Number.parseInt(req.params.idVenue as string);
    const ticketType = await em.findOneOrFail(TicketType, {
      idTicketType,
      venue,
    });
    res.json({ data: ticketType });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

async function add(req: Request, res: Response) {
  try {
    const input = req.body.sanitizedInput;

    const [{ nextId }] = await em
      .getConnection()
      .execute(
        'select ifnull(max(id_ticket_type), 0) + 1 as nextId from ticket_type where venue_id = ?',
        [input.venue],
      );

    const ticketType = em.create(TicketType, {
      idTicketType: nextId,
      ...input,
    });
    await em.flush();
    res.status(201).send({ message: 'TicketType created', data: ticketType });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

async function update(req: Request, res: Response) {
  try {
    const idTicketType = Number.parseInt(req.params.idTicketType as string);
    const venue = Number.parseInt(req.params.idVenue as string);
    const ticketTypeToUpdate = await em.findOneOrFail(TicketType, {
      idTicketType,
      venue,
    });
    em.assign(ticketTypeToUpdate, req.body.sanitizedInput);
    await em.flush();
    res.status(200).send({
      message: 'TicketType updated successfully',
      data: ticketTypeToUpdate,
    });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

async function remove(req: Request, res: Response) {
  try {
    const idTicketType = Number.parseInt(req.params.idTicketType as string);
    const venue = Number.parseInt(req.params.idVenue as string);
    const ticketType = await em.findOneOrFail(TicketType, {
      idTicketType,
      venue,
    });
    await em.removeAndFlush(ticketType);
    res.status(200).send({ message: 'TicketType deleted successfully' });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

export { sanitizeTicketTypeInput, findAll, findOne, add, update, remove };
