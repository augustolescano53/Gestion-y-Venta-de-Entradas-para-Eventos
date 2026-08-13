import { Request, Response, NextFunction } from 'express';
import { LugarEventoRepository } from './lugarevento.repository.js';
import { LugarEvento } from './lugarevento.entity.js';

const repository = new LugarEventoRepository();

function sanitizeLugarEventoInput(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  req.body.sanitizedInput = {
    id: req.body.id,
    nombre: req.body.nombre,
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
  const lugarEvento = await repository.findOne({ id: req.params.id });

  if (!lugarEvento) {
    return res.status(404).send({ message: 'LugarEvento not found' });
  }

  res.json({ data: lugarEvento });
}

async function add(req: Request, res: Response) {
  const input = req.body.sanitizedInput;

  const lugarEventoInput = new LugarEvento(input.id, input.nombre);

  const lugarEvento = await repository.add(lugarEventoInput);

  res.status(201).send({
    message: 'LugarEvento created',
    data: lugarEvento,
  });
}

async function update(req: Request, res: Response) {
  req.body.sanitizedInput.id = req.params.id;

  const lugarEvento = await repository.update(req.body.sanitizedInput);

  if (!lugarEvento) {
    return res.status(404).send({ message: 'LugarEvento not found' });
  }

  return res.status(200).send({
    message: 'LugarEvento updated successfully',
    data: lugarEvento,
  });
}

async function remove(req: Request<{ id: string }>, res: Response) {
  const id = req.params.id;

  const lugarEvento = await repository.delete({ id });

  if (!lugarEvento) {
    res.status(404).send({ message: 'LugarEvento not found' });
  } else {
    res.status(200).send({
      message: 'LugarEvento deleted successfully',
    });
  }
}

export { sanitizeLugarEventoInput, findAll, findOne, add, update, remove };
