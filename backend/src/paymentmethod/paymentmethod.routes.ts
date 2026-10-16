import { Router } from "express";
import { requireAdmin } from "../shared/auth.js";
import { sanitizePaymentMethodInput, findAll, findOne, add, update, remove } from "./paymentmethod.controller.js";

export const paymentmethodRouter = Router()

// Lectura pública (checkout); el resto solo el administrador.
paymentmethodRouter.get('/', findAll)
paymentmethodRouter.get('/:id', findOne)
paymentmethodRouter.post('/', requireAdmin, sanitizePaymentMethodInput, add)
paymentmethodRouter.put('/:id', requireAdmin, sanitizePaymentMethodInput, update)
paymentmethodRouter.patch('/:id', requireAdmin, sanitizePaymentMethodInput, update)
paymentmethodRouter.delete('/:id', requireAdmin, remove)
