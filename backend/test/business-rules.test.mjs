// Pruebas de las reglas de negocio contra la API real.
//
// Requisitos: backend corriendo en http://localhost:3000 y MySQL en
// localhost:3308 (la misma base de desarrollo).
// Ejecutar desde backend/:  node --test test/
//
// Crea sus propios datos (lugares "TEST-...", usuarios test-...@example.com,
// medios de pago "TEST-...") y los borra por SQL al terminar, aunque alguna
// prueba falle. No toca los datos existentes.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mysql from 'mysql2/promise';

const API = 'http://localhost:3000/api';
const RUN = Date.now().toString(36);
const TICKET_TYPE_IN_USE = 'No se puede eliminar este tipo de entrada porque tiene entradas asociadas.';
const PAYMENT_METHOD_IN_USE =
  'No se puede eliminar este método de pago porque tiene compras o pagos asociados.';

let db;
const venues = [];
const userIds = [];
const paymentMethodIds = [];

// Por defecto las pruebas operan como el admin de prueba (todas las CRUD
// exigen ese rol). token = null hace la request sin sesión.
let adminToken;

async function api(method, path, body, token = adminToken) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await response.json().catch(() => ({}));
  return { status: response.status, body: json, data: json.data };
}

function localDate(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Cada lugar de prueba en su propia dirección: no puede haber dos lugares en
// la misma dirección.
function venueBody(name, address = {}) {
  return {
    name: `TEST-${RUN}-${name}`,
    address: {
      street: `Calle ${RUN} ${name}`,
      streetNumber: '1',
      postalCode: '2000',
      locality: 'Rosario',
      province: 'Santa Fe',
      ...address,
    },
  };
}

async function createVenue(name) {
  const { status, data } = await api('POST', '/venue', venueBody(name));
  assert.equal(status, 201);
  venues.push(data.id);
  return data.id;
}

async function createTicketType(venueId, location, quantity, isNumbered = false, price = 1000) {
  const { status, data } = await api('POST', `/venue/${venueId}/tickettype`, {
    location,
    quantity,
    isNumbered,
    price,
  });
  assert.equal(status, 201);
  return data.idTicketType;
}

async function createUser(kind, name, extra = {}) {
  const { status, data, body } = await api('POST', `/${kind}`, {
    firstName: name,
    lastName: 'Test',
    email: `test-${RUN}-${name}@example.com`,
    identityDocument: `T${RUN}${name}`,
    password: 'secreto',
    birthDate: '2000-01-01',
    ...extra,
  });
  if (status === 201) userIds.push(data.id);
  return { status, data, body };
}

let eventCounter = 0;
async function createEvent(venueId, ticketTypes, overrides = {}) {
  eventCounter++;
  return api('POST', `/venue/${venueId}/event`, {
    name: `TEST evento ${eventCounter}`,
    description: 'Evento de prueba',
    coverImage: 'https://example.com/cover.jpg',
    date: localDate(30),
    startTime: '10:00',
    endTime: '11:00',
    organizer: organizerId,
    ticketTypes,
    ...overrides,
  });
}

async function countTickets(venueId, idEvent, status) {
  const [[row]] = await db.query(
    `select count(*) as n from ticket where event_venue_id = ? and event_id_event = ?
       ${status ? 'and status = ?' : ''}`,
    status ? [venueId, idEvent, status] : [venueId, idEvent],
  );
  return Number(row.n);
}

async function eventStatus(venueId, idEvent) {
  const { data } = await api('GET', `/venue/${venueId}/event/${idEvent}`);
  return data.status;
}

function buy(venueId, idEvent, ticketType, quantity, participant = participantId) {
  return api('POST', '/ticket/purchase', {
    venue: venueId, event: idEvent, ticketType, quantity, participant, paymentMethod: paymentMethodId,
  });
}

let venueA, venueB, typeNumbered, typeGeneral, typeOtherVenue, organizerId, participantId, paymentMethodId;

before(async () => {
  db = await mysql.createConnection({
    host: 'localhost', port: 3308, user: 'dsw', password: 'dsw', database: 'event_management',
  });
  // Admin de prueba directo en la base (type = 'admin'), y su token.
  const adminEmail = `test-${RUN}-admin@example.com`;
  await db.query(
    `insert into user (type, first_name, last_name, email, identity_document, password, birth_date)
     values ('admin', 'Admin', 'Test', ?, ?, 'secreto', '2000-01-01')`,
    [adminEmail, `T${RUN}admin`],
  );
  const login = await api('POST', '/user/login', { email: adminEmail, password: 'secreto' }, null);
  assert.equal(login.data?.role, 'admin');
  adminToken = login.data.token;

  venueA = await createVenue('A');
  venueB = await createVenue('B');
  typeNumbered = await createTicketType(venueA, 'Platea', 3, true);
  typeGeneral = await createTicketType(venueA, 'Campo', 2);
  typeOtherVenue = await createTicketType(venueB, 'VIP', 1);
  organizerId = (await createUser('organizer', 'org')).data.id;
  participantId = (await createUser('participant', 'par')).data.id;
  const pm = await api('POST', '/paymentmethod', { type: `TEST-${RUN}-tarjeta` });
  paymentMethodId = pm.data.id;
  paymentMethodIds.push(paymentMethodId);
});

after(async () => {
  if (!db) return;
  if (venues.length) {
    const ids = venues.join(',');
    await db.query(`delete from ticket where event_venue_id in (${ids}) or ticket_type_venue_id in (${ids})`);
    await db.query(`delete from event where venue_id in (${ids})`);
    await db.query(`delete from ticket_type where venue_id in (${ids})`);
    await db.query(`delete from venue where id in (${ids})`);
  }
  await db.query(`delete from user where email like ?`, [`test-${RUN}-%`]);
  await db.query(`delete from payment_method where type like ?`, [`TEST-${RUN}-%`]);
  await db.end();
});

test('crear evento: estado Programado y entradas exactas por tipo, todas disponibles', async () => {
  const { status, data } = await createEvent(venueA, [typeNumbered, typeGeneral], {
    status: 'cancelled', // se ignora: el backend asigna el estado
  });
  assert.equal(status, 201);
  assert.equal(data.status, 'scheduled');
  assert.equal(data.tickets, undefined, 'no devuelve la colección de entradas');

  assert.equal(await countTickets(venueA, data.idEvent), 5);
  assert.equal(await countTickets(venueA, data.idEvent, 'disponible'), 5);

  const [seats] = await db.query(
    `select seat_number as seat from ticket where event_venue_id = ? and event_id_event = ?
       and ticket_type_id_ticket_type = ? order by seat_number`,
    [venueA, data.idEvent, typeNumbered],
  );
  assert.deepEqual(seats.map((s) => s.seat), [1, 2, 3]);
});

test('crear evento: rechaza tipos de otro lugar y datos faltantes', async () => {
  const otherVenue = await createEvent(venueA, [typeOtherVenue + 100], { startTime: '12:00', endTime: '13:00' });
  assert.equal(otherVenue.status, 400);
  const noTypes = await createEvent(venueA, [], { startTime: '12:00', endTime: '13:00' });
  assert.equal(noTypes.status, 400);
  const badDate = await createEvent(venueA, [typeGeneral], { date: '2026-02-31' });
  assert.equal(badDate.status, 400);
});

test('reintento con los mismos datos no duplica el evento ni sus entradas', async () => {
  const payload = { name: 'TEST reintento', date: localDate(31), startTime: '15:00', endTime: '16:00' };
  const first = await createEvent(venueA, [typeGeneral], payload);
  assert.equal(first.status, 201);
  const retry = await createEvent(venueA, [typeGeneral], payload);
  assert.equal(retry.status, 200);
  assert.equal(retry.data.idEvent, first.data.idEvent);
  assert.equal(await countTickets(venueA, first.data.idEvent), 2);
});

test('superposición de horarios en el mismo lugar', async () => {
  const day = localDate(32);
  const base = await createEvent(venueA, [typeGeneral], { date: day, startTime: '20:00', endTime: '22:00' });
  assert.equal(base.status, 201);

  const overlap = await createEvent(venueA, [typeGeneral], { date: day, startTime: '21:00', endTime: '23:00' });
  assert.equal(overlap.status, 409);
  assert.equal(overlap.body.message, 'Ya existe un evento en este lugar en esa fecha y horario.');

  const contiguous = await createEvent(venueA, [typeGeneral], { date: day, startTime: '22:00', endTime: '23:30' });
  assert.equal(contiguous.status, 201, 'empezar cuando termina el otro está permitido');

  const otherVenue = await createEvent(venueB, [typeOtherVenue], { date: day, startTime: '20:30', endTime: '21:30' });
  assert.equal(otherVenue.status, 201, 'otro lugar no se superpone');

  // Evento que pasa la medianoche contra uno a la madrugada del día siguiente.
  const nightDay = localDate(33);
  const night = await createEvent(venueA, [typeGeneral], { date: nightDay, startTime: '23:00', endTime: '03:00' });
  assert.equal(night.status, 201);
  const earlyNextDay = await createEvent(venueA, [typeGeneral], { date: localDate(34), startTime: '01:00', endTime: '02:00' });
  assert.equal(earlyNextDay.status, 409);

  // Un evento cancelado libera el lugar.
  await api('PATCH', `/venue/${venueA}/event/${night.data.idEvent}/cancel`);
  const afterCancel = await createEvent(venueA, [typeGeneral], { date: localDate(34), startTime: '01:00', endTime: '02:00' });
  assert.equal(afterCancel.status, 201);

  // Editar un evento para que se superponga también se rechaza.
  const edit = await api('PATCH', `/venue/${venueA}/event/${contiguous.data.idEvent}`, { startTime: '21:30' });
  assert.equal(edit.status, 409);
});

test('dos altas simultáneas superpuestas dejan exactamente un evento', async () => {
  const day = localDate(35);
  const results = await Promise.all(
    [1, 2, 3, 4].map((i) =>
      createEvent(venueA, [typeGeneral], { name: `TEST simultáneo ${i}`, date: day, startTime: '18:00', endTime: '19:00' }),
    ),
  );
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409, 409, 409]);
  const [[row]] = await db.query('select count(*) as n from event where venue_id = ? and date = ?', [venueA, day]);
  assert.equal(Number(row.n), 1);
});

