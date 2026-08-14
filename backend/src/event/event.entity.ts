import crypto from 'node:crypto';

export class Event {
  constructor(
    public date: Date,
    public startTime: String,
    public endTime: String,
    public id: string = crypto.randomUUID(),
    public coverImage: string,
    public description: string,
    public status: string,
  ) {}
}
