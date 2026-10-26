import { Request, Response } from "express"
import { UniqueConstraintViolationException } from "@mikro-orm/core"
import { Admin } from "./admin.entity.js"
import { orm } from "../shared/db/orm.js"
import { currentUser } from "../shared/auth.js"
import { HttpError, sendError } from "../shared/httpError.js"
import { changePasswordFor, sanitizeUserInput as sanitizeAdminInput } from "../user/user.controller.js"

const em = orm.em
const NOT_FOUND = 'El administrador no existe.'
const DUPLICATED_EMAIL = 'Ya existe una cuenta registrada con ese email.'

function sendAdminError(res: Response, error: unknown) {
  if (error instanceof UniqueConstraintViolationException) {
    return res.status(409).send({ message: DUPLICATED_EMAIL, errors: { email: DUPLICATED_EMAIL } })
  }
  sendError(res, error, NOT_FOUND)
}

async function findAll(req: Request, res: Response) {
  try {
    const admins = await em.find(Admin, {}, { orderBy: { id: 'asc' } })
    res.json({ data: admins })
  } catch (error) {
    sendError(res, error)
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id as string)
    const admin = await em.findOneOrFail(Admin, { id })
    res.json({ data: admin })
  } catch (error) {
    sendError(res, error, NOT_FOUND)
  }
}

async function add(req: Request, res: Response) {
  try {
    const admin = em.create(Admin, req.body.sanitizedInput)
    await em.flush()
    res.status(201).send({ message: 'Administrador creado.', data: admin })
  } catch (error) {
    sendAdminError(res, error)
  }
}

// Una contraseña vacía al editar no cambia la actual.
async function update(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id as string)
    const admin = await em.findOneOrFail(Admin, { id })
    const input = { ...req.body.sanitizedInput }
    if (!input.password) delete input.password
    em.assign(admin, input)
    await em.flush()
    res.status(200).send({ message: 'Administrador actualizado.', data: admin })
  } catch (error) {
    sendAdminError(res, error)
  }
}

// Siempre tiene que quedar al menos un administrador, y nadie se elimina a
// sí mismo (perdería el acceso en medio de la sesión).
async function remove(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id as string)
    if (currentUser(res)?.id === id) {
      throw new HttpError(409, 'No podés eliminar tu propia cuenta de administrador.')
    }
    const admin = await em.findOneOrFail(Admin, { id })
    if ((await em.count(Admin, {})) <= 1) {
      throw new HttpError(409, 'Tiene que quedar al menos un administrador.')
    }
    await em.removeAndFlush(admin)
    res.status(200).send({ message: 'Administrador eliminado.' })
  } catch (error) {
    sendError(res, error, NOT_FOUND)
  }
}

const changePassword = changePasswordFor(Admin, NOT_FOUND)

// Primer administrador: si la base no tiene ninguno, se crea uno con
// ADMIN_EMAIL / ADMIN_PASSWORD (por defecto admin@pogo.com / admin123).
async function ensureDefaultAdmin() {
  const fork = orm.em.fork()
  if ((await fork.count(Admin, {})) > 0) return
  const email = process.env.ADMIN_EMAIL ?? 'admin@pogo.com'
  fork.create(Admin, {
    firstName: 'Admin',
    lastName: 'POGO',
    email,
    identityDocument: '00000000',
    password: process.env.ADMIN_PASSWORD ?? 'admin123',
    birthDate: '2000-01-01',
  })
  await fork.flush()
  console.log(`Administrador inicial creado: ${email}`)
}

export { sanitizeAdminInput, findAll, findOne, add, update, remove, changePassword, ensureDefaultAdmin }