test('venta normal, stock por evento y tipo, e inventarios independientes', async () => {
  const day = localDate(36);
  const e1 = (await createEvent(venueA, [typeNumbered, typeGeneral], { date: day, startTime: '10:00', endTime: '11:00' })).data;
  const e2 = (await createEvent(venueA, [typeNumbered, typeGeneral], { date: day, startTime: '12:00', endTime: '13:00' })).data;

  const sale = await buy(venueA, e1.idEvent, typeNumbered, 2);
  assert.equal(sale.status, 201);
  assert.equal(sale.data.length, 2);
  for (const ticket of sale.data) {
    assert.equal(ticket.status, 'vendida');
    assert.equal(ticket.participant, participantId);
  }

  const tooMany = await buy(venueA, e1.idEvent, typeNumbered, 2);
  assert.equal(tooMany.status, 409);
  assert.match(tooMany.body.message, /Solo quedan 1/);
  assert.equal(await countTickets(venueA, e1.idEvent, 'vendida'), 2, 'la compra fallida no vende nada');

  assert.equal(await countTickets(venueA, e2.idEvent, 'disponible'), 5, 'el otro evento no se ve afectado');

  const wrongType = await buy(venueA, e1.idEvent, typeOtherVenue + 100, 1);
  assert.equal(wrongType.status, 400);
});

test('compras simultáneas sobre las últimas entradas: no se supera el stock y el evento se agota', async () => {
  const event = (await createEvent(venueA, [typeGeneral], { date: localDate(37) })).data;
  const results = await Promise.all([1, 2, 3, 4, 5].map(() => buy(venueA, event.idEvent, typeGeneral, 1)));
  assert.equal(results.filter((r) => r.status === 201).length, 2);
  assert.equal(results.filter((r) => r.status === 409).length, 3);
  assert.equal(await countTickets(venueA, event.idEvent, 'vendida'), 2);

  const [[dup]] = await db.query(
    `select count(*) - count(distinct id) as d from ticket where event_venue_id = ? and event_id_event = ? and status = 'vendida'`,
    [venueA, event.idEvent],
  );
  assert.equal(Number(dup.d), 0);
  assert.equal(await eventStatus(venueA, event.idEvent), 'sold_out');

  const soldOut = await buy(venueA, event.idEvent, typeGeneral, 1);
  assert.equal(soldOut.status, 409);

  // Una devolución manual (Vendida -> Disponible) vuelve el evento a Programado.
  const ticket = results.find((r) => r.status === 201).data[0];
  const refund = await api('PUT', `/ticket/${ticket.id}`, { status: 'disponible' });
  assert.equal(refund.status, 200);
  assert.equal(refund.data.participant, null);
  assert.equal(refund.data.paymentMethod, null);
  assert.equal(await eventStatus(venueA, event.idEvent), 'scheduled');
});

