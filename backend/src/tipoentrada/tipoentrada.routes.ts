import { Router } from "express";
import { sanitizeTipoEntradaInput, findAll, findOne, add, update, remove } from "./tipoentrada.controller.js";

export const tipoentradaRouter = Router()

tipoentradaRouter.get('/', findAll)
tipoentradaRouter.get('/:id', findOne)
tipoentradaRouter.post('/', sanitizeTipoEntradaInput, add) 
tipoentradaRouter.put('/:id', sanitizeTipoEntradaInput, update)
tipoentradaRouter.patch('/:id', sanitizeTipoEntradaInput, update)
tipoentradaRouter.delete('/:id', remove)