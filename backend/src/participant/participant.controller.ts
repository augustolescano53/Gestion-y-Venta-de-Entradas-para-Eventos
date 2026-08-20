import { Request, Response, NextFunction } from 'express';
import { ParticipantRepository } from './participant.repository.js';
import { Participant } from './participant.entity.js';

const repository = new ParticipantRepository();

function sanitizeParticipantInput(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  req.body.sanitizedInput = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    identityDocument: req.body.identityDocument,
    id: req.body.id,
    password: req.body.password,
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
  const participant = await repository.findOne({ id: req.params.id });
  if (!participant) {
    return res.status(404).send({ message: 'Participant not found' });
  }
  res.json({ data: participant });
}

async function add(req: Request, res: Response) {
  const input = req.body.sanitizedInput;

  const participantInput = new Participant(
    input.firstName,
    input.lastName,
    input.email,
    input.id,
    input.identityDocument,
    input.password,
  );

  const participant = await repository.add(participantInput);
  res.status(201).send({ message: 'Participant created', data: participant });
}

async function update(req: Request, res: Response) {
  req.body.sanitizedInput.id = req.params.id;
  const participant = await repository.update(req.body.sanitizedInput);
  if (!participant) {
    return res.status(404).send({ message: 'Participant not found' });
  }
  return res
    .status(200)
    .send({ message: 'Participant updated successfully', data: participant });
}

async function remove(req: Request<{ id: string }>, res: Response) {
  const id = req.params.id;
  const participant = await repository.delete({ id });

  if (!participant) {
    res.status(404).send({ message: 'Participant not found' });
  } else {
    res.status(200).send({ message: 'Participant deleted successfully' });
  }
}

export { sanitizeParticipantInput, findAll, findOne, add, update, remove };
