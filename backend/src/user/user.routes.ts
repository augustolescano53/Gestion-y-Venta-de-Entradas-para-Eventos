import { Router } from 'express';
import { login } from './user.controller.js';

export const userRouter = Router();

userRouter.post('/login', login);
