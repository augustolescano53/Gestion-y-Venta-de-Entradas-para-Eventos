import { Request, Response, NextFunction } from 'express';
import { Event } from './event.entity.js';
import { orm } from '../shared/db/orm.js';

const em = orm.em;

function sanitizeEventInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    description: req.body.description,
    status: req.body.status,
    coverImage: req.body.coverImage,
    date: req.body.date,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    organizer: req.body.organizer,
    venue: Number.parseInt(req.params.idVenue as string),
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
    const venue = Number.parseInt(req.params.idVenue as string);
    const events = await em.find(Event, { venue });
    res.json({ data: events });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const idEvent = Number.parseInt(req.params.idEvent as string);
    const venue = Number.parseInt(req.params.idVenue as string);
    const event = await em.findOneOrFail(Event, { idEvent, venue }, {populate: ['venue', 'organizer']});
    res.json({ data: event });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

async function add(req: Request, res: Response) {
  try {
    const input = req.body.sanitizedInput;

    const [{ nextId }] = await em
      .getConnection()
      .execute(
        'select ifnull(max(id_event), 0) + 1 as nextId from event where venue_id = ?',
        [input.venue],
      );

    const event = em.create(Event, {
      idEvent: nextId,
      ...input,
    });
    await em.flush();
    res.status(201).send({ message: 'Event created', data: event });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

async function update(req: Request, res: Response) {
  try {
    const idEvent = Number.parseInt(req.params.idEvent as string);
    const venue = Number.parseInt(req.params.idVenue as string);
    const eventToUpdate = await em.findOneOrFail(Event, { idEvent, venue });
    em.assign(eventToUpdate, req.body.sanitizedInput);
    await em.flush();
    res.status(200).send({
      message: 'Event updated successfully',
      data: eventToUpdate,
    });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

async function remove(req: Request, res: Response) {
  try {
    const idEvent = Number.parseInt(req.params.idEvent as string);
    const venue = Number.parseInt(req.params.idVenue as string);
    const event = await em.findOneOrFail(Event, { idEvent, venue });
    await em.removeAndFlush(event);
    res.status(200).send({ message: 'Event deleted successfully' });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

export { sanitizeEventInput, findAll, findOne, add, update, remove };
