import { Request, Response, NextFunction } from "express"
import { ParticipantRepository } from "./participant.repository.js"
import { Participant } from "./participant.entity.js"

const repository = new ParticipantRepository()

function sanitizeParticipantInput(req: Request, res: Response, next: NextFunction){
  req.body.sanitizedInput = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    identityDocument: req.body.identityDocument,
    password: req.body.password,
    id: req.body.id,
  }

  Object.keys(req.body.sanitizedInput).forEach((key) =>{
    if(req.body.sanitizedInput[key]===undefined){
      delete req.body.sanitizedInput[key]}
  })

  next()
}

async function findAll(req: Request,res: Response) {
  try {
    res.json({ data: await repository.findAll() })
  } catch (error: any) {
    res.status(500).send({ message: error.message })
  }
}

async function findOne(req: Request, res: Response) {
  try{
    const id = req.params.id as string
    const participant = await repository.findOne({ id })
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
    const input = req.body.sanitizedInput

    const participantInput = new Participant(
      input.firstName,
      input.lastName,
      input.email,
      input.identityDocument,
      input.password,
      input.id
    )

    const participant = await repository.add(participantInput)
    res.status(201).send({message: 'Participant created', data: participant})

  } catch (error: any) {
    res.status(500).send({ message: error.message })
  }
}

async function update(req: Request,res: Response){
  try{
    const id = req.params.id as string
    const participant = await repository.update(id, req.body.sanitizedInput)
    if(!participant){
      return res.status(404).send({message: 'Participant not found'})
    }
    return res.status(200).send({message: 'Participant updated successfully', data: participant})
  } catch (error: any) {
    res.status(500).send({ message: error.message })
  }
}

async function remove(req: Request,res: Response){
  try {
    const id = req.params.id as string
    const participant = await repository.delete({ id })

  if(!participant){
    res.status(404).send({message: 'Participant not found'})
  } else {
    res.status(200).send({message:'Participant deleted successfully'})
  }
  } catch (error: any) {
    res.status(500).send({ message: error.message })
  }
}

export {sanitizeParticipantInput, findAll, findOne, add, update, remove}