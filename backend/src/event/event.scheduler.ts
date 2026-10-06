import { SqlEntityManager } from '@mikro-orm/mysql';
import { orm } from '../shared/db/orm.js';
import { EVENT_STATUS, SQL_EVENT_END, localNowString } from './event.status.js';

const INTERVAL_MS = 60_000;

// Usa knex directamente para no llenar la consola (debug: true) con la
// misma consulta cada minuto.
export async function finishEndedEvents() {
  const knex = (orm.em as unknown as SqlEntityManager).getKnex();
  const [result] = await knex.raw(
    `update event set status = ? where status in (?, ?) and ${SQL_EVENT_END} <= ?`,
    [EVENT_STATUS.FINISHED, EVENT_STATUS.SCHEDULED, EVENT_STATUS.SOLD_OUT, localNowString()],
  );
  if (result.affectedRows > 0) {
    console.log(`Eventos finalizados automáticamente: ${result.affectedRows}`);
  }
}

export function startEventStatusScheduler() {
  const run = () => finishEndedEvents().catch((error) => console.error(error));
  run();
  return setInterval(run, INTERVAL_MS);
}
