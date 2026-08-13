import { Request, Response, NextFunction } from 'express';
import { ParticipanteRepository } from './participante.repository.js';
import { Participante } from './participante.entity.js';

const repository = new ParticipanteRepository();

function sanitizeParticipanteInput(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  req.body.sanitizedInput = {
    nombre: req.body.nombre,
    apellido: req.body.apellido,
    mail: req.body.mail,
    dni: req.body.dni,
    id: req.body.id,
    contrasena: req.body.contrasena,
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
  const participante = await repository.findOne({ id: req.params.id });
  if (!participante) {
    return res.status(404).send({ message: 'Participante not found' });
  }
  res.json({ data: participante });
}

async function add(req: Request, res: Response) {
  const input = req.body.sanitizedInput;

  const participanteInput = new Participante(
    input.nombre,
    input.apellido,
    input.mail,
    input.id,
    input.dni,
    input.contrasena,
  );

  const participante = await repository.add(participanteInput);
  res.status(201).send({ message: 'Participante created', data: participante });
}

async function update(req: Request, res: Response) {
  req.body.sanitizedInput.id = req.params.id;
  const participante = await repository.update(req.body.sanitizedInput);
  if (!participante) {
    return res.status(404).send({ message: 'Participante not found' });
  }
  return res
    .status(200)
    .send({ message: 'Participante updated successfully', data: participante });
}

async function remove(req: Request<{ id: string }>, res: Response) {
  const id = req.params.id;
  const participante = await repository.delete({ id });

  if (!participante) {
    res.status(404).send({ message: 'Participante not found' });
  } else {
    res.status(200).send({ message: 'Participante deleted successfully' });
  }
}

export { sanitizeParticipanteInput, findAll, findOne, add, update, remove };
