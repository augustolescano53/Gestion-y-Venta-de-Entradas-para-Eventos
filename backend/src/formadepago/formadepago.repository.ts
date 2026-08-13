import { Repository } from '../shared/repository.js'
import { FormaDePago } from './formadepago.entity.js'
import { pool } from '../shared/db/conn.mysql.js'
import { ResultSetHeader, RowDataPacket } from 'mysql2'

export class FormaDePagoRepository implements Repository<FormaDePago> {
  public async findAll(): Promise<FormaDePago[] | undefined> {
    const [formadepago] = await pool.query('select * from formadepago')
    return formadepago as FormaDePago[]
  }

  public async findOne(item: { id: string }): Promise<FormaDePago | undefined> {
    const id = Number.parseInt(item.id)
    const [formasdepago] = await pool.query<RowDataPacket[]>('select * from formadepago where idFormaDePago = ?', [id])
    if (formasdepago.length === 0) {
      return undefined
    }
    const formadepago = formasdepago[0] as FormaDePago
    return formadepago
  }

  public async add(formadepagoInput: FormaDePago): Promise<FormaDePago | undefined> {
    const { id, ...formadepagoRow } = formadepagoInput
    const [result] = await pool.query<ResultSetHeader>('insert into formadepago set ?', [formadepagoRow])
    formadepagoInput.id = result.insertId
    return formadepagoInput
  }

  public async update(id: string, formadepagoInput: FormaDePago): Promise<FormaDePago | undefined> {
    const formadepagoId = Number.parseInt(id)
    await pool.query('update formadepago set ? where idFormaDePago = ?', [formadepagoInput, formadepagoId])
    return await this.findOne({ id })
  }

  public async delete(item: { id: string }): Promise<FormaDePago | undefined> {
    try {
      const formadepagoToDelete = await this.findOne(item)
      const formadepagoId = Number.parseInt(item.id)
      await pool.query('delete from formadepago where idFormaDePago = ?', formadepagoId)
      return formadepagoToDelete
    } catch (error: any) {
      throw new Error('unable to delete forma de pago')
    }
  }
}