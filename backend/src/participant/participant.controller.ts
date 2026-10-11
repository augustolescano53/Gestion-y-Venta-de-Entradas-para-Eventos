import { Request, Response } from "express"
import { UniqueConstraintViolationException } from "@mikro-orm/core"
import { Participant } from "./participant.entity.js"
import { orm } from "../shared/db/orm.js"
import { changePasswordFor, sanitizeUserInput as sanitizeParticipantInput } from "../user/user.controller.js"
import { FieldErrors, HttpError, sendError, sendFieldErrors } from "../shared/httpError.js"

const em = orm.em

async function findAll(req: Request,res: Response) {
  try {
    const participants = await em.find(Participant, {})
    res.json({ data: participants })
  } catch (error: any) {
    res.status(500).send({ message: error.message })
  }
}

async function findOne(req: Request, res: Response) {
  try{
    const id = Number.parseInt(req.params.id as string)
    const participant = await em.findOneOrFail(Participant, { id })
    res.json({data: participant})
  } catch (error: any) {
    res.status(500).send({ message: error.message })
  }
}

// El email es único: la base rechaza el duplicado y se responde un mensaje
// por campo en lugar del error de SQL. El DNI puede repetirse.
async function add(req: Request, res: Response) {
  try{
    const participant = em.create(Participant, req.body.sanitizedInput)
    await em.flush()
    res.status(201).send({message: 'Participant created', data: participant})
  } catch (error) {
    if (error instanceof UniqueConstraintViolationException) {
      const message = 'Ya existe una cuenta registrada con ese email.'
      return res.status(409).send({ message, errors: { email: message } })
    }
    sendError(res, error)
  }
}

// Inicio de sesión del comprador. La contraseña se compara tal cual está
// guardada (igual que changePassword) y nunca se devuelve.
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
    const participant = await em.findOne(Participant, { email })
    if (!participant || (participant.password !== password && participant.password !== password.trim())) {
      throw new HttpError(401, 'Email o contraseña incorrectos.')
    }
    const { id, firstName, lastName } = participant
    res.status(200).send({ message: 'Sesión iniciada.', data: { id, firstName, lastName, email: participant.email } })
  } catch (error) {
    sendError(res, error)
  }
}

async function update(req: Request,res: Response){
  try{
    const id = Number.parseInt(req.params.id as string)
    const participantToUpdate = await em.findOneOrFail(Participant, { id })
    em.assign(participantToUpdate, req.body.sanitizedInput)
    await em.flush()
    return res.status(200).send({message: 'Participant updated successfully', data: participantToUpdate})
  } catch (error: any) {
    res.status(500).send({ message: error.message })
  }
}

async function remove(req: Request,res: Response){
  try {
    const id = Number.parseInt(req.params.id as string)
    const participant = await em.findOneOrFail(Participant, { id })
    await em.removeAndFlush(participant)
    res.status(200).send({message:'Participant deleted successfully'})
  } catch (error: any) {
    res.status(500).send({ message: error.message })
  }
}

// Mismo cambio de contraseña que los organizadores (user.controller.ts).
const changePassword = changePasswordFor(Participant, 'El participante no existe.')

export {sanitizeParticipantInput, findAll, findOne, add, login, update, remove, changePassword}
