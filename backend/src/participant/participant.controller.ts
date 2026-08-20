import { Request, Response } from "express"
import { Participant } from "./participant.entity.js"
import { orm } from "../shared/db/orm.js"
import { sanitizeUserInput as sanitizeParticipantInput } from "../user/user.controller.js"

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
    const participant = await em.findOne(Participant, { id })
    if(!participant){
      return res.status(404).send({message: 'Participant not found'})
    }
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
    const participantToUpdate = await em.findOne(Participant, { id })
    if(!participantToUpdate){
      return res.status(404).send({message: 'Participant not found'})
    }
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
    const participant = await em.findOne(Participant, { id })

    if(!participant){
      res.status(404).send({message: 'Participant not found'})
    } else {
      await em.removeAndFlush(participant)
      res.status(200).send({message:'Participant deleted successfully'})
    }
  } catch (error: any) {
    res.status(500).send({ message: error.message })
  }
}

export {sanitizeParticipantInput, findAll, findOne, add, update, remove}
