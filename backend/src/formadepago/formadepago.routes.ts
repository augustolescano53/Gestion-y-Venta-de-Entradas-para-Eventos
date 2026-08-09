import { Router } from "express";
import { sanitizeFormaDePagoInput, findAll, findOne, add, update, remove } from "./formadepago.controller.js";

export const formadepagoRouter = Router()

formadepagoRouter.get('/', findAll)
formadepagoRouter.get('/:id', findOne)
formadepagoRouter.post('/', sanitizeFormaDePagoInput, add)
formadepagoRouter.put('/:id', sanitizeFormaDePagoInput, update)
formadepagoRouter.patch('/:id', sanitizeFormaDePagoInput, update)
formadepagoRouter.delete('/:id', remove)
