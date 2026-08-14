import { Request, Response, NextFunction } from 'express';
import { VenueRepository } from './venue.repository.js';
import { Venue } from './venue.entity.js';

const repository = new VenueRepository();

function sanitizeVenueInput(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  req.body.sanitizedInput = {
    id: req.body.id,
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
  res.json({ data: await repository.findAll() });
}

async function findOne(req: Request<{ id: string }>, res: Response) {
  const venue = await repository.findOne({ id: req.params.id });

  if (!venue) {
    return res.status(404).send({ message: 'Venue not found' });
  }

  res.json({ data: venue });
}

async function add(req: Request, res: Response) {
  const input = req.body.sanitizedInput;

  const venueInput = new Venue(input.id, input.name);

  const venue = await repository.add(venueInput);

  res.status(201).send({
    message: 'Venue created',
    data: venue,
  });
}

async function update(req: Request, res: Response) {
  req.body.sanitizedInput.id = req.params.id;

  const venue = await repository.update(req.body.sanitizedInput);

  if (!venue) {
    return res.status(404).send({ message: 'Venue not found' });
  }

  return res.status(200).send({
    message: 'Venue updated successfully',
    data: venue,
  });
}

async function remove(req: Request<{ id: string }>, res: Response) {
  const id = req.params.id;

  const venue = await repository.delete({ id });

  if (!venue) {
    res.status(404).send({ message: 'Venue not found' });
  } else {
    res.status(200).send({
      message: 'Venue deleted successfully',
    });
  }
}

export { sanitizeVenueInput, findAll, findOne, add, update, remove };
