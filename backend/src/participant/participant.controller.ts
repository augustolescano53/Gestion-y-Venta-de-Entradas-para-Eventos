import { Request, Response } from "express"
import { Participant } from "./participant.entity.js"
import { orm } from "../shared/db/orm.js"
import { sanitizeUserInput as sanitizeParticipantInput } from "../user/user.controller.js"
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

async function add(req: Request, res: Response) {
  try{
    const participant = em.create(Participant, req.body.sanitizedInput)
    await em.flush()
    res.status(201).send({message: 'Participant created', data: participant})
  } catch (error: any) {
    res.status(500).send({ message: error.message })
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

// Cambio de contraseña desde "Mi cuenta": exige la contraseña actual. La
// contraseña se guarda tal cual (sin hash), igual que en el alta y la edición.
async function changePassword(req: Request, res: Response) {
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
    const participant = await em.findOne(Participant, { id })
    if (!participant) throw new HttpError(404, 'El participante no existe.')
    if (participant.password !== currentPassword && participant.password !== currentPassword.trim()) {
      throw new HttpError(400, 'La contraseña actual es incorrecta.', {
        currentPassword: 'La contraseña actual es incorrecta.',
      })
    }

    participant.password = newPassword
    await em.flush()
    res.status(200).send({ message: 'Contraseña actualizada correctamente.' })
  } catch (error) {
    sendError(res, error, 'El participante no existe.')
  }
}

export {sanitizeParticipantInput, findAll, findOne, add, update, remove, changePassword}
