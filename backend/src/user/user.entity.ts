import crypto from 'node:crypto'

export class User {
  constructor(
    public firstName: string,
    public lastName: string,
    public email: string,
    public id: string = crypto.randomUUID(),
    public identityDocument: string,
    public password: string,
  ) {}
}
