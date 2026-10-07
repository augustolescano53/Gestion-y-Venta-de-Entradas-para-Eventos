import { Request, Response, NextFunction } from 'express';
import { EntityManager, FilterQuery, LockMode } from '@mikro-orm/core';
import { Ticket } from './ticket.entity.js';
import { TICKET_STATUS, TICKET_STATUSES, isAllowedTicketTransition } from './ticket.status.js';
import { Event } from '../event/event.entity.js';
import { EVENT_STATUS, hasEnded, isValidDateString, recalculateEventStatus } from '../event/event.status.js';
import { TicketType } from '../tickettype/tickettype.entity.js';
import { Participant } from '../participant/participant.entity.js';
import { PaymentMethod } from '../paymentmethod/paymentmethod.entity.js';
import { FieldErrors, HttpError, sendError, sendFieldErrors, toPositiveInt } from '../shared/httpError.js';
import { orm } from '../shared/db/orm.js';

const em = orm.em;

const TICKET_NOT_FOUND = 'La entrada no existe.';
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
export const MAX_TICKETS_PER_PURCHASE = 5;

// El evento y el tipo de entrada no se editan: moverían la entrada al stock
// de otro evento. Las entradas no se crean a mano: se generan con el evento.
function sanitizeTicketInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    status: req.body.status,
    seatNumber: req.body.seatNumber,
    purchaseDate: req.body.purchaseDate,
    paymentMethod: req.body.paymentMethod,
    participant: req.body.participant,
  };

  Object.keys(req.body.sanitizedInput).forEach((key) => {
    if (req.body.sanitizedInput[key] === undefined) {
      delete req.body.sanitizedInput[key];
    }
    if (req.body.sanitizedInput[key] === '') {
      req.body.sanitizedInput[key] = null;
    }
  });

  next();
}

function eventIsOver(event: Event) {
  return event.status === EVENT_STATUS.FINISHED || hasEnded(event);
}

// Bloquea primero el evento y después la entrada, el mismo orden que usa la
// compra, para que dos operaciones no queden esperándose mutuamente.
async function lockTicketAndEvent(tem: EntityManager, where: FilterQuery<Ticket>) {
  const found = await tem.findOne(Ticket, where);
  if (!found) return null;
  const event = await tem.findOneOrFail(
    Event,
    { idEvent: found.event.idEvent, venue: found.event.venue.id },
    { lockMode: LockMode.PESSIMISTIC_WRITE, refresh: true },
  );
  const ticket = await tem.findOneOrFail(
    Ticket,
    { id: found.id },
    { lockMode: LockMode.PESSIMISTIC_WRITE, refresh: true },
  );
  return { event, ticket };
}

function parseEventFilter(query: Request['query']) {
  if (query.event === undefined && query.venue === undefined) return null;
  const idEvent = toPositiveInt(query.event);
  const venue = toPositiveInt(query.venue);
  if (idEvent === null || venue === null) {
    throw new HttpError(400, 'El evento elegido no es válido.');
  }
  return { idEvent, venue };
}

