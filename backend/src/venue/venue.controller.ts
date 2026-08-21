import { Request, Response, NextFunction } from 'express';
import { Venue } from './venue.entity.js';
import { orm } from '../shared/db/orm.js';

const em = orm.em;

function sanitizeVenueInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    name: req.body.name,
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
    const venues = await em.find(Venue, {});
    res.json({ data: venues });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id as string);
    const venue = await em.findOneOrFail(
      Venue,
      { id },
      { populate: ['ticketTypes'] },
    );
    res.json({ data: venue });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

async function add(req: Request, res: Response) {
  try {
    const venue = em.create(Venue, req.body.sanitizedInput);
    await em.flush();
    res.status(201).send({ message: 'Venue created', data: venue });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

async function update(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id as string);
    const venueToUpdate = await em.findOneOrFail(Venue, { id });
    em.assign(venueToUpdate, req.body.sanitizedInput);
    await em.flush();
    res.status(200).send({
      message: 'Venue updated successfully',
      data: venueToUpdate,
    });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

async function remove(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id as string);
    const venue = await em.findOneOrFail(Venue, { id });
    await em.removeAndFlush(venue);
    res.status(200).send({ message: 'Venue deleted successfully' });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

export { sanitizeVenueInput, findAll, findOne, add, update, remove };
