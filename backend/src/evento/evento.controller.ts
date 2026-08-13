import { Request, Response, NextFunction } from 'express';
import { EventoRepository } from './evento.repository.js';
import { Evento } from './evento.entity.js';

const repository = new EventoRepository();

function sanitizeEventoInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    fecha: req.body.fecha,
    horaInicio: req.body.horaInicio,
    horaFin: req.body.horaFin,
    id: req.body.id,
    imagenPortada: req.body.imagenPortada,
    descripcion: req.body.descripcion,
    estado: req.body.estado,
  };

  Object.keys(req.body.sanitizedInput).forEach((key) => {
    if (req.body.sanitizedInput[key] === undefined) {
      delete req.body.sanitizedInput[key];
    }
  });

  next();
}

function findAll(req: Request, res: Response) {
  res.json({ data: repository.findAll() });
}

function findOne(req: Request<{ id: string }>, res: Response) {
  const evento = repository.findOne({ id: req.params.id });
  if (!evento) {
    return res.status(404).send({ message: 'Evento not found' });
  }
  res.json({ data: evento });
}

function add(req: Request, res: Response) {
  const input = req.body.sanitizedInput;

  const eventoInput = new Evento(
    input.fecha,
    input.horaInicio,
    input.horaFin,
    input.id,
    input.imagenPortada,
    input.descripcion,
    input.estado,
  );

  const evento = repository.add(eventoInput);
  res.status(201).send({ message: 'Evento created', data: evento });
}

function update(req: Request, res: Response) {
  req.body.sanitizedInput.id = req.params.id;
  const evento = repository.update(req.body.sanitizedInput);
  if (!evento) {
    return res.status(404).send({ message: 'Evento not found' });
  }
  return res
    .status(200)
    .send({ message: 'Evento updated successfully', data: evento });
}

function remove(req: Request<{ id: string }>, res: Response) {
  const id = req.params.id;
  const evento = repository.delete({ id });

  if (!evento) {
    res.status(404).send({ message: 'Evento not found' });
  } else {
    res.status(200).send({ message: 'Evento deleted successfully' });
  }
}

export { sanitizeEventoInput, findAll, findOne, add, update, remove };