// "total" cuenta todas las entradas que cumplen los filtros, no solo las de
// la página pedida.
async function findAll(req: Request, res: Response) {
  try {
    const where: FilterQuery<Ticket> = {};

    const eventFilter = parseEventFilter(req.query);
    if (eventFilter) where.event = eventFilter;

    if (req.query.status !== undefined) {
      if (!TICKET_STATUSES.includes(String(req.query.status))) {
        return res.status(400).send({ message: 'El estado elegido no es válido.' });
      }
      where.status = String(req.query.status);
    }

    const page = toPositiveInt(req.query.page) ?? 1;
    const pageSize = Math.min(toPositiveInt(req.query.pageSize) ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    const [items, total] = await em.findAndCount(Ticket, where, {
      populate: ['event', 'ticketType'],
      orderBy: { id: 'asc' },
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    res.json({ data: { items, total, page, pageSize } });
  } catch (error) {
    sendError(res, error);
  }
}

// Cantidades por evento y tipo. total = disponibles + vendidas sin usar +
// escaneadas + canceladas. soldTotal es histórico: suma las vendidas y
// escaneadas, más las canceladas que habían sido vendidas o escaneadas.
async function summary(req: Request, res: Response) {
  try {
    const eventFilter = parseEventFilter(req.query);
    const rows = await em.getConnection().execute(
      `select t.event_venue_id as venueId, t.event_id_event as idEvent, e.name as eventName,
              e.status as eventStatus, e.date as eventDate,
              t.ticket_type_id_ticket_type as idTicketType, tt.location as ticketTypeName,
              count(*) as total,
              sum(t.status = ?) as available,
              sum(t.status = ?) as soldUnused,
              sum(t.status = ?) as scanned,
              sum(t.status = ?) as cancelled,
              sum(t.status = ? and t.previous_status in (?, ?)) as cancelledSold
         from ticket t
         join event e on e.id_event = t.event_id_event and e.venue_id = t.event_venue_id
         join ticket_type tt on tt.id_ticket_type = t.ticket_type_id_ticket_type
                            and tt.venue_id = t.ticket_type_venue_id
        ${eventFilter ? 'where t.event_venue_id = ? and t.event_id_event = ?' : ''}
        group by t.event_venue_id, t.event_id_event, e.name, e.status, e.date,
                 t.ticket_type_id_ticket_type, tt.location
        order by e.date, e.name, tt.location`,
      [
        TICKET_STATUS.AVAILABLE,
        TICKET_STATUS.SOLD,
        TICKET_STATUS.SCANNED,
        TICKET_STATUS.CANCELLED,
        TICKET_STATUS.CANCELLED,
        TICKET_STATUS.SOLD,
        TICKET_STATUS.SCANNED,
        ...(eventFilter ? [eventFilter.venue, eventFilter.idEvent] : []),
      ],
    );

    // MySQL devuelve los SUM como DECIMAL (texto).
    const data = rows.map((row: any) => {
      const soldUnused = Number(row.soldUnused);
      const scanned = Number(row.scanned);
      const cancelledSold = Number(row.cancelledSold);
      return {
        ...row,
        total: Number(row.total),
        available: Number(row.available),
        soldUnused,
        scanned,
        cancelled: Number(row.cancelled),
        cancelledSold,
        soldTotal: soldUnused + scanned + cancelledSold,
      };
    });

    res.json({ data });
  } catch (error) {
    sendError(res, error);
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id as string);
    const ticket = await em.findOneOrFail(Ticket, { id }, { populate: ['event', 'ticketType'] });
    res.json({ data: ticket });
  } catch (error) {
    sendError(res, error, TICKET_NOT_FOUND);
  }
}

// La fila del evento queda bloqueada durante toda la compra: las compras de
// un mismo evento se procesan de a una, así dos compras simultáneas no
// pueden vender la misma entrada ni superar el stock.
async function purchase(req: Request, res: Response) {
  const venue = toPositiveInt(req.body.venue);
  const idEvent = toPositiveInt(req.body.event);
  const idTicketType = toPositiveInt(req.body.ticketType);
  const quantity = toPositiveInt(req.body.quantity);
  const participantId = toPositiveInt(req.body.participant);
  const paymentMethodId = toPositiveInt(req.body.paymentMethod);

  const errors: FieldErrors = {};
  if (venue === null || idEvent === null) errors.event = 'Elegí un evento.';
  if (idTicketType === null) errors.ticketType = 'Elegí un tipo de entrada.';
  if (quantity === null) errors.quantity = 'La cantidad debe ser un número entero mayor a cero.';
  else if (quantity > MAX_TICKETS_PER_PURCHASE) {
    errors.quantity = `Podés comprar como máximo ${MAX_TICKETS_PER_PURCHASE} entradas por compra.`;
  }
  if (participantId === null) errors.participant = 'Elegí un participante.';
  if (paymentMethodId === null) errors.paymentMethod = 'Elegí un medio de pago.';
  if (Object.keys(errors).length > 0) {
    return sendFieldErrors(res, errors);
  }

  try {
    const tickets = await em.transactional(async (tem) => {
      const event = await tem.findOne(
        Event,
        { idEvent: idEvent!, venue: venue! },
        { lockMode: LockMode.PESSIMISTIC_WRITE },
      );
      if (!event) throw new HttpError(404, 'El evento no existe.');
      if (event.status === EVENT_STATUS.CANCELLED) {
        throw new HttpError(409, 'No se pueden comprar entradas de un evento cancelado.');
      }
      if (eventIsOver(event)) {
        throw new HttpError(409, 'No se pueden comprar entradas de un evento finalizado.');
      }

      const ticketType = await tem.findOne(TicketType, { idTicketType: idTicketType!, venue: venue! });
      if (!ticketType) throw new HttpError(400, 'El tipo de entrada no corresponde al lugar del evento.');
      if (!(await tem.findOne(Participant, { id: participantId! }))) {
        throw new HttpError(400, 'El participante elegido no existe.');
      }
      if (!(await tem.findOne(PaymentMethod, { id: paymentMethodId! }))) {
        throw new HttpError(400, 'El medio de pago elegido no existe.');
      }

      const rows = await tem.getConnection().execute(
        `select id from ticket
          where event_id_event = ? and event_venue_id = ?
            and ticket_type_id_ticket_type = ? and ticket_type_venue_id = ?
            and status = ?
          order by id
          limit ${quantity}
          for update`,
        [idEvent, venue, idTicketType, venue, TICKET_STATUS.AVAILABLE],
        'all',
        tem.getTransactionContext(),
      );
      if (rows.length < quantity!) {
        throw new HttpError(
          409,
          rows.length === 0
            ? 'No quedan entradas disponibles de ese tipo para este evento.'
            : `Solo quedan ${rows.length} entradas disponibles de ese tipo para este evento.`,
        );
      }

      const tickets = await tem.find(Ticket, { id: { $in: rows.map((row: any) => row.id) } });
      const now = new Date();
      for (const ticket of tickets) {
        ticket.status = TICKET_STATUS.SOLD;
        ticket.participant = tem.getReference(Participant, participantId!);
        ticket.paymentMethod = tem.getReference(PaymentMethod, paymentMethodId!);
        ticket.purchaseDate = now;
      }

      await recalculateEventStatus(tem, event);
      return tickets;
    });

    res.status(201).send({ message: 'Compra realizada correctamente.', data: tickets });
  } catch (error) {
    sendError(res, error);
  }
}

async function scan(req: Request, res: Response) {
  const qr = typeof req.body.qr === 'string' ? req.body.qr.trim() : '';
  if (!qr) {
    return res.status(400).send({ message: 'Ingresá el código QR de la entrada.' });
  }

  try {
    const result = await em.transactional(async (tem) => {
      const locked = await lockTicketAndEvent(tem, { qr });
      if (!locked) throw new HttpError(404, 'No existe ninguna entrada con ese código QR.');
      const { event, ticket } = locked;

      if (event.status === EVENT_STATUS.CANCELLED || ticket.status === TICKET_STATUS.CANCELLED) {
        throw new HttpError(409, 'Ingreso rechazado: el evento fue cancelado.');
      }
      if (event.status === EVENT_STATUS.FINISHED) {
        throw new HttpError(409, 'Ingreso rechazado: el evento ya finalizó.');
      }
      if (ticket.status === TICKET_STATUS.SCANNED) {
        throw new HttpError(409, 'Ingreso rechazado: esta entrada ya fue utilizada.');
      }
      if (ticket.status !== TICKET_STATUS.SOLD) {
        throw new HttpError(409, 'Ingreso rechazado: esta entrada no fue vendida.');
      }

      ticket.status = TICKET_STATUS.SCANNED;
      await tem.populate(ticket, ['ticketType']);
      return { ticket, eventName: event.name, ticketTypeName: ticket.ticketType.location };
    });

    res.status(200).send({ message: 'Ingreso registrado correctamente.', data: result });
  } catch (error) {
    sendError(res, error);
  }
}

// Una entrada disponible no tiene datos de compra; una vendida o escaneada
// necesita participante y medio de pago.
async function update(req: Request, res: Response) {
  const input = req.body.sanitizedInput;

  if (input.status !== undefined && !TICKET_STATUSES.includes(input.status)) {
    return res.status(400).send({ message: 'El estado elegido no es válido.' });
  }
  for (const field of ['participant', 'paymentMethod', 'seatNumber']) {
    if (input[field] !== undefined && input[field] !== null && toPositiveInt(input[field]) === null) {
      return res.status(400).send({ message: `El campo ${field} no es válido.` });
    }
  }
  if (input.purchaseDate != null && !isValidDateString(String(input.purchaseDate).slice(0, 10))) {
    return res.status(400).send({ message: 'La fecha de compra no es válida.' });
  }

  try {
    const id = Number.parseInt(req.params.id as string);

    const ticket = await em.transactional(async (tem) => {
      const locked = await lockTicketAndEvent(tem, { id });
      if (!locked) throw new HttpError(404, TICKET_NOT_FOUND);
      const { event, ticket } = locked;

      if (event.status === EVENT_STATUS.CANCELLED || ticket.status === TICKET_STATUS.CANCELLED) {
        throw new HttpError(409, 'Las entradas de un evento cancelado no se pueden modificar.');
      }

      const from = ticket.status;
      const to = input.status ?? from;
      if (to === TICKET_STATUS.CANCELLED) {
        throw new HttpError(409, 'El estado Cancelada solo se asigna al anular el evento.');
      }
      if (!isAllowedTicketTransition(from, to)) {
        throw new HttpError(
          409,
          from === TICKET_STATUS.SCANNED && to === TICKET_STATUS.AVAILABLE
            ? 'Una entrada escaneada no puede volver directamente a Disponible. Primero corregí el escaneo (pasala a Vendida).'
            : 'Ese cambio de estado no está permitido.',
        );
      }

      if (from === TICKET_STATUS.AVAILABLE && to === TICKET_STATUS.SOLD && eventIsOver(event)) {
        throw new HttpError(409, 'No se pueden vender entradas de un evento finalizado.');
      }

      if (input.seatNumber !== undefined) {
        tem.assign(ticket, { seatNumber: input.seatNumber === null ? null : Number(input.seatNumber) });
      }

      if (to === TICKET_STATUS.AVAILABLE) {
        if (input.participant != null || input.paymentMethod != null) {
          throw new HttpError(400, 'Una entrada disponible no puede tener participante ni medio de pago.');
        }
        tem.assign(ticket, { participant: null, paymentMethod: null, purchaseDate: null });
      } else {
        const participantId =
          input.participant !== undefined ? input.participant : ticket.participant?.id ?? null;
        const paymentMethodId =
          input.paymentMethod !== undefined ? input.paymentMethod : ticket.paymentMethod?.id ?? null;
        if (participantId == null || paymentMethodId == null) {
          throw new HttpError(400, 'Una entrada vendida o escaneada necesita participante y medio de pago.');
        }
        if (!(await tem.findOne(Participant, { id: Number(participantId) }))) {
          throw new HttpError(400, 'El participante elegido no existe.');
        }
        if (!(await tem.findOne(PaymentMethod, { id: Number(paymentMethodId) }))) {
          throw new HttpError(400, 'El medio de pago elegido no existe.');
        }
        ticket.participant = tem.getReference(Participant, Number(participantId));
        ticket.paymentMethod = tem.getReference(PaymentMethod, Number(paymentMethodId));
        if (input.purchaseDate != null) {
          ticket.purchaseDate = new Date(`${String(input.purchaseDate).slice(0, 10)}T00:00:00`);
        } else if (!ticket.purchaseDate) {
          ticket.purchaseDate = new Date();
        }
      }

      ticket.status = to;
      await recalculateEventStatus(tem, event);
      return ticket;
    });

    res.status(200).send({ message: 'Ticket updated successfully', data: ticket });
  } catch (error) {
    sendError(res, error, TICKET_NOT_FOUND);
  }
}

async function remove(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id as string);

    await em.transactional(async (tem) => {
      const locked = await lockTicketAndEvent(tem, { id });
      if (!locked) throw new HttpError(404, TICKET_NOT_FOUND);
      const { event, ticket } = locked;

      if (ticket.status !== TICKET_STATUS.AVAILABLE) {
        throw new HttpError(409, 'Solo se pueden eliminar entradas disponibles.');
      }
      tem.remove(ticket);
      await recalculateEventStatus(tem, event);
    });

    res.status(200).send({ message: 'Ticket deleted successfully' });
  } catch (error) {
    sendError(res, error, TICKET_NOT_FOUND);
  }
}

export { sanitizeTicketInput, findAll, summary, findOne, purchase, scan, update, remove };
