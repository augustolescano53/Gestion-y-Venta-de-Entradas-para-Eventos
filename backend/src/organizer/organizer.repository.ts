import { pool } from "../shared/db/conn.mysql.js";
import { Repository } from "../shared/repository.js";
import { Organizer } from "./organizer.entity.js";
import { ResultSetHeader, RowDataPacket } from 'mysql2'

export class OrganizerRepository implements Repository<Organizer>{

  public async findAll(): Promise<Organizer[] | undefined> {
    const [organizer] = await pool.query(
      `select o.idOrganizer as id, firstName, lastName, email, identityDocument, password
       from organizer o
       inner join user u on o.idOrganizer = u.idUser`
    )
    return organizer as Organizer[]
  }

  public async findOne(item: { id: string }): Promise<Organizer | undefined> {
    const id = Number.parseInt(item.id)
    const [organizers] = await pool.query<RowDataPacket[]>(
      `select o.idOrganizer as id, firstName, lastName, email, identityDocument, password
       from organizer o
       inner join user u on o.idOrganizer = u.idUser
       where o.idOrganizer = ?`, [id])
       
    if (organizers.length === 0) {
      return undefined
    }
    const organizer = organizers[0] as Organizer
    return organizer
  }

public async add(organizerInput: Organizer): Promise<Organizer | undefined> {
  const { id, ...organizerRow } = organizerInput
  const [userResult] = await pool.query<ResultSetHeader>('insert into user set ?', [organizerRow])

  try {
    await pool.query<ResultSetHeader>('insert into organizer (idOrganizer) values (?)', [userResult.insertId])
  } catch (err) {
    await pool.query('delete from user where idUser = ?', [userResult.insertId])
    throw new Error('unable to insert organizer')
  }

  organizerInput.id = userResult.insertId
  return organizerInput
}


  public async update(id: string, organizerInput: Organizer): Promise<Organizer | undefined> {
    const organizerId = Number.parseInt(id)
    const { id: _discardedId, ...organizerRow } = organizerInput
    await pool.query('update user set ? where idUser = ?', [organizerRow, organizerId])
    return await this.findOne({ id })
  }

  public async delete(item: { id: string }): Promise<Organizer | undefined> {
    try {
      const organizerToDelete = await this.findOne(item)
      const organizerId = Number.parseInt(item.id)
      await pool.query('delete from user where idUser = ?', [organizerId])
      return organizerToDelete
    } catch (error: any) {
      throw new Error('unable to delete organizer')
    }
  }
}