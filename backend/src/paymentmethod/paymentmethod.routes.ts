import { Router } from "express";
import { sanitizePaymentMethodInput, findAll, findOne, add, update, remove } from "./paymentmethod.controller.js";

export const paymentmethodRouter = Router()

paymentmethodRouter.get('/', findAll)
paymentmethodRouter.get('/:id', findOne)
paymentmethodRouter.post('/', sanitizePaymentMethodInput, add)
paymentmethodRouter.put('/:id', sanitizePaymentMethodInput, update)
paymentmethodRouter.patch('/:id', sanitizePaymentMethodInput, update)
paymentmethodRouter.delete('/:id', remove)
