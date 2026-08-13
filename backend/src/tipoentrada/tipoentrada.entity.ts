import crypto from 'node:crypto'

export class TipoEntrada {
  constructor(
    public cantidad: number,
    public ubicacion: string,
    public esNumerada: boolean,
    public id: string = crypto.randomUUID(),
  ) {}
}
