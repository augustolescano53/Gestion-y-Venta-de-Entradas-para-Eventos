import { Repository } from '../shared/repository.js'
import { Venue } from './venue.entity.js'
import { pool } from '../shared/db/conn.mysql.js'
import { ResultSetHeader, RowDataPacket } from 'mysql2'

export class VenueRepository implements Repository<Venue> {
  public async findAll(): Promise<Venue[] | undefined> {
    const [venues] = await pool.query(
      'select idVenue as id, name from venue'
    )

    return venues as Venue[]
  }

  public async findOne(item: { id: string }): Promise<Venue | undefined> {
    const id = Number.parseInt(item.id)

    const [venues] = await pool.query<RowDataPacket[]>(
      'select idVenue as id, name from venue where idVenue = ?',
      [id]
    )

    if (venues.length === 0) {
      return undefined
    }

    return venues[0] as Venue
  }

  public async add(venueInput: Venue): Promise<Venue | undefined> {
    const { id, ...venueRow } = venueInput

    const [result] = await pool.query<ResultSetHeader>(
      'insert into venue set ?',
      [venueRow]
    )

    venueInput.id = result.insertId
    return venueInput
  }

  public async update(
    id: string,
    venueInput: Venue
  ): Promise<Venue | undefined> {
    const venueId = Number.parseInt(id)

    const { id: _discardedId, ...venueRow } = venueInput

    await pool.query(
      'update venue set ? where idVenue = ?',
      [venueRow, venueId]
    )

    return await this.findOne({ id })
  }

  public async delete(item: { id: string }): Promise<Venue | undefined> {
    try {
      const venueToDelete = await this.findOne(item)
      const venueId = Number.parseInt(item.id)

      await pool.query(
        'delete from venue where idVenue = ?',
        [venueId]
      )

      return venueToDelete
    } catch (error: any) {
      throw new Error('unable to delete venue')
    }
  }
}