test('anular evento: evento y todas sus entradas canceladas, sin borrar datos de compra', async () => {
  const event = (await createEvent(venueA, [typeNumbered, typeGeneral], { date: localDate(38) })).data;
  const sale = await buy(venueA, event.idEvent, typeNumbered, 2);
  const scanned = await api('POST', '/ticket/scan', { qr: sale.data[0].qr });
  assert.equal(scanned.status, 200);

  const cancel = await api('PATCH', `/venue/${venueA}/event/${event.idEvent}/cancel`);
  assert.equal(cancel.status, 200);
  assert.equal(cancel.data.status, 'cancelled');

  const [rows] = await db.query(
    `select id, status, previous_status as prev, participant_id as participant, payment_method_id as pm,
            purchase_date as purchaseDate
       from ticket where event_venue_id = ? and event_id_event = ? order by id`,
    [venueA, event.idEvent],
  );
  assert.equal(rows.length, 5, 'no se borra ninguna entrada');
  assert.ok(rows.every((r) => r.status === 'cancelada'));
  assert.deepEqual(rows.map((r) => r.prev).sort(), ['disponible', 'disponible', 'disponible', 'escaneada', 'vendida']);
  for (const row of rows.filter((r) => r.prev !== 'disponible')) {
    assert.equal(row.participant, participantId, 'se conserva el participante');
    assert.equal(row.pm, paymentMethodId, 'se conserva el medio de pago');
    assert.ok(row.purchaseDate, 'se conserva la fecha de compra');
  }

  const again = await api('PATCH', `/venue/${venueA}/event/${event.idEvent}/cancel`);
  assert.equal(again.status, 200, 'repetir la anulación no da error');
  const [[prevCheck]] = await db.query(
    `select count(*) as n from ticket where event_venue_id = ? and event_id_event = ? and previous_status = 'cancelada'`,
    [venueA, event.idEvent],
  );
  assert.equal(Number(prevCheck.n), 0, 'repetir no pisa el estado anterior');

  assert.equal((await buy(venueA, event.idEvent, typeGeneral, 1)).status, 409);

  const scan = await api('POST', '/ticket/scan', { qr: sale.data[1].qr });
  assert.equal(scan.status, 409);
  assert.match(scan.body.message, /cancelado/);

  for (const status of ['disponible', 'vendida', 'escaneada', 'cancelada']) {
    const edit = await api('PUT', `/ticket/${rows[0].id}`, { status });
    assert.equal(edit.status, 409, `no se reactiva a ${status}`);
  }
  assert.equal((await api('DELETE', `/ticket/${rows[4].id}`)).status, 409);
  assert.equal((await api('DELETE', `/venue/${venueA}/event/${event.idEvent}`)).status, 409, 'tuvo ventas: no se borra');
  assert.equal((await api('PATCH', `/venue/${venueA}/event/${event.idEvent}`, { name: 'Otro' })).status, 409);

  const { data: summary } = await api('GET', `/ticket/summary?venue=${venueA}&event=${event.idEvent}`);
  const platea = summary.find((r) => r.ticketTypeName === 'Platea');
  const campo = summary.find((r) => r.ticketTypeName === 'Campo');
  assert.deepEqual(
    [platea.total, platea.available, platea.soldUnused, platea.scanned, platea.cancelled, platea.soldTotal],
    [3, 0, 0, 0, 3, 2],
    'las canceladas no cuentan como disponibles y se conserva el total vendido',
  );
  assert.deepEqual([campo.total, campo.available, campo.cancelled, campo.soldTotal], [2, 0, 2, 0]);

  const filtered = await api('GET', `/ticket?venue=${venueA}&event=${event.idEvent}&status=cancelada`);
  assert.equal(filtered.data.total, 5);
});

test('escaneo de QR: vendida -> escaneada, rechaza reutilización y entradas no vendidas', async () => {
  const event = (await createEvent(venueA, [typeGeneral], { date: localDate(39) })).data;
  const sale = await buy(venueA, event.idEvent, typeGeneral, 1);
  const qr = sale.data[0].qr;

  const first = await api('POST', '/ticket/scan', { qr });
  assert.equal(first.status, 200);
  assert.equal(first.data.ticket.status, 'escaneada');

  const second = await api('POST', '/ticket/scan', { qr });
  assert.equal(second.status, 409);
  assert.equal(second.body.message, 'Ingreso rechazado: esta entrada ya fue utilizada.');

  const [[available]] = await db.query(
    `select qr from ticket where event_venue_id = ? and event_id_event = ? and status = 'disponible'`,
    [venueA, event.idEvent],
  );
  const notSold = await api('POST', '/ticket/scan', { qr: available.qr });
  assert.equal(notSold.status, 409);
  assert.match(notSold.body.message, /no fue vendida/);

  assert.equal((await api('POST', '/ticket/scan', { qr: 'no-existe' })).status, 404);
});

