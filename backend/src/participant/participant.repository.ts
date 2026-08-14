import { pool } from "../shared/db/conn.mysql.js";
import { Repository } from "../shared/repository.js";
import { Participant } from "./participant.entity.js";
import { ResultSetHeader, RowDataPacket } from 'mysql2'

export class ParticipantRepository implements Repository<Participant>{

  public async findAll(): Promise<Participant[] | undefined> {
    const [participants] = await pool.query(
      `select p.idParticipant as id, firstName, lastName, email, identityDocument, password
       from participant p
       inner join user u on p.idParticipant = u.idUser`
    )
    return participants as Participant[]
  }

  public async findOne(item: { id: string }): Promise<Participant | undefined> {
    const id = Number.parseInt(item.id)
    const [participants] = await pool.query<RowDataPacket[]>(
      `select p.idParticipant as id, firstName, lastName, email, identityDocument, password
       from participant p
       inner join user u on p.idParticipant = u.idUser
       where p.idParticipant = ?`, [id])
       
    if (participants.length === 0) {
      return undefined
    }
    const participant = participants[0] as Participant
    return participant
  }

public async add(participantInput: Participant): Promise<Participant | undefined> {
  const { id, ...participantRow } = participantInput
  const [userResult] = await pool.query<ResultSetHeader>('insert into user set ?', [participantRow])

  try {
    await pool.query<ResultSetHeader>('insert into participant (idParticipant) values (?)', [userResult.insertId])
  } catch (err) {
    await pool.query('delete from user where idUser = ?', [userResult.insertId])
    throw new Error('unable to insert participant')
  }

  participantInput.id = userResult.insertId
  return participantInput
}


  public async update(id: string, participantInput: Participant): Promise<Participant | undefined> {
    const participantId = Number.parseInt(id)
    const { id: _discardedId, ...participantRow } = participantInput
    await pool.query('update user set ? where idUser = ?', [participantRow, participantId])
    return await this.findOne({ id })
  }

  public async delete(item: { id: string }): Promise<Participant | undefined> {
    try {
      const participantToDelete = await this.findOne(item)
      const participantId = Number.parseInt(item.id)
      await pool.query('delete from user where idUser = ?', [participantId])
      return participantToDelete
    } catch (error: any) {
      throw new Error('unable to delete participant')
    }
  }
}