import crypto from 'node:crypto'

export class TicketType {
  constructor(
    public quantity: number,
    public location: string,
    public isNumbered: boolean,
    public id: string = crypto.randomUUID(),
  ) {}
}
