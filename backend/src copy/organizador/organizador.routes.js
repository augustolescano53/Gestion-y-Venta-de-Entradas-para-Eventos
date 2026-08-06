import { Router } from "express";
import { sanitizeOrganizadorInput, findAll, findOne, add, update, remove } from "./organizador.controller.js";
export const organizadorRouter = Router();
organizadorRouter.get('/', findAll);
organizadorRouter.get('/:id', findOne);
organizadorRouter.post('/', sanitizeOrganizadorInput, add);
organizadorRouter.put('/:id', sanitizeOrganizadorInput, update);
organizadorRouter.patch('/:id', sanitizeOrganizadorInput, update);
organizadorRouter.delete('/:id', remove);
//# sourceMappingURL=organizador.routes.js.map