import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { EntityManager, LockMode, wrap } from '@mikro-orm/core';
import { Event } from './event.entity.js';
import { Organizer } from '../organizer/organizer.entity.js';
import { TicketType } from '../tickettype/tickettype.entity.js';
import { Ticket } from '../ticket/ticket.entity.js';
import { SOLD_STATUSES, TICKET_STATUS } from '../ticket/ticket.status.js';
import {
  EVENT_STATUS,
  OverlappingEvent,
  findEventTicketTypeIds,
  findOverlappingEvent,
  hasEnded,
  isStartInFuture,
  isValidDateString,
  isValidTimeString,
  localTodayString,
  normalizeTime,
  recalculateEventStatus,
} from './event.status.js';
import { FieldErrors, HttpError, sendError, sendFieldErrors, toPositiveInt } from '../shared/httpError.js';
import { orm } from '../shared/db/orm.js';

const em = orm.em;

const EVENT_NOT_FOUND = 'El evento no existe.';
const OVERLAP_MESSAGE = 'Ya existe un evento en este lugar en esa fecha y horario.';
const INVALID_FIELDS = 'Revisá los campos marcados.';

// "status" no se acepta desde afuera: lo asigna el backend. "ticketTypes"
// son ids de tipos del lugar: al crear, los del evento; al editar, solo los
// que se agregan.
function sanitizeEventInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    name: req.body.name,
    description: req.body.description,
    coverImage: req.body.coverImage,
    date: req.body.date,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    organizer: req.body.organizer,
    ticketTypes: req.body.ticketTypes,
    venue: Number.parseInt(req.params.idVenue as string),
  };

  Object.keys(req.body.sanitizedInput).forEach((key) => {
    if (req.body.sanitizedInput[key] === undefined) {
      delete req.body.sanitizedInput[key];
    }
  });

  next();
}

function isBlank(value: unknown) {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

// Devuelve todos los errores a la vez. Al editar solo se validan los campos
// enviados; las reglas que dependen de los datos guardados se aplican en
// update, ya con el evento cargado.
function validateEventFields(input: any, mode: 'create' | 'update') {
  const errors: FieldErrors = {};
  const creating = mode === 'create';
  const present = (field: string) => creating || input[field] !== undefined;

  const required: Array<[string, string]> = [
    ['name', 'El nombre del evento es obligatorio.'],
    ['description', 'La descripción es obligatoria.'],
    ['coverImage', 'La imagen de portada es obligatoria.'],
  ];
  for (const [field, message] of required) {
    if (present(field) && isBlank(input[field])) errors[field] = message;
  }

  if (present('date')) {
    if (isBlank(input.date)) errors.date = 'La fecha es obligatoria.';
    else if (!isValidDateString(input.date)) errors.date = 'La fecha no es válida.';
  }
  if (present('startTime')) {
    if (isBlank(input.startTime)) errors.startTime = 'La hora de inicio es obligatoria.';
    else if (!isValidTimeString(input.startTime)) errors.startTime = 'La hora de inicio no es válida: usá el formato 24 h HH:MM (00:00 a 23:59).';
  }
  if (present('endTime')) {
    if (isBlank(input.endTime)) errors.endTime = 'La hora de fin es obligatoria.';
    else if (!isValidTimeString(input.endTime)) errors.endTime = 'La hora de fin no es válida: usá el formato 24 h HH:MM (00:00 a 23:59).';
  }
  if (present('organizer') && toPositiveInt(input.organizer) === null) {
    errors.organizer = 'Elegí un organizador.';
  }

  if (creating || input.ticketTypes !== undefined) {
    const ids = Array.isArray(input.ticketTypes) ? input.ticketTypes.map(toPositiveInt) : null;
    if (creating && (!ids || ids.length === 0)) {
      errors.ticketTypes = 'Elegí al menos un tipo de entrada.';
    } else if (!ids || ids.includes(null) || new Set(ids).size !== ids.length) {
      errors.ticketTypes = 'Los tipos de entrada seleccionados no son válidos.';
    }
  }

  if (creating && !errors.date && !errors.startTime && !errors.endTime) {
    Object.assign(errors, scheduleErrors(input.date, input.startTime, input.endTime));
  }

  return errors;
}

function scheduleErrors(date: string, startTime: string, endTime: string, checkStart = true) {
  const errors: FieldErrors = {};
  if (normalizeTime(startTime) === normalizeTime(endTime)) {
    errors.endTime = 'La hora de fin debe ser distinta de la hora de inicio.';
  }
  if (checkStart && !isStartInFuture(date, startTime)) {
    if (date < localTodayString()) errors.date = 'La fecha no puede ser anterior a hoy.';
    else errors.startTime = 'La hora de inicio ya pasó. Elegí un horario futuro.';
  }
  return errors;
}

// Bloquea el lugar hasta el fin de la transacción: las altas y ediciones de
// eventos de un mismo lugar se procesan de a una, lo que protege el cálculo
// del próximo id y la validación de superposición.
async function lockVenue(tem: EntityManager, venueId: number) {
  const rows = await tem
    .getConnection()
    .execute('select id from venue where id = ? for update', [venueId], 'all', tem.getTransactionContext());
  if (rows.length === 0) {
    throw new HttpError(404, 'El lugar no existe.');
  }
}

async function assertOrganizerExists(tem: EntityManager, organizerId: number) {
  if (!(await tem.findOne(Organizer, { id: organizerId }))) {
    throw new HttpError(400, INVALID_FIELDS, { organizer: 'El organizador elegido no existe.' });
  }
}

async function findVenueTicketTypes(tem: EntityManager, venueId: number, ids: number[]) {
  if (ids.length === 0) return [];
  const ticketTypes = await tem.find(
    TicketType,
    { venue: venueId, idTicketType: { $in: ids } },
    { orderBy: { idTicketType: 'asc' } },
  );
  if (ticketTypes.length !== ids.length) {
    throw new HttpError(400, INVALID_FIELDS, {
      ticketTypes: 'Los tipos de entrada seleccionados no pertenecen al lugar del evento.',
    });
  }
  return ticketTypes;
}

// Una entrada disponible por cada lugar del cupo de cada tipo.
function generateTickets(tem: EntityManager, event: Event, ticketTypes: TicketType[]) {
  for (const ticketType of ticketTypes) {
    for (let seat = 1; seat <= ticketType.quantity; seat++) {
      tem.create(Ticket, {
        status: TICKET_STATUS.AVAILABLE,
        qr: randomUUID(),
        seatNumber: ticketType.isNumbered ? seat : undefined,
        event,
        ticketType,
      });
    }
  }
}

// Un alta superpuesta con exactamente los mismos datos es un reintento
// (doble clic, respuesta perdida): se devuelve el evento existente.
async function isSameEventRetry(tem: EntityManager, existing: OverlappingEvent, input: any) {
  const sameData =
    existing.name === input.name.trim() &&
    existing.description === input.description.trim() &&
    existing.organizerId === Number(input.organizer) &&
    existing.date === input.date &&
    existing.startTime === normalizeTime(input.startTime) &&
    existing.endTime === normalizeTime(input.endTime);
  if (!sameData) return false;

  const existingTypes = await findEventTicketTypeIds(tem, input.venue, existing.idEvent);
  const requestedTypes = input.ticketTypes.map(Number).sort((a: number, b: number) => a - b);
  return JSON.stringify(existingTypes) === JSON.stringify(requestedTypes);
}

// Después de generar entradas la colección queda cargada en memoria (pueden
// ser miles) y no hace falta devolverla.
function serializeEvent(event: Event, extra: object = {}) {
  return { ...wrap(event).toObject(['tickets'] as any), ...extra };
}

async function findAllEvents(req: Request, res: Response) {
  try {
    const events = await em.find(
      Event,
      {},
      { populate: ['venue'], orderBy: { date: 'asc', startTime: 'asc' } },
    );
    res.json({ data: events });
  } catch (error) {
    sendError(res, error);
  }
}

async function findAll(req: Request, res: Response) {
  try {
    const venue = Number.parseInt(req.params.idVenue as string);
    const events = await em.find(Event, { venue });
    res.json({ data: events });
  } catch (error) {
    sendError(res, error);
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const idEvent = Number.parseInt(req.params.idEvent as string);
    const venue = Number.parseInt(req.params.idVenue as string);
    const event = await em.findOneOrFail(Event, { idEvent, venue }, { populate: ['venue', 'organizer'] });
    const ticketTypeIds = await findEventTicketTypeIds(em, venue, idEvent);
    res.json({ data: { ...wrap(event).toObject(), ticketTypeIds } });
  } catch (error) {
    sendError(res, error, EVENT_NOT_FOUND);
  }
}

async function add(req: Request, res: Response) {
  const input = req.body.sanitizedInput;
  const errors = validateEventFields(input, 'create');
  if (Object.keys(errors).length > 0) {
    return sendFieldErrors(res, errors);
  }

  try {
    const { event, created } = await em.transactional(async (tem) => {
      await lockVenue(tem, input.venue);
      await assertOrganizerExists(tem, Number(input.organizer));
      const ticketTypes = await findVenueTicketTypes(tem, input.venue, input.ticketTypes.map(Number));

      const overlapping = await findOverlappingEvent(tem, input.venue, input.date, input.startTime, input.endTime);
      if (overlapping) {
        if (await isSameEventRetry(tem, overlapping, input)) {
          const existing = await tem.findOneOrFail(Event, { idEvent: overlapping.idEvent, venue: input.venue });
          return { event: existing, created: false };
        }
        throw new HttpError(409, OVERLAP_MESSAGE);
      }

      const [{ nextId }] = await tem
        .getConnection()
        .execute(
          'select ifnull(max(id_event), 0) + 1 as nextId from event where venue_id = ?',
          [input.venue],
          'all',
          tem.getTransactionContext(),
        );

      const event = tem.create(Event, {
        idEvent: nextId,
        venue: input.venue,
        organizer: Number(input.organizer),
        name: input.name.trim(),
        description: input.description.trim(),
        coverImage: input.coverImage.trim(),
        date: input.date,
        startTime: normalizeTime(input.startTime),
        endTime: normalizeTime(input.endTime),
        status: EVENT_STATUS.SCHEDULED,
      });
      generateTickets(tem, event, ticketTypes);

      return { event, created: true };
    });

    res.status(created ? 201 : 200).send({
      message: created ? 'Event created' : 'Event already created',
      data: serializeEvent(event),
    });
  } catch (error) {
    sendError(res, error);
  }
}

// Edita los datos del evento y, opcionalmente, le agrega tipos de entrada.
// No quita tipos, no regenera las entradas existentes y no cambia el lugar
// (forma parte de la clave) ni el estado.
async function update(req: Request, res: Response) {
  const { venue: _venue, ...input } = req.body.sanitizedInput;
  const errors = validateEventFields(input, 'update');
  if (Object.keys(errors).length > 0) {
    return sendFieldErrors(res, errors);
  }

  try {
    const idEvent = Number.parseInt(req.params.idEvent as string);
    const venue = Number.parseInt(req.params.idVenue as string);

    const result = await em.transactional(async (tem) => {
      await lockVenue(tem, venue);
      const event = await tem.findOne(Event, { idEvent, venue });
      if (!event) throw new HttpError(404, EVENT_NOT_FOUND);
      if (event.status === EVENT_STATUS.CANCELLED) {
        throw new HttpError(409, 'No se puede editar un evento cancelado.');
      }
      if (event.status === EVENT_STATUS.FINISHED || hasEnded(event)) {
        throw new HttpError(409, 'No se puede editar un evento finalizado.');
      }

      if (input.organizer !== undefined) {
        await assertOrganizerExists(tem, Number(input.organizer));
      }

      const date = input.date ?? event.date;
      const startTime = normalizeTime(input.startTime ?? event.startTime);
      const endTime = normalizeTime(input.endTime ?? event.endTime);
      const startChanged = date !== event.date || startTime !== event.startTime;
      const scheduleChanged = startChanged || endTime !== event.endTime;

      // Un evento que ya empezó se puede seguir editando mientras no se
      // cambie su inicio.
      const fieldErrors = scheduleErrors(date, startTime, endTime, startChanged);
      if (Object.keys(fieldErrors).length > 0) {
        throw new HttpError(400, INVALID_FIELDS, fieldErrors);
      }

      if (scheduleChanged) {
        const overlapping = await findOverlappingEvent(tem, venue, date, startTime, endTime, idEvent);
        if (overlapping) throw new HttpError(409, OVERLAP_MESSAGE);
      }

      // Los tipos ya asociados se ignoran: así un reintento no duplica
      // entradas.
      const existingTypeIds = await findEventTicketTypeIds(tem, venue, idEvent);
      const requestedIds: number[] = (input.ticketTypes ?? []).map(Number);
      await findVenueTicketTypes(tem, venue, requestedIds);
      const newTypes = await findVenueTicketTypes(
        tem,
        venue,
        requestedIds.filter((id) => !existingTypeIds.includes(id)),
      );

      const { ticketTypes: _ticketTypes, ...fields } = input;
      tem.assign(event, {
        ...fields,
        ...(fields.name !== undefined ? { name: fields.name.trim() } : {}),
        ...(fields.description !== undefined ? { description: fields.description.trim() } : {}),
        ...(fields.coverImage !== undefined ? { coverImage: fields.coverImage.trim() } : {}),
        ...(fields.organizer !== undefined ? { organizer: Number(fields.organizer) } : {}),
        startTime,
        endTime,
      });
      generateTickets(tem, event, newTypes);
      await recalculateEventStatus(tem, event);

      const ticketTypeIds = [...existingTypeIds, ...newTypes.map((t) => t.idTicketType)].sort((a, b) => a - b);
      return { event, ticketTypeIds, addedTicketTypes: newTypes.length };
    });

    res.status(200).send({
      message: 'Event updated successfully',
      data: serializeEvent(result.event, {
        ticketTypeIds: result.ticketTypeIds,
        addedTicketTypes: result.addedTicketTypes,
      }),
    });
  } catch (error) {
    sendError(res, error, EVENT_NOT_FOUND);
  }
}

// Anula el evento y todas sus entradas en la misma transacción, sin borrar
// nada. Repetirlo sobre un evento ya cancelado no tiene efectos.
async function cancel(req: Request, res: Response) {
  try {
    const idEvent = Number.parseInt(req.params.idEvent as string);
    const venue = Number.parseInt(req.params.idVenue as string);

    const event = await em.transactional(async (tem) => {
      const event = await tem.findOne(
        Event,
        { idEvent, venue },
        { lockMode: LockMode.PESSIMISTIC_WRITE },
      );
      if (!event) throw new HttpError(404, EVENT_NOT_FOUND);
      if (event.status === EVENT_STATUS.FINISHED) {
        throw new HttpError(409, 'No se puede anular un evento que ya finalizó.');
      }

      event.status = EVENT_STATUS.CANCELLED;
      await tem.flush();
      await tem.getConnection().execute(
        `update ticket set previous_status = status, status = ?
          where event_id_event = ? and event_venue_id = ? and status <> ?`,
        [TICKET_STATUS.CANCELLED, idEvent, venue, TICKET_STATUS.CANCELLED],
        'run',
        tem.getTransactionContext(),
      );
      return event;
    });

    res.status(200).send({ message: 'Evento anulado correctamente.', data: event });
  } catch (error) {
    sendError(res, error, EVENT_NOT_FOUND);
  }
}

// Las disponibles se borran junto con el evento. Si alguna entrada está o
// estuvo vendida (aunque después se haya cancelado), el evento se conserva.
async function remove(req: Request, res: Response) {
  try {
    const idEvent = Number.parseInt(req.params.idEvent as string);
    const venue = Number.parseInt(req.params.idVenue as string);

    await em.transactional(async (tem) => {
      const event = await tem.findOne(
        Event,
        { idEvent, venue },
        { lockMode: LockMode.PESSIMISTIC_WRITE },
      );
      if (!event) throw new HttpError(404, EVENT_NOT_FOUND);

      const soldCount = await tem.count(Ticket, {
        event: { idEvent, venue },
        $or: [{ status: { $in: SOLD_STATUSES } }, { previousStatus: { $in: SOLD_STATUSES } }],
      });
      if (soldCount > 0) {
        throw new HttpError(
          409,
          'No se puede eliminar el evento porque tiene entradas vendidas o escaneadas. Podés anularlo en su lugar.',
        );
      }

      await tem.nativeDelete(Ticket, { event: { idEvent, venue } });
      await tem.nativeDelete(Event, { idEvent, venue });
    });

    res.status(200).send({ message: 'Event deleted successfully' });
  } catch (error) {
    sendError(res, error, EVENT_NOT_FOUND);
  }
}

export { sanitizeEventInput, findAllEvents, findAll, findOne, add, update, cancel, remove };
