import { Repository } from "../shared/repository.js"
import { TicketType } from "./tickettype.entity.js"
import { pool } from "../shared/db/conn.mysql.js"
import { ResultSetHeader, RowDataPacket } from "mysql2"

export class TicketTypeRepository implements Repository<TicketType> {

  public async findAll(idVenue?: string): Promise<TicketType[] | undefined> {
    const venueId = Number.parseInt(idVenue as string)

    const [tickettypes] = await pool.query<RowDataPacket[]>(
      'select idTicketType as id, idVenue, quantity, location, isNumbered from tickettype where idVenue = ?',
      [venueId]
    )

    return (tickettypes as TicketType[]).map((tt) => ({ ...tt, isNumbered: !!tt.isNumbered }))
  }

  public async findOne(item: { id: string; idVenue: string }): Promise<TicketType | undefined> {
    const id = Number.parseInt(item.id)
    const venueId = Number.parseInt(item.idVenue)

    const [tickettypes] = await pool.query<RowDataPacket[]>(
      'select idTicketType as id, idVenue, quantity, location, isNumbered from tickettype where idTicketType = ? and idVenue = ?',
      [id, venueId]
    )

    if (tickettypes.length === 0) {
      return undefined
    }

    const tickettype = tickettypes[0] as TicketType
    tickettype.isNumbered = !!tickettype.isNumbered
    return tickettype
  }

  public async add(tickettypeInput: TicketType): Promise<TicketType | undefined> {
    const venueId = Number(tickettypeInput.idVenue)

    const [nextIdRows] = await pool.query<RowDataPacket[]>(
      'select ifnull(max(idTicketType), 0) + 1 as nextId from tickettype where idVenue = ?',
      [venueId]
    )
    const nextId = nextIdRows[0].nextId as number

    const { id, ...tickettypeRow } = tickettypeInput

    await pool.query<ResultSetHeader>(
      'insert into tickettype set ?',
      [{ idTicketType: nextId, ...tickettypeRow }]
    )

    tickettypeInput.id = nextId
    return tickettypeInput
  }

  public async update(id: string, tickettypeInput: TicketType): Promise<TicketType | undefined> {
    const ticketTypeId = Number.parseInt(id)
    const venueId = Number(tickettypeInput.idVenue)

    const { id: _discardedId, idVenue: _discardedIdVenue, ...tickettypeRow } = tickettypeInput

    await pool.query(
      'update tickettype set ? where idTicketType = ? and idVenue = ?',
      [tickettypeRow, ticketTypeId, venueId]
    )

    return await this.findOne({ id, idVenue: String(venueId) })
  }

  public async delete(item: { id: string; idVenue: string }): Promise<TicketType | undefined> {
    try {
      const tickettypeToDelete = await this.findOne(item)
      const id = Number.parseInt(item.id)
      const venueId = Number.parseInt(item.idVenue)

      await pool.query(
        'delete from tickettype where idTicketType = ? and idVenue = ?',
        [id, venueId]
      )

      return tickettypeToDelete
    } catch (error: any) {
      throw new Error('unable to delete ticket type')
    }
  }
}
