import { Request, Response, NextFunction } from 'express';
import { EventRepository } from './event.repository.js';
import { Event } from './event.entity.js';

const repository = new EventRepository();

function sanitizeEventInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    date: req.body.date,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    id: req.body.id,
    coverImage: req.body.coverImage,
    description: req.body.description,
    status: req.body.status,
  };

  Object.keys(req.body.sanitizedInput).forEach((key) => {
    if (req.body.sanitizedInput[key] === undefined) {
      delete req.body.sanitizedInput[key];
    }
  });

  next();
}

async function findAll(req: Request, res: Response) {
  res.json({ data: await repository.findAll() });
}

async function findOne(req: Request<{ id: string }>, res: Response) {
  const event = await repository.findOne({ id: req.params.id });
  if (!event) {
    return res.status(404).send({ message: 'Event not found' });
  }
  res.json({ data: event });
}

async function add(req: Request, res: Response) {
  const input = req.body.sanitizedInput;

  const eventInput = new Event(
    input.date,
    input.startTime,
    input.endTime,
    input.id,
    input.coverImage,
    input.description,
    input.status,
  );

  const event = await repository.add(eventInput);
  res.status(201).send({ message: 'Event created', data: event });
}

async function update(req: Request, res: Response) {
  req.body.sanitizedInput.id = req.params.id;
  const event = await repository.update(req.body.sanitizedInput);
  if (!event) {
    return res.status(404).send({ message: 'Event not found' });
  }
  return res
    .status(200)
    .send({ message: 'Event updated successfully', data: event });
}

async function remove(req: Request<{ id: string }>, res: Response) {
  const id = req.params.id;
  const event = await repository.delete({ id });

  if (!event) {
    res.status(404).send({ message: 'Event not found' });
  } else {
    res.status(200).send({ message: 'Event deleted successfully' });
  }
}

export { sanitizeEventInput, findAll, findOne, add, update, remove };
