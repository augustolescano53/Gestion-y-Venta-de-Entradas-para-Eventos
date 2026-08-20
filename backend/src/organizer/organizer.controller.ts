import { Request, Response, NextFunction } from "express"
import { OrganizerRepository } from "./organizer.repository.js"
import { Organizer } from "./organizer.entity.js"

const repository = new OrganizerRepository()

function sanitizeOrganizerInput(req: Request, res: Response, next: NextFunction){
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
    const organizer = await repository.findOne({ id })
    if(!organizer){
      return res.status(404).send({message: 'Organizer not found'})
    }
    res.json({data: organizer})
  } catch (error: any) {
    res.status(500).send({ message: error.message })
  }
}

async function add(req: Request, res: Response) {
  try{
    const input = req.body.sanitizedInput

    const organizerInput = new Organizer(
      input.firstName,
      input.lastName,
      input.email,
      input.identityDocument,
      input.password,
      input.id
    )

    const organizer = await repository.add(organizerInput)
    res.status(201).send({message: 'Organizer created', data: organizer})

  } catch (error: any) {
    res.status(500).send({ message: error.message })
  }
}

async function update(req: Request,res: Response){
  try{
    const id = req.params.id as string
    const organizer = await repository.update(id, req.body.sanitizedInput)
    if(!organizer){
      return res.status(404).send({message: 'Organizer not found'})
    }
    return res.status(200).send({message: 'Organizer updated successfully', data: organizer})
  } catch (error: any) {
    res.status(500).send({ message: error.message })
  }
}

async function remove(req: Request,res: Response){
  try {
    const id = req.params.id as string
    const organizer = await repository.delete({ id })

  if(!organizer){
    res.status(404).send({message: 'Organizer not found'})
  } else {
    res.status(200).send({message:'Organizer deleted successfully'})
  }
  } catch (error: any) {
    res.status(500).send({ message: error.message })
  }
}

export {sanitizeOrganizerInput, findAll, findOne, add, update, remove}