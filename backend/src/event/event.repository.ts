import { Repository } from "../shared/repository.js"
import { Event } from "./event.entity.js"
import { pool } from "../shared/db/conn.mysql.js"
import { ResultSetHeader, RowDataPacket } from "mysql2"

export class EventRepository implements Repository<Event> {

  public async findAll(idVenue?: string): Promise<Event[] | undefined> {
    const venueId = Number.parseInt(idVenue as string)

    const [events] = await pool.query<RowDataPacket[]>(
      'select idEvent as id, idVenue, description, status, coverImage, date, startTime, endTime from event where idVenue = ?',
      [venueId]
    )

    return events as Event[]
  }

  public async findOne(item: { id: string; idVenue: string }): Promise<Event | undefined> {
    const id = Number.parseInt(item.id)
    const venueId = Number.parseInt(item.idVenue)

    const [events] = await pool.query<RowDataPacket[]>(
      'select idEvent as id, idVenue, description, status, coverImage, date, startTime, endTime from event where idEvent = ? and idVenue = ?',
      [id, venueId]
    )

    if (events.length === 0) {
      return undefined
    }

    return events[0] as Event
  }

  public async add(eventInput: Event): Promise<Event | undefined> {
    const venueId = Number(eventInput.idVenue)

    const [nextIdRows] = await pool.query<RowDataPacket[]>(
      'select ifnull(max(idEvent), 0) + 1 as nextId from event where idVenue = ?',
      [venueId]
    )
    const nextId = nextIdRows[0].nextId as number

    const { id, ...eventRow } = eventInput

    await pool.query<ResultSetHeader>(
      'insert into event set ?',
      [{ idEvent: nextId, ...eventRow }]
    )

    eventInput.id = nextId
    return eventInput
  }

  public async update(id: string, eventInput: Event): Promise<Event | undefined> {
    const eventId = Number.parseInt(id)
    const venueId = Number(eventInput.idVenue)

    const { id: _discardedId, idVenue: _discardedIdVenue, ...eventRow } = eventInput

    await pool.query(
      'update event set ? where idEvent = ? and idVenue = ?',
      [eventRow, eventId, venueId]
    )

    return await this.findOne({ id, idVenue: String(venueId) })
  }

  public async delete(item: { id: string; idVenue: string }): Promise<Event | undefined> {
    try {
      const eventToDelete = await this.findOne(item)
      const id = Number.parseInt(item.id)
      const venueId = Number.parseInt(item.idVenue)

      await pool.query(
        'delete from event where idEvent = ? and idVenue = ?',
        [id, venueId]
      )

      return eventToDelete
    } catch (error: any) {
      throw new Error('unable to delete event')
    }
  }
}