test('edición manual de estados: transiciones válidas e inválidas', async () => {
  const event = (await createEvent(venueA, [typeGeneral], { date: localDate(40) })).data;
  const [rows] = await db.query(
    `select id from ticket where event_venue_id = ? and event_id_event = ? order by id`,
    [venueA, event.idEvent],
  );
  const [t1, t2] = rows.map((r) => r.id);

  const noBuyer = await api('PUT', `/ticket/${t1}`, { status: 'vendida' });
  assert.equal(noBuyer.status, 400);

  const withBuyerButAvailable = await api('PUT', `/ticket/${t1}`, { status: 'disponible', participant: participantId });
  assert.equal(withBuyerButAvailable.status, 400);

  const sold = await api('PUT', `/ticket/${t1}`, { status: 'vendida', participant: participantId, paymentMethod: paymentMethodId });
  assert.equal(sold.status, 200);
  assert.ok(sold.data.purchaseDate);

  const scanned = await api('PUT', `/ticket/${t1}`, { status: 'escaneada' });
  assert.equal(scanned.status, 200);

  const back = await api('PUT', `/ticket/${t1}`, { status: 'disponible' });
  assert.equal(back.status, 409, 'escaneada no vuelve directo a disponible');

  const invalid = await api('PUT', `/ticket/${t2}`, { status: 'reservada' });
  assert.equal(invalid.status, 400);

  // Disponible -> Escaneada no está permitido (nunca se vendió).
  assert.equal((await api('PUT', `/ticket/${t2}`, { status: 'escaneada' })).status, 409);

  // Vender a mano la última disponible agota el evento.
  await api('PUT', `/ticket/${t2}`, { status: 'vendida', participant: participantId, paymentMethod: paymentMethodId });
  assert.equal(await eventStatus(venueA, event.idEvent), 'sold_out');

  // No se borran entradas vendidas ni eventos con ventas.
  assert.equal((await api('DELETE', `/ticket/${t2}`)).status, 409);
  assert.equal((await api('DELETE', `/venue/${venueA}/event/${event.idEvent}`)).status, 409);
});

test('listado con filtros, total paginado y resumen agrupado', async () => {
  const event = (await createEvent(venueA, [typeNumbered, typeGeneral], { date: localDate(41) })).data;
  await buy(venueA, event.idEvent, typeNumbered, 2);
  const sale = await buy(venueA, event.idEvent, typeGeneral, 1);
  await api('POST', '/ticket/scan', { qr: sale.data[0].qr });

  const byEvent = await api('GET', `/ticket?venue=${venueA}&event=${event.idEvent}&pageSize=2`);
  assert.equal(byEvent.status, 200);
  assert.equal(byEvent.data.total, 5, 'el total cuenta todos los resultados');
  assert.equal(byEvent.data.items.length, 2, 'la página trae solo 2');
  assert.equal(byEvent.data.items[0].event.name, event.name);
  assert.ok(byEvent.data.items[0].ticketType.location);

  const sold = await api('GET', `/ticket?venue=${venueA}&event=${event.idEvent}&status=vendida`);
  assert.equal(sold.data.total, 2);
  const page2 = await api('GET', `/ticket?venue=${venueA}&event=${event.idEvent}&pageSize=2&page=3`);
  assert.equal(page2.data.items.length, 1);

  const none = await api('GET', `/ticket?venue=${venueA}&event=${event.idEvent}&status=escaneada&page=1`);
  assert.equal(none.data.total, 1);

  assert.equal((await api('GET', '/ticket?status=perdida')).status, 400);

  const { data: summary } = await api('GET', '/ticket/summary');
  const rows = summary.filter((r) => r.venueId === venueA && r.idEvent === event.idEvent);
  const platea = rows.find((r) => r.ticketTypeName === 'Platea');
  const campo = rows.find((r) => r.ticketTypeName === 'Campo');
  assert.deepEqual(
    { total: platea.total, available: platea.available, soldUnused: platea.soldUnused, scanned: platea.scanned, soldTotal: platea.soldTotal },
    { total: 3, available: 1, soldUnused: 2, scanned: 0, soldTotal: 2 },
  );
  assert.deepEqual(
    { total: campo.total, available: campo.available, soldUnused: campo.soldUnused, scanned: campo.scanned, soldTotal: campo.soldTotal },
    { total: 2, available: 1, soldUnused: 0, scanned: 1, soldTotal: 1 },
  );
});

test('fecha de nacimiento: válida, futura, inexistente, vacía y edición', async () => {
  const valid = await createUser('participant', 'birth1', { birthDate: '1990-05-17' });
  assert.equal(valid.status, 201);
  const [[stored]] = await db.query(`select date_format(birth_date, '%Y-%m-%d') as d from user where id = ?`, [valid.data.id]);
  assert.equal(stored.d, '1990-05-17', 'se guarda el mismo día, sin corrimiento');
  const fetched = await api('GET', `/participant/${valid.data.id}`);
  assert.equal(fetched.data.birthDate, '1990-05-17');

  const future = await createUser('participant', 'birth2', { birthDate: localDate(1) });
  assert.equal(future.status, 400);
  const invalid = await createUser('organizer', 'birth3', { birthDate: '2001-02-30' });
  assert.equal(invalid.status, 400);

  const empty = await createUser('organizer', 'birth4', { birthDate: '' });
  assert.equal(empty.status, 201);
  assert.equal(empty.data.birthDate, null);

  const today = await api('PATCH', `/organizer/${empty.data.id}`, { birthDate: localDate(0) });
  assert.equal(today.status, 200, 'hoy no es futuro');
  const clear = await api('PATCH', `/organizer/${empty.data.id}`, { birthDate: '' });
  assert.equal(clear.status, 200);
  assert.equal(clear.data.birthDate, null);
});

test('eliminar tipos de entrada: bloqueado con entradas, permitido sin entradas', async () => {
  const blocked = await api('DELETE', `/venue/${venueA}/tickettype/${typeGeneral}`);
  assert.equal(blocked.status, 409);
  assert.equal(blocked.body.message, TICKET_TYPE_IN_USE);

  const unused = await createTicketType(venueA, 'Sin uso', 5);
  const allowed = await api('DELETE', `/venue/${venueA}/tickettype/${unused}`);
  assert.equal(allowed.status, 200);
});

test('eliminar métodos de pago: bloqueado si se usó en compras, permitido si no', async () => {
  const blocked = await api('DELETE', `/paymentmethod/${paymentMethodId}`);
  assert.equal(blocked.status, 409);
  assert.equal(blocked.body.message, PAYMENT_METHOD_IN_USE);

  const unused = await api('POST', '/paymentmethod', { type: `TEST-${RUN}-sin-uso` });
  paymentMethodIds.push(unused.data.id);
  const allowed = await api('DELETE', `/paymentmethod/${unused.data.id}`);
  assert.equal(allowed.status, 200);
});

