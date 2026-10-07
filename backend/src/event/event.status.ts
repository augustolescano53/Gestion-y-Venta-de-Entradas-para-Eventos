import { EntityManager } from '@mikro-orm/core';
import { Event } from './event.entity.js';
import { TICKET_STATUS } from '../ticket/ticket.status.js';

export const EVENT_STATUS = {
  SCHEDULED: 'scheduled',
  SOLD_OUT: 'sold_out',
  FINISHED: 'finished',
  CANCELLED: 'cancelled',
} as const;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:00)?$/;

// Las fechas se manejan como 'YYYY-MM-DD' y no como Date: un Date es un
// instante y, según la zona horaria, puede caer en otro día.
export function isValidDateString(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export function isValidTimeString(value: unknown): value is string {
  return typeof value === 'string' && TIME_PATTERN.test(value);
}

export function normalizeTime(time: string) {
  return time.length === 5 ? `${time}:00` : time;
}

function addOneDay(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

const pad = (n: number) => String(n).padStart(2, '0');

// La hora actual se toma del servidor (hora local) y no de MySQL, para no
// depender de la zona horaria configurada en la base. El proyecto no define
// una zona propia.
export function localNowString(now = new Date()) {
  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  );
}

export function localTodayString(now = new Date()) {
  return localNowString(now).slice(0, 10);
}

// Si la hora de fin es menor o igual a la de inicio, el evento termina al
// día siguiente (por ejemplo, de 22:00 a 02:00).
export function getEventRange(date: string, startTime: string, endTime: string) {
  const start = normalizeTime(startTime);
  const end = normalizeTime(endTime);
  const endDate = end <= start ? addOneDay(date) : date;
  return { start: `${date} ${start}`, end: `${endDate} ${end}` };
}

export function hasEnded(event: Pick<Event, 'date' | 'startTime' | 'endTime'>, now = new Date()) {
  return getEventRange(event.date, event.startTime, event.endTime).end <= localNowString(now);
}

export function isStartInFuture(date: string, startTime: string, now = new Date()) {
  return `${date} ${normalizeTime(startTime)}` > localNowString(now);
}

export const SQL_EVENT_END = 'timestamp(date, end_time) + interval (end_time <= start_time) day';
const SQL_EVENT_START = 'timestamp(date, start_time)';

// Cancelado y Finalizado no cambian nunca automáticamente.
export async function recalculateEventStatus(em: EntityManager, event: Event) {
  if (event.status === EVENT_STATUS.CANCELLED || event.status === EVENT_STATUS.FINISHED) {
    return;
  }

  if (hasEnded(event)) {
    event.status = EVENT_STATUS.FINISHED;
    await em.flush();
    return;
  }

  // Los cambios pendientes de las entradas tienen que llegar a la base
  // antes de contarlas con SQL.
  await em.flush();
  const [{ total, available }] = await em.getConnection().execute(
    `select count(*) as total, coalesce(sum(status = ?), 0) as available
       from ticket where event_id_event = ? and event_venue_id = ?`,
    [TICKET_STATUS.AVAILABLE, event.idEvent, event.venue.id],
    'all',
    em.getTransactionContext(),
  );

  if (Number(total) > 0 && Number(available) === 0) {
    event.status = EVENT_STATUS.SOLD_OUT;
  } else if (Number(available) > 0 && event.status === EVENT_STATUS.SOLD_OUT) {
    event.status = EVENT_STATUS.SCHEDULED;
  }
  await em.flush();
}

export type OverlappingEvent = {
  idEvent: number;
  name: string;
  description: string;
  organizerId: number;
  date: string;
  startTime: string;
  endTime: string;
};

// Los rangos contiguos (uno termina 22:00 y el otro empieza 22:00) no se
// consideran superpuestos. Los eventos cancelados no ocupan el lugar.
export async function findOverlappingEvent(
  em: EntityManager,
  venueId: number,
  date: string,
  startTime: string,
  endTime: string,
  excludeIdEvent?: number,
): Promise<OverlappingEvent | null> {
  const range = getEventRange(date, startTime, endTime);
  const rows = await em.getConnection().execute(
    `select id_event as idEvent, name, description, organizer_id as organizerId,
            date, start_time as startTime, end_time as endTime
       from event
      where venue_id = ? and status <> ? and id_event <> ?
        and ${SQL_EVENT_START} < ? and ? < ${SQL_EVENT_END}
      limit 1`,
    [venueId, EVENT_STATUS.CANCELLED, excludeIdEvent ?? 0, range.end, range.start],
    'all',
    em.getTransactionContext(),
  );
  return rows[0] ?? null;
}

export async function findEventTicketTypeIds(em: EntityManager, venueId: number, idEvent: number) {
  const rows = await em.getConnection().execute(
    `select distinct ticket_type_id_ticket_type as idTicketType from ticket
      where event_id_event = ? and event_venue_id = ?
      order by ticket_type_id_ticket_type`,
    [idEvent, venueId],
    'all',
    em.getTransactionContext(),
  );
  return rows.map((row: any) => Number(row.idTicketType)) as number[];
}
