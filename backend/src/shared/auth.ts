import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { toPositiveInt } from './httpError.js'

export type Role = 'participant' | 'organizer' | 'admin'
export type AuthUser = { id: number; role: Role }

const ROLES: Role[] = ['participant', 'organizer', 'admin']

// En producción JWT_SECRET tiene que venir del entorno.
const JWT_SECRET = process.env.JWT_SECRET ?? 'pogo-dev-secret'
const TOKEN_TTL = '8h'

export function signToken(user: AuthUser) {
  return jwt.sign({ sub: String(user.id), role: user.role }, JWT_SECRET, { expiresIn: TOKEN_TTL })
}

function verifyToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    if (typeof payload !== 'object') return null
    const id = toPositiveInt(payload.sub)
    const role = payload.role as Role
    return id !== null && ROLES.includes(role) ? { id, role } : null
  } catch {
    return null
  }
}

export function currentUser(res: Response): AuthUser | null {
  return res.locals.user ?? null
}

export function isAdmin(res: Response) {
  return currentUser(res)?.role === 'admin'
}

// Global: si llega "Authorization: Bearer <token>" lo valida y deja el
// usuario en res.locals.user. Sin header sigue como visitante; con un token
// inválido o vencido responde 401 (el frontend cierra la sesión).
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header) return next()
  const [scheme, token] = header.split(' ')
  const user = scheme === 'Bearer' && token ? verifyToken(token) : null
  if (!user) return res.status(401).send({ message: 'Tu sesión no es válida. Iniciá sesión nuevamente.' })
  res.locals.user = user
  next()
}

function unauthenticated(res: Response) {
  return res.status(401).send({ message: 'Iniciá sesión para continuar.' })
}

function forbidden(res: Response) {
  return res.status(403).send({ message: 'No tenés permiso para realizar esta acción.' })
}

// Solo usuarios con alguno de esos roles.
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = currentUser(res)
    if (!user) return unauthenticated(res)
    if (!roles.includes(user.role)) return forbidden(res)
    next()
  }
}

export const requireAdmin = requireRole('admin')

// El usuario dueño del recurso (id del parámetro de la ruta, con su rol) o
// un administrador.
export function requireSelfOrAdmin(role: Role, param = 'id') {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = currentUser(res)
    if (!user) return unauthenticated(res)
    if (user.role === 'admin') return next()
    const id = toPositiveInt(req.params[param])
    if (user.role !== role || id !== user.id) return forbidden(res)
    next()
  }
}
