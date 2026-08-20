export class TicketType {
  constructor(
    public quantity: number,
    public location: string,
    public isNumbered: boolean,
    public idVenue: number,
    public id?: number,
  ) {}
}
