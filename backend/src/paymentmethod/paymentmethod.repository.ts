import { Repository } from '../shared/repository.js'
import { PaymentMethod } from './paymentmethod.entity.js'
import { pool } from '../shared/db/conn.mysql.js'
import { ResultSetHeader, RowDataPacket } from 'mysql2'

export class PaymentMethodRepository implements Repository<PaymentMethod> {
  public async findAll(): Promise<PaymentMethod[] | undefined> {
    const [paymentmethod] = await pool.query('select idPaymentMethod as id, type from paymentmethod')
    return paymentmethod as PaymentMethod[]
  }

  public async findOne(item: { id: string }): Promise<PaymentMethod | undefined> {
    const id = Number.parseInt(item.id)
    const [paymentmethods] = await pool.query<RowDataPacket[]>('select idPaymentMethod as id, type from paymentmethod where idPaymentMethod = ?', [id])
    if (paymentmethods.length === 0) {
      return undefined
    }
    const paymentmethod = paymentmethods[0] as PaymentMethod
    return paymentmethod
  }

  public async add(paymentmethodInput: PaymentMethod): Promise<PaymentMethod | undefined> {
    const { id, ...paymentmethodRow } = paymentmethodInput
    const [result] = await pool.query<ResultSetHeader>('insert into paymentmethod set ?', [paymentmethodRow])
    paymentmethodInput.id = result.insertId
    return paymentmethodInput
  }

  public async update(id: string, paymentmethodInput: PaymentMethod): Promise<PaymentMethod | undefined> {
    const paymentmethodId = Number.parseInt(id)
    const { id: _discardedId, ...paymentmethodRow } = paymentmethodInput
    await pool.query('update paymentmethod set ? where idPaymentMethod = ?', [paymentmethodRow, paymentmethodId])
    return await this.findOne({ id })
  }

  public async delete(item: { id: string }): Promise<PaymentMethod | undefined> {
    try {
      const paymentmethodToDelete = await this.findOne(item)
      const paymentmethodId = Number.parseInt(item.id)
      await pool.query('delete from paymentmethod where idPaymentMethod = ?', paymentmethodId)
      return paymentmethodToDelete
    } catch (error: any) {
      throw new Error('unable to delete payment method')
    }
  }
}