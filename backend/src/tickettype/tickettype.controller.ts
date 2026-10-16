import { Request, Response, NextFunction } from 'express';
import { ForeignKeyConstraintViolationException } from '@mikro-orm/core';
import { TicketType } from './tickettype.entity.js';
import { Ticket } from '../ticket/ticket.entity.js';
import { FieldErrors, HttpError, sendError, sendFieldErrors } from '../shared/httpError.js';
import { sameKey, trimText } from '../shared/text.js';
import { orm } from '../shared/db/orm.js';

const em = orm.em;

function sanitizeTicketTypeInput(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  req.body.sanitizedInput = {
    quantity: req.body.quantity,
    location: trimText(req.body.location),
    isNumbered: req.body.isNumbered,
    price: req.body.price,
    venue: Number.parseInt(req.params.idVenue as string),
  };

  Object.keys(req.body.sanitizedInput).forEach((key) => {
    if (req.body.sanitizedInput[key] === undefined) {
      delete req.body.sanitizedInput[key];
    }
  });

  next();
}

// El precio es obligatorio al crear; al editar solo se valida si se envía.
function validatePrice(input: any, creating: boolean): FieldErrors {
  if (!creating && input.price === undefined) return {};
  const price = typeof input.price === 'string' && input.price.trim() !== '' ? Number(input.price) : input.price;
  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
    return { price: 'El precio debe ser un número mayor o igual a 0.' };
  }
  input.price = Math.round(price * 100) / 100;
  return {};
}

// Dentro de un lugar no se repite el nombre del tipo (sin distinguir
// mayúsculas, acentos ni espacios): para sumar más cupos de "VIP" se crea
// otro tipo con un nombre distinto, como "VIP 2". En otro lugar sí puede
// repetirse. idTicketType: el tipo que se edita, que no cuenta como repetido.
async function checkLocation(venue: number, location: unknown, idTicketType?: number) {
  const existing = await em.find(TicketType, { venue });
  const duplicate = existing.find(
    (ticketType) => ticketType.idTicketType !== idTicketType && sameKey(ticketType.location, location),
  );
  if (duplicate) {
    const message = `El lugar ya tiene un tipo de entrada "${duplicate.location}". Usá otro nombre.`;
    throw new HttpError(409, message, { location: message });
  }
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
  const input = req.body.sanitizedInput;
  const errors = validatePrice(input, true);
  if (Object.keys(errors).length > 0) {
    return sendFieldErrors(res, errors);
  }

  try {
    await checkLocation(input.venue, input.location);

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
  } catch (error) {
    sendError(res, error);
  }
}

async function update(req: Request, res: Response) {
  const errors = validatePrice(req.body.sanitizedInput, false);
  if (Object.keys(errors).length > 0) {
    return sendFieldErrors(res, errors);
  }

  try {
    const idTicketType = Number.parseInt(req.params.idTicketType as string);
    const venue = Number.parseInt(req.params.idVenue as string);
    const ticketTypeToUpdate = await em.findOneOrFail(TicketType, {
      idTicketType,
      venue,
    });
    if (req.body.sanitizedInput.location !== undefined) {
      await checkLocation(venue, req.body.sanitizedInput.location, idTicketType);
    }
    em.assign(ticketTypeToUpdate, req.body.sanitizedInput);
    await em.flush();
    res.status(200).send({
      message: 'TicketType updated successfully',
      data: ticketTypeToUpdate,
    });
  } catch (error) {
    sendError(res, error, 'El tipo de entrada no existe.');
  }
}

const TICKET_TYPE_IN_USE =
  'No se puede eliminar este tipo de entrada porque tiene entradas asociadas.';

// Si otra operación genera entradas entre el conteo y el borrado, la FK de
// la base lo rechaza y se responde el mismo mensaje.
async function remove(req: Request, res: Response) {
  try {
    const idTicketType = Number.parseInt(req.params.idTicketType as string);
    const venue = Number.parseInt(req.params.idVenue as string);
    const ticketType = await em.findOneOrFail(TicketType, {
      idTicketType,
      venue,
    });

    const ticketCount = await em.count(Ticket, { ticketType: { idTicketType, venue } });
    if (ticketCount > 0) {
      return res.status(409).send({ message: TICKET_TYPE_IN_USE });
    }

    await em.removeAndFlush(ticketType);
    res.status(200).send({ message: 'TicketType deleted successfully' });
  } catch (error) {
    if (error instanceof ForeignKeyConstraintViolationException) {
      return res.status(409).send({ message: TICKET_TYPE_IN_USE });
    }
    sendError(res, error, 'El tipo de entrada no existe.');
  }
}

export { sanitizeTicketTypeInput, findAll, findOne, add, update, remove };
