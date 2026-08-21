import { Request, Response, NextFunction } from 'express';
import { PaymentMethod } from './paymentmethod.entity.js';
import { orm } from '../shared/db/orm.js';

const em = orm.em;

function sanitizePaymentMethodInput(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  req.body.sanitizedInput = {
    type: req.body.type,
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
    const paymentmethods = await em.find(PaymentMethod, {});
    res.json({ data: paymentmethods });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id as string);
    const paymentmethod = await em.findOneOrFail(PaymentMethod, { id });
    res
      .status(200)
      .json({ message: 'found character class', data: paymentmethod });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

async function add(req: Request, res: Response) {
  try {
    const paymentmethod = em.create(PaymentMethod, req.body.sanitizedInput);
    await em.flush();
    res
      .status(201)
      .send({ message: 'Payment method created', data: paymentmethod });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

async function update(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id as string);
    const paymentmethodToUpdate = await em.findOneOrFail(PaymentMethod, { id });
    em.assign(paymentmethodToUpdate, req.body.sanitizedInput);
    await em.flush();
    res
      .status(200)
      .send({
        message: 'Payment method updated successfully',
        data: paymentmethodToUpdate,
      });
  } catch (error: any) {
    res.status(404).send({ message: error.message });
  }
}

async function remove(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id as string);
    const paymentmethod = await em.findOneOrFail(PaymentMethod, { id });
    await em.removeAndFlush(paymentmethod);
    res.status(200).send({ message: 'Payment method deleted successfully' });
  } catch (error: any) {
    res.status(404).send({ message: error.message });
  }
}

export { sanitizePaymentMethodInput, findAll, findOne, add, update, remove };
