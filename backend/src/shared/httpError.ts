import { Response } from 'express';
import { NotFoundError } from '@mikro-orm/core';

export type FieldErrors = Record<string, string>;

// Se lanza dentro de em.transactional para que MikroORM haga rollback y el
// controller responda con este código y mensaje.
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: FieldErrors,
  ) {
    super(message);
  }
}

// Los errores inesperados quedan en la consola: al usuario nunca le llega
// SQL ni nombres internos de la base.
export function sendError(res: Response, error: unknown, notFoundMessage = 'El recurso no existe.') {
  if (error instanceof HttpError) {
    return res.status(error.status).send({ message: error.message, errors: error.fields });
  }
  if (error instanceof NotFoundError) {
    return res.status(404).send({ message: notFoundMessage });
  }
  console.error(error);
  return res.status(500).send({ message: 'Ocurrió un error inesperado.' });
}

export function sendFieldErrors(res: Response, errors: FieldErrors) {
  return res.status(400).send({ message: 'Revisá los campos marcados.', errors });
}

export function toPositiveInt(value: unknown): number | null {
  const number = typeof value === 'string' ? Number(value) : value;
  return typeof number === 'number' && Number.isInteger(number) && number > 0 ? number : null;
}
