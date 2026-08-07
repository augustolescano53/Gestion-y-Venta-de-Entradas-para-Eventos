import crypto from 'node:crypto'

export class Usuario {
  constructor(
    public nombre: string,
    public apellido: string,
    public mail: string,
    public id: string = crypto.randomUUID(),
    public dni: string,
    public contrasena: string,
  ) {}
}
