import { Router } from 'express';
import { validateUserInput } from '../user/user.controller.js';
import { requireAdmin, requireSelfOrAdmin } from '../shared/auth.js';
import { sanitizeAdminInput, findAll, findOne, add, update, remove, changePassword } from './admin.controller.js';

// Todo es exclusivo de administradores; la contraseña solo la cambia el
// propio administrador.
export const adminRouter = Router();

adminRouter.get('/', requireAdmin, findAll);
adminRouter.get('/:id', requireAdmin, findOne);
adminRouter.post('/', requireAdmin, sanitizeAdminInput, validateUserInput, add);
adminRouter.put('/:id', requireAdmin, sanitizeAdminInput, validateUserInput, update);
adminRouter.patch('/:id/password', requireSelfOrAdmin('admin'), changePassword);
adminRouter.patch('/:id', requireAdmin, sanitizeAdminInput, validateUserInput, update);
adminRouter.delete('/:id', requireAdmin, remove);