test('validaciones del evento: todos los errores por campo, minutos libres y fechas pasadas', async () => {
  const empty = await api('POST', `/venue/${venueA}/event`, {});
  assert.equal(empty.status, 400);
  assert.deepEqual(
    Object.keys(empty.body.errors).sort(),
    ['coverImage', 'date', 'description', 'endTime', 'name', 'organizer', 'startTime', 'ticketTypes'],
    'informa todos los campos inválidos a la vez',
  );

  const freeMinutes = await createEvent(venueA, [typeGeneral], { date: localDate(42), startTime: '10:07', endTime: '11:53' });
  assert.equal(freeMinutes.status, 201);
  assert.equal(freeMinutes.data.startTime, '10:07:00', 'no se redondea');

  const badFormat = await createEvent(venueA, [typeGeneral], { date: localDate(42), startTime: '10:7', endTime: '25:00' });
  assert.equal(badFormat.status, 400);
  assert.ok(badFormat.body.errors.startTime && badFormat.body.errors.endTime);
  const seconds = await createEvent(venueA, [typeGeneral], { date: localDate(42), startTime: '12:00:30', endTime: '13:00' });
  assert.equal(seconds.status, 400);
  assert.ok(seconds.body.errors.startTime);

  const yesterday = await createEvent(venueA, [typeGeneral], { date: localDate(-1), startTime: '10:00', endTime: '11:00' });
  assert.equal(yesterday.status, 400);
  assert.ok(yesterday.body.errors.date);

  const pastHour = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  if (localDate(0) === `${pastHour.getFullYear()}-${pad(pastHour.getMonth() + 1)}-${pad(pastHour.getDate())}`) {
    const todayPast = await createEvent(venueA, [typeGeneral], {
      date: localDate(0),
      startTime: `${pad(pastHour.getHours())}:00`,
      endTime: `${pad(pastHour.getHours())}:30`,
    });
    assert.equal(todayPast.status, 400);
    assert.ok(todayPast.body.errors.startTime, 'hoy, pero con la hora ya pasada');
  }

  const sameTimes = await createEvent(venueA, [typeGeneral], { date: localDate(42), startTime: '15:00', endTime: '15:00' });
  assert.equal(sameTimes.status, 400);
  assert.ok(sameTimes.body.errors.endTime);
});

test('edición: evento ya comenzado sin tocar el inicio, sin tipos nuevos, y cambio de inicio validado', async () => {
  const event = (await createEvent(venueB, [typeOtherVenue], { date: localDate(43) })).data;
  // Se lleva el evento a "ya comenzado" (empezó hace 1 hora y termina en 2).
  const start = new Date(Date.now() - 60 * 60 * 1000);
  const end = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fmtTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
  await db.query('update event set date = ?, start_time = ?, end_time = ? where venue_id = ? and id_event = ?', [
    fmtDate(start), fmtTime(start), fmtTime(end), venueB, event.idEvent,
  ]);

  const { data: current } = await api('GET', `/venue/${venueB}/event/${event.idEvent}`);
  const rename = await api('PUT', `/venue/${venueB}/event/${event.idEvent}`, {
    name: 'TEST renombrado',
    description: current.description,
    coverImage: current.coverImage,
    date: current.date,
    startTime: current.startTime.slice(0, 5),
    endTime: current.endTime.slice(0, 5),
    organizer: organizerId,
  });
  assert.equal(rename.status, 200, 'se edita sin rechazar por la fecha original');
  assert.equal(rename.data.name, 'TEST renombrado');
  assert.equal(rename.data.addedTicketTypes, 0);
  assert.deepEqual(rename.data.ticketTypeIds, [typeOtherVenue]);

  const moveToPast = await api('PATCH', `/venue/${venueB}/event/${event.idEvent}`, { date: localDate(-2) });
  assert.equal(moveToPast.status, 400);
  assert.ok(moveToPast.body.errors.date);
});

test('edición: agregar tipos genera solo sus entradas, sin duplicar en reintentos', async () => {
  const event = (await createEvent(venueA, [typeGeneral], { date: localDate(44) })).data;
  const { data: before } = await api('GET', `/venue/${venueA}/event/${event.idEvent}`);
  assert.deepEqual(before.ticketTypeIds, [typeGeneral]);

  // Agota el evento para comprobar que vuelve a Programado al agregar un tipo.
  await buy(venueA, event.idEvent, typeGeneral, 2);
  assert.equal(await eventStatus(venueA, event.idEvent), 'sold_out');

  const add = await api('PATCH', `/venue/${venueA}/event/${event.idEvent}`, { ticketTypes: [typeNumbered] });
  assert.equal(add.status, 200);
  assert.equal(add.data.addedTicketTypes, 1);
  assert.deepEqual(add.data.ticketTypeIds, [typeNumbered, typeGeneral].sort((a, b) => a - b));
  assert.equal(await countTickets(venueA, event.idEvent), 5, '2 existentes + 3 del tipo nuevo');
  assert.equal(await countTickets(venueA, event.idEvent, 'vendida'), 2, 'las vendidas se conservan');
  assert.equal(await eventStatus(venueA, event.idEvent), 'scheduled');

  const retry = await api('PATCH', `/venue/${venueA}/event/${event.idEvent}`, { ticketTypes: [typeNumbered, typeGeneral] });
  assert.equal(retry.status, 200);
  assert.equal(retry.data.addedTicketTypes, 0);
  assert.equal(await countTickets(venueA, event.idEvent), 5, 'el reintento no duplica');

  const foreign = await api('PATCH', `/venue/${venueA}/event/${event.idEvent}`, { ticketTypes: [typeOtherVenue + 100] });
  assert.equal(foreign.status, 400);
  assert.ok(foreign.body.errors.ticketTypes);
  assert.equal(await countTickets(venueA, event.idEvent), 5);

  const noTypes = await api('PATCH', `/venue/${venueA}/event/${event.idEvent}`, { name: 'TEST sin tipos', ticketTypes: [] });
  assert.equal(noTypes.status, 200);
  assert.equal(await countTickets(venueA, event.idEvent), 5);
});

