

export class User {
  constructor(
    public firstName: string,
    public lastName: string,
    public email: string,
    public identityDocument: string,
    public password: string,
    public id?: number
  ) {}
}
