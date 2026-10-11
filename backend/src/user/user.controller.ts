import { Request, Response, NextFunction } from "express"
import { EntityName } from "@mikro-orm/core"
import { isValidDateString, localTodayString } from "../event/event.status.js"
import { orm } from "../shared/db/orm.js"
import { FieldErrors, HttpError, sendError, sendFieldErrors } from "../shared/httpError.js"
import { User } from "./user.entity.js"
import { Participant } from "../participant/participant.entity.js"
import { Organizer } from "../organizer/organizer.entity.js"

const em = orm.em

function sanitizeUserInput(req: Request, res: Response, next: NextFunction){
  req.body.sanitizedInput = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    identityDocument: req.body.identityDocument,
    password: req.body.password,
    birthDate: req.body.birthDate,
  }

  Object.keys(req.body.sanitizedInput).forEach((key) =>{
    if(req.body.sanitizedInput[key]===undefined){
      delete req.body.sanitizedInput[key]}
  })

  next()
}

// La fecha de nacimiento es opcional y no se exige una edad mínima.
function validateUserInput(req: Request, res: Response, next: NextFunction){
  const { birthDate } = req.body.sanitizedInput

  if (birthDate !== undefined && birthDate !== null) {
    if (!isValidDateString(birthDate)) {
      return res.status(400).send({ message: 'La fecha de nacimiento no es válida.' })
    }
    if (birthDate > localTodayString()) {
      return res.status(400).send({ message: 'La fecha de nacimiento no puede ser futura.' })
    }
  }

  next()
}

// La contraseña se compara tal cual está guardada (no hay hash); se acepta
// también sin espacios en los extremos, como se guarda desde los formularios.
function passwordMatches(user: User, password: string) {
  return user.password === password || user.password === password.trim()
}

function roleOf(user: User) {
  if (user instanceof Organizer) return 'organizer'
  if (user instanceof Participant) return 'participant'
  return null
}

// Inicio de sesión de cualquier usuario (participante u organizador): el
// email es único en toda la tabla user. PROVISORIO: no emite ningún token, el
// frontend guarda el id y el rol devueltos.
async function login(req: Request, res: Response) {
  const email = typeof req.body.email === 'string' ? req.body.email.trim() : ''
  const password = typeof req.body.password === 'string' ? req.body.password : ''

  const errors: FieldErrors = {}
  if (!email) errors.email = 'Ingresá tu email.'
  if (!password) errors.password = 'Ingresá tu contraseña.'
  if (Object.keys(errors).length > 0) {
    return sendFieldErrors(res, errors)
  }

  try {
    const user = await em.findOne(User, { email })
    const role = user ? roleOf(user) : null
    if (!user || !role || !passwordMatches(user, password)) {
      throw new HttpError(401, 'Email o contraseña incorrectos.')
    }
    const { id, firstName, lastName } = user
    res.status(200).send({ message: 'Sesión iniciada.', data: { id, firstName, lastName, email: user.email, role } })
  } catch (error) {
    sendError(res, error)
  }
}

// Cambio de contraseña desde "Mi cuenta" (participantes y organizadores):
// exige la contraseña actual.
function changePasswordFor(entity: EntityName<User>, notFoundMessage: string) {
  return async function changePassword(req: Request, res: Response) {
    const currentPassword = typeof req.body.currentPassword === 'string' ? req.body.currentPassword : ''
    const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword.trim() : ''

    const errors: FieldErrors = {}
    if (!currentPassword) errors.currentPassword = 'Ingresá tu contraseña actual.'
    if (!newPassword) errors.newPassword = 'Ingresá una nueva contraseña.'
    else if (newPassword === currentPassword.trim()) {
      errors.newPassword = 'La nueva contraseña debe ser distinta de la actual.'
    }
    if (Object.keys(errors).length > 0) {
      return sendFieldErrors(res, errors)
    }

    try {
      const id = Number.parseInt(req.params.id as string)
      const user = await em.findOne(entity, { id })
      if (!user) throw new HttpError(404, notFoundMessage)
      if (!passwordMatches(user, currentPassword)) {
        throw new HttpError(400, 'La contraseña actual es incorrecta.', {
          currentPassword: 'La contraseña actual es incorrecta.',
        })
      }

      user.password = newPassword
      await em.flush()
      res.status(200).send({ message: 'Contraseña actualizada correctamente.' })
    } catch (error) {
      sendError(res, error, notFoundMessage)
    }
  }
}

export { sanitizeUserInput, validateUserInput, login, changePasswordFor }