test('máximo 5 entradas por compra, sin límite acumulado por participante', async () => {
  const venueC = await createVenue('C');
  const bigType = await createTicketType(venueC, 'General', 20);
  const event = (await createEvent(venueC, [bigType], { date: localDate(45) })).data;

  const six = await buy(venueC, event.idEvent, bigType, 6);
  assert.equal(six.status, 400);
  assert.match(six.body.errors.quantity, /como máximo 5/);
  assert.equal(await countTickets(venueC, event.idEvent, 'vendida'), 0);

  assert.equal((await buy(venueC, event.idEvent, bigType, 5)).status, 201);
  assert.equal((await buy(venueC, event.idEvent, bigType, 5)).status, 201, 'el mismo participante puede volver a comprar');
  assert.equal(await countTickets(venueC, event.idEvent, 'vendida'), 10);

  // 3 compras simultáneas de 5 con 10 disponibles: solo 2 pueden completarse.
  const results = await Promise.all([1, 2, 3].map(() => buy(venueC, event.idEvent, bigType, 5)));
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 201, 409]);
  assert.equal(await countTickets(venueC, event.idEvent, 'vendida'), 20);
});

test('evento pasado pasa a Finalizado solo, no vuelve atrás y no admite compras ni ediciones', { timeout: 90_000 }, async () => {
  const event = (await createEvent(venueB, [typeOtherVenue], { date: localDate(46), startTime: '10:00', endTime: '11:00' })).data;
  // Ya no se puede crear un evento en el pasado: se lleva la fecha atrás por SQL.
  await db.query('update event set date = ? where venue_id = ? and id_event = ?', [localDate(-1), venueB, event.idEvent]);

  assert.equal((await buy(venueB, event.idEvent, typeOtherVenue, 1)).status, 409);

  let status = await eventStatus(venueB, event.idEvent);
  for (let i = 0; i < 70 && status !== 'finished'; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    status = await eventStatus(venueB, event.idEvent);
  }
  assert.equal(status, 'finished');

  assert.equal((await api('PATCH', `/venue/${venueB}/event/${event.idEvent}/cancel`)).status, 409);
  const edit = await api('PATCH', `/venue/${venueB}/event/${event.idEvent}`, { name: 'Otro nombre' });
  assert.equal(edit.status, 409);
  assert.match(edit.body.message, /finalizado/);
  assert.equal(await eventStatus(venueB, event.idEvent), 'finished');
});

// --- Flujo de compra del comprador ---

function buyItems(venueId, idEvent, items, participant = participantId) {
  return api('POST', '/ticket/purchase', {
    venue: venueId, event: idEvent, participant, paymentMethod: paymentMethodId,
    items: items.map(([ticketType, quantity]) => ({ ticketType, quantity })),
  });
}

test('compra con varios tipos: atómica, revalida stock y respeta 5 en total', async () => {
  const event = (await createEvent(venueA, [typeNumbered, typeGeneral], { date: localDate(50) })).data;

  const tooMany = await buyItems(venueA, event.idEvent, [[typeNumbered, 3], [typeGeneral, 3]]);
  assert.equal(tooMany.status, 400, 'más de 5 entre todos los tipos');

  const repeated = await buyItems(venueA, event.idEvent, [[typeGeneral, 1], [typeGeneral, 1]]);
  assert.equal(repeated.status, 400);

  const sale = await buyItems(venueA, event.idEvent, [[typeNumbered, 2], [typeGeneral, 1]]);
  assert.equal(sale.status, 201);
  assert.equal(sale.data.length, 3);
  assert.ok(sale.data.every((t) => t.status === 'vendida' && t.participant === participantId));
  assert.equal(new Set(sale.data.map((t) => t.purchaseDate)).size, 1, 'una sola compra: misma fecha');

  // Queda 1 Platea y 1 Campo: si un tipo no alcanza, no se vende ninguno.
  const partial = await buyItems(venueA, event.idEvent, [[typeGeneral, 1], [typeNumbered, 2]]);
  assert.equal(partial.status, 409);
  assert.ok(partial.body.errors.availability);
  assert.equal(await countTickets(venueA, event.idEvent, 'vendida'), 3, 'la compra fallida no vende nada');
});

test('login del comprador y alta con email repetido (el DNI puede repetirse)', async () => {
  const email = `test-${RUN}-par@example.com`;
  const ok = await api('POST', '/user/login', { email, password: 'secreto' }, null);
  assert.equal(ok.status, 200);
  assert.equal(ok.data.id, participantId);
  assert.ok(ok.data.token, 'devuelve el token de la sesión');
  assert.equal(ok.data.password, undefined, 'nunca devuelve la contraseña');

  const wrong = await api('POST', '/user/login', { email, password: 'otra' }, null);
  assert.equal(wrong.status, 401);
  assert.equal(wrong.body.message, 'Email o contraseña incorrectos.');

  const missing = await api('POST', '/user/login', {}, null);
  assert.equal(missing.status, 400);

  const dupEmail = await createUser('participant', 'par', { identityDocument: `T${RUN}otro` });
  assert.equal(dupEmail.status, 409);
  assert.equal(dupEmail.body.errors.email, 'Ya existe una cuenta registrada con ese email.');

  const dupDni = await createUser('participant', 'otro', { identityDocument: `T${RUN}par` });
  assert.equal(dupDni.status, 201, 'otro participante con el mismo DNI');
  const dupDniOrganizer = await createUser('organizer', 'otroorg', { identityDocument: `T${RUN}par` });
  assert.equal(dupDniOrganizer.status, 201, 'un organizador con el mismo DNI');
});

test('login único: devuelve el rol de participantes y organizadores', async () => {
  const participant = await api('POST', '/user/login', { email: `test-${RUN}-par@example.com`, password: 'secreto' });
  assert.equal(participant.status, 200);
  assert.deepEqual([participant.data.id, participant.data.role], [participantId, 'participant']);
  assert.equal(participant.data.password, undefined);

  const organizer = await api('POST', '/user/login', { email: `test-${RUN}-org@example.com`, password: 'secreto' });
  assert.equal(organizer.status, 200);
  assert.deepEqual([organizer.data.id, organizer.data.role], [organizerId, 'organizer']);

  const wrong = await api('POST', '/user/login', { email: `test-${RUN}-org@example.com`, password: 'otra' });
  assert.equal(wrong.status, 401);
});

