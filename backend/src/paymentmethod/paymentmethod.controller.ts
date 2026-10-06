import { Request, Response, NextFunction } from 'express';
import { ForeignKeyConstraintViolationException } from '@mikro-orm/core';
import { PaymentMethod } from './paymentmethod.entity.js';
import { Ticket } from '../ticket/ticket.entity.js';
import { sendError } from '../shared/httpError.js';
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
    res.json({ message: 'found payment method', data: paymentmethod });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

async function add(req: Request, res: Response) {
  try {
    const paymentmethod = em.create(PaymentMethod, req.body.sanitizedInput);
    await em.flush();
    res.status(201).send({ message: 'Payment method created', data: paymentmethod });
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
    res.status(200).send({
        message: 'Payment method updated successfully',
        data: paymentmethodToUpdate,
      });
  } catch (error: any) {
    res.status(404).send({ message: error.message });
  }
}

const PAYMENT_METHOD_IN_USE =
  'No se puede eliminar este método de pago porque tiene compras o pagos asociados.';

// Las compras se registran en las entradas: es la única relación del medio
// de pago. La FK (RESTRICT) también impide el borrado desde la base.
async function remove(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id as string);
    const paymentmethod = await em.findOneOrFail(PaymentMethod, { id });

    const ticketCount = await em.count(Ticket, { paymentMethod: id });
    if (ticketCount > 0) {
      return res.status(409).send({ message: PAYMENT_METHOD_IN_USE });
    }

    await em.removeAndFlush(paymentmethod);
    res.status(200).send({ message: 'Payment method deleted successfully' });
  } catch (error) {
    if (error instanceof ForeignKeyConstraintViolationException) {
      return res.status(409).send({ message: PAYMENT_METHOD_IN_USE });
    }
    sendError(res, error, 'El método de pago no existe.');
  }
}

export { sanitizePaymentMethodInput, findAll, findOne, add, update, remove };
