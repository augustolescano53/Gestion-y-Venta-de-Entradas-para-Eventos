import { Request, Response, NextFunction } from 'express';
import { EventRepository } from './event.repository.js';
import { Event } from './event.entity.js';

const repository = new EventRepository();

function sanitizeEventInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    description: req.body.description,
    status: req.body.status,
    coverImage: req.body.coverImage,
    date: req.body.date,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    idVenue: req.params.idVenue,
  };

  Object.keys(req.body.sanitizedInput).forEach((key) => {
    if (req.body.sanitizedInput[key] === undefined) {
      delete req.body.sanitizedInput[key];
    }
  });

  next();
}

async function findAll(req: Request, res: Response) {
  try {
    const idVenue = req.params.idVenue as string;
    res.json({ data: await repository.findAll(idVenue) });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const id = req.params.idEvent as string;
    const idVenue = req.params.idVenue as string;
    const event = await repository.findOne({ id, idVenue });
    if (!event) {
      return res.status(404).send({ message: 'Event not found' });
    }
    res.json({ data: event });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

async function add(req: Request, res: Response) {
  try {
    const input = req.body.sanitizedInput;

    const eventInput = new Event(
      input.description,
      input.status,
      input.coverImage,
      input.date,
      input.startTime,
      input.endTime,
      input.idVenue,
    );

    const event = await repository.add(eventInput);
    res.status(201).send({ message: 'Event created', data: event });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

async function update(req: Request, res: Response) {
  try {
    const id = req.params.idEvent as string;
    const event = await repository.update(id, req.body.sanitizedInput);
    if (!event) {
      return res.status(404).send({ message: 'Event not found' });
    }
    return res
      .status(200)
      .send({ message: 'Event updated successfully', data: event });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

async function remove(req: Request, res: Response) {
  try {
    const id = req.params.idEvent as string;
    const idVenue = req.params.idVenue as string;
    const event = await repository.delete({ id, idVenue });

    if (!event) {
      res.status(404).send({ message: 'Event not found' });
    } else {
      res.status(200).send({ message: 'Event deleted successfully' });
    }
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

export { sanitizeEventInput, findAll, findOne, add, update, remove };