test('eventos del organizador: solo los propios, campos permitidos y banner', async () => {
  const other = (await createUser('organizer', 'ajeno')).data.id;
  const base = `/organizer/${organizerId}/venue/${venueA}/event`;
  const body = {
    name: 'TEST organizador',
    description: 'Evento del organizador',
    coverImage: 'https://example.com/cover.jpg',
    banner: 'https://example.com/banner.jpg',
    date: localDate(60),
    startTime: '10:00',
    endTime: '11:00',
    ticketTypes: [typeGeneral],
  };

  const asOther = await api('POST', base, { ...body, organizer: other });
  assert.equal(asOther.status, 403, 'no crea a nombre de otro organizador');
  const badUrls = await api('POST', base, { ...body, coverImage: 'portada', banner: 'ftp://banner' });
  assert.equal(badUrls.status, 400);
  assert.deepEqual(Object.keys(badUrls.body.errors).sort(), ['banner', 'coverImage']);

  const created = await api('POST', base, body);
  assert.equal(created.status, 201);
  assert.equal(created.data.banner, body.banner);
  const id = created.data.idEvent;

  const list = await api('GET', `/organizer/${organizerId}/event`);
  assert.ok(list.data.some((e) => e.idEvent === id && e.venue.id === venueA));
  const otherList = await api('GET', `/organizer/${other}/event`);
  assert.equal(otherList.data.length, 0, 'no ve eventos ajenos');

  const foreign = `/organizer/${other}/venue/${venueA}/event/${id}`;
  assert.equal((await api('GET', foreign)).status, 404);
  assert.equal((await api('PUT', foreign, { name: 'x' })).status, 404);
  assert.equal((await api('PATCH', `${foreign}/cancel`)).status, 404);

  const locked = await api('PUT', `${base}/${id}`, { date: localDate(61), organizer: other });
  assert.equal(locked.status, 400);
  assert.deepEqual(Object.keys(locked.body.errors).sort(), ['date', 'organizer']);

  const edited = await api('PUT', `${base}/${id}`, { name: 'TEST editado', banner: '', ticketTypes: [typeGeneral, typeNumbered] });
  assert.equal(edited.status, 200);
  assert.equal(edited.data.banner, null, 'banner vacío se guarda como null');
  assert.equal(await countTickets(venueA, id), 5, 'genera solo las entradas del tipo nuevo');
  await api('PUT', `${base}/${id}`, { ticketTypes: [typeGeneral, typeNumbered] });
  assert.equal(await countTickets(venueA, id), 5, 'el reintento no duplica entradas');

  const cancelled = await api('PATCH', `${base}/${id}/cancel`);
  assert.equal(cancelled.status, 200);
  assert.equal(cancelled.data.status, 'cancelled');
  assert.equal(await countTickets(venueA, id, 'cancelada'), 5);
});

test('un organizador no puede comprar entradas: 403 (permisos), no "participante inexistente"', async () => {
  const event = (await createEvent(venueA, [typeGeneral], { date: localDate(70) })).data;

  const asOrganizer = await buy(venueA, event.idEvent, typeGeneral, 1, organizerId);
  assert.equal(asOrganizer.status, 403);
  assert.equal(asOrganizer.body.message, 'Las cuentas de organizador no pueden comprar entradas.');
  assert.equal(await countTickets(venueA, event.idEvent, 'vendida'), 0, 'no vende ninguna entrada');

  const missing = await buy(venueA, event.idEvent, typeGeneral, 1, 999999999);
  assert.equal(missing.status, 400, 'un id inexistente sigue siendo 400');

  const asParticipant = await buy(venueA, event.idEvent, typeGeneral, 1);
  assert.equal(asParticipant.status, 201, 'el participante compra normalmente');
});

async function tokenOf(name) {
  const { data } = await api('POST', '/user/login', { email: `test-${RUN}-${name}@example.com`, password: 'secreto' }, null);
  return data.token;
}

test('permisos: las CRUD administrativas son solo para el admin', async () => {
  const participantToken = await tokenOf('par');
  const organizerToken = await tokenOf('org');
  const venueBody = {
    name: `TEST-${RUN}-permisos`,
    address: { street: 'Calle', streetNumber: '1', postalCode: '2000', locality: 'Rosario', province: 'Santa Fe' },
  };

  for (const [method, path, body] of [
    ['POST', '/venue', venueBody],
    ['DELETE', `/venue/${venueB}`],
    ['POST', '/paymentmethod', { type: `TEST-${RUN}-x` }],
    ['POST', `/venue/${venueA}/tickettype`, { location: 'X', quantity: 1, isNumbered: false, price: 1 }],
    ['GET', '/participant'],
    ['GET', '/organizer'],
    ['GET', '/admin'],
    ['GET', '/ticket'],
  ]) {
    assert.equal((await api(method, path, body, null)).status, 401, `${method} ${path} sin sesión`);
    assert.equal((await api(method, path, body, participantToken)).status, 403, `${method} ${path} participante`);
    assert.equal((await api(method, path, body, organizerToken)).status, 403, `${method} ${path} organizador`);
  }

  assert.equal((await api('GET', '/admin')).status, 200, 'el admin lista administradores');
  assert.equal((await api('GET', '/venue', undefined, null)).status, 200, 'la lectura de lugares es pública');
  assert.equal((await api('GET', '/user', undefined, 'token-falso')).status, 401, 'token inválido');
});

test('permisos: cada usuario solo accede a su propia cuenta, entradas y eventos', async () => {
  const participantToken = await tokenOf('par');
  const organizerToken = await tokenOf('org');
  const other = (await createUser('participant', 'vecino')).data.id;

  assert.equal((await api('GET', `/participant/${participantId}`, undefined, participantToken)).status, 200);
  assert.equal((await api('GET', `/participant/${other}`, undefined, participantToken)).status, 403);
  assert.equal((await api('PUT', `/participant/${other}`, { firstName: 'x' }, participantToken)).status, 403);
  assert.equal((await api('GET', `/organizer/${organizerId}`, undefined, organizerToken)).status, 200);
  assert.equal((await api('GET', `/organizer/${organizerId}`, undefined, participantToken)).status, 403);

  assert.equal((await api('GET', `/ticket?participant=${participantId}`, undefined, participantToken)).status, 200);
  assert.equal((await api('GET', `/ticket?participant=${other}`, undefined, participantToken)).status, 403);

  const event = (await createEvent(venueA, [typeGeneral], { date: localDate(75) })).data;
  const purchase = { venue: venueA, event: event.idEvent, ticketType: typeGeneral, quantity: 1, paymentMethod: paymentMethodId };
  assert.equal((await api('POST', '/ticket/purchase', { ...purchase, participant: participantId }, null)).status, 401);
  assert.equal((await api('POST', '/ticket/purchase', { ...purchase, participant: other }, participantToken)).status, 403, 'no compra a nombre de otro');
  assert.equal((await api('POST', '/ticket/purchase', { ...purchase, participant: participantId }, participantToken)).status, 201);

  assert.equal((await api('GET', `/organizer/${organizerId}/event`, undefined, organizerToken)).status, 200);
  assert.equal((await api('GET', `/organizer/${organizerId}/event`, undefined, participantToken)).status, 403);
});

