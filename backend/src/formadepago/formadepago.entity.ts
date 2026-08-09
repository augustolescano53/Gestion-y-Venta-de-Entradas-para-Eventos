import crypto from 'node:crypto'

export class FormaDePago{
  constructor(
  public id: string = crypto.randomUUID(),
  public tipo: string
  ){}
}