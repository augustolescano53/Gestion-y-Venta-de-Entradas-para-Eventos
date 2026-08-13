import crypto from 'node:crypto';

export class Evento {
  constructor(
    public fecha: Date,
    public horaInicio: String,
    public horaFin: String,
    public id: string = crypto.randomUUID(),
    public imagenPortada: string,
    public descripcion: string,
    public estado: string,
  ) {}
}