test('registro público: crea el participante e inicia sesión con un token', async () => {
  const response = await api('POST', '/participant', {
    firstName: 'Nuevo', lastName: 'Test', email: `test-${RUN}-nuevo@example.com`,
    identityDocument: '12345678', password: 'secreto', birthDate: '2000-01-01',
  }, null);
  assert.equal(response.status, 201);
  assert.ok(response.data.token);
  assert.equal(response.data.password, undefined, 'nunca devuelve la contraseña');
  const own = await api('GET', `/participant/${response.data.id}`, undefined, response.data.token);
  assert.equal(own.status, 200);
});

test('medios de pago: no se repite el tipo (sin importar mayúsculas, acentos ni espacios)', async () => {
  const first = await api('POST', '/paymentmethod', { type: `TEST-${RUN}-Débito` });
  assert.equal(first.status, 201);
  paymentMethodIds.push(first.data.id);

  const duplicate = await api('POST', '/paymentmethod', { type: `  test-${RUN}-debito ` });
  assert.equal(duplicate.status, 409);
  assert.ok(duplicate.body.errors.type);

  const other = await api('POST', '/paymentmethod', { type: `TEST-${RUN}-Débito 2` });
  assert.equal(other.status, 201);
  paymentMethodIds.push(other.data.id);

  const renamed = await api('PUT', `/paymentmethod/${other.data.id}`, { type: `TEST-${RUN}-DÉBITO` });
  assert.equal(renamed.status, 409, 'no se renombra igual a otro');
  const same = await api('PUT', `/paymentmethod/${first.data.id}`, { type: `TEST-${RUN}-Débito` });
  assert.equal(same.status, 200, 'editar sin cambiar el tipo es válido');

  const empty = await api('POST', '/paymentmethod', { type: '   ' });
  assert.equal(empty.status, 400);
});

test('lugares: no se repite el nombre en la misma ciudad ni la dirección', async () => {
  async function post(body) {
    const response = await api('POST', '/venue', body);
    if (response.status === 201) venues.push(response.data.id);
    return response;
  }

  const base = venueBody('Teatro');
  assert.equal((await post(base)).status, 201);

  const sameName = await post({ ...venueBody('teatro'), name: ` test-${RUN}-TEATRO ` });
  assert.equal(sameName.status, 409, 'mismo nombre en la misma localidad');
  assert.ok(sameName.body.errors.name);

  const otherCity = await post(venueBody('Teatro', { street: `Otra ${RUN}`, locality: 'Santa Fe' }));
  assert.equal(otherCity.status, 201, 'mismo nombre en otra localidad');

  const sameAddress = await post({ ...base, name: `TEST-${RUN}-Otro nombre` });
  assert.equal(sameAddress.status, 409, 'misma dirección con otro nombre');
  assert.ok(sameAddress.body.errors.address);

  const otherNumber = await post({
    ...base,
    name: `TEST-${RUN}-Vecino`,
    address: { ...base.address, streetNumber: '2' },
  });
  assert.equal(otherNumber.status, 201, 'otro número en la misma calle');

  const edit = await api('PUT', `/venue/${otherNumber.data.id}`, { ...base, name: `TEST-${RUN}-Vecino` });
  assert.equal(edit.status, 409, 'no se edita hacia una dirección ocupada');
});

test('tipos de entrada: no se repite el nombre dentro de un lugar', async () => {
  const venue = await createVenue('Metropolitano');
  const vip = await createTicketType(venue, 'VIP', 10);

  const duplicate = await api('POST', `/venue/${venue}/tickettype`, { location: ' vip ', quantity: 5, isNumbered: false, price: 1 });
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.body.errors.location, 'El lugar ya tiene un tipo de entrada "VIP". Usá otro nombre.');

  const vip2 = await api('POST', `/venue/${venue}/tickettype`, { location: 'VIP 2', quantity: 5, isNumbered: false, price: 1 });
  assert.equal(vip2.status, 201, 'otro VIP con nombre distinto');

  assert.equal((await api('PUT', `/venue/${venue}/tickettype/${vip2.data.idTicketType}`, { location: 'Vip' })).status, 409);
  assert.equal((await api('PUT', `/venue/${venue}/tickettype/${vip}`, { location: 'VIP', quantity: 12 })).status, 200);

  const otherVenue = await createTicketType(venueA, 'VIP', 1);
  assert.ok(otherVenue, 'el mismo nombre en otro lugar está permitido');
});

test('CRUD de administradores: alta, edición, cambio de contraseña y bajas protegidas', async () => {
  const created = await createUser('admin', 'admin2');
  assert.equal(created.status, 201);
  assert.equal(created.data.password, undefined);
  const id = created.data.id;

  const login = await api('POST', '/user/login', { email: `test-${RUN}-admin2@example.com`, password: 'secreto' }, null);
  assert.equal(login.data.role, 'admin');

  const duplicated = await createUser('admin', 'admin2');
  assert.equal(duplicated.status, 409);

  const edited = await api('PUT', `/admin/${id}`, { firstName: 'Editado' });
  assert.equal(edited.status, 200);
  assert.equal(edited.data.firstName, 'Editado');

  const password = await api('PATCH', `/admin/${id}/password`, { currentPassword: 'secreto', newPassword: 'nueva' }, login.data.token);
  assert.equal(password.status, 200);

  const self = await api('DELETE', `/admin/${id}`, undefined, login.data.token);
  assert.equal(self.status, 409, 'no se elimina a sí mismo');

  const removed = await api('DELETE', `/admin/${id}`);
  assert.equal(removed.status, 200);
  assert.equal((await api('GET', `/admin/${id}`)).status, 404);
});
