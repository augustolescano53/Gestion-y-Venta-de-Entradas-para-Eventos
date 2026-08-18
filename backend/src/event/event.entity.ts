export class Event {
  constructor(
    public description: string,
    public status: string,
    public coverImage: string,
    public date: string,
    public startTime: string,
    public endTime: string,
    public idVenue: number,
    public id?: number,
  ) {}
}
