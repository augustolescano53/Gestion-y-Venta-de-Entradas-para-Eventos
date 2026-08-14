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
    id: req.body.id,
    password: req.body.password,
  }

  Object.keys(req.body.sanitizedInput).forEach((key) =>{
    if(req.body.sanitizedInput[key]===undefined){
      delete req.body.sanitizedInput[key]}
  })

  next()
}

async function findAll(req: Request,res: Response) {
  res.json({ data: await repository.findAll() })
}

async function findOne(req: Request<{id: string}>, res: Response) {
  const organizer = await repository.findOne({ id : req.params.id })
  if(!organizer){
    return res.status(404).send({message: 'Organizer not found'})
  }
  res.json({data: organizer})
}

async function add(req: Request, res: Response) {
   const input = req.body.sanitizedInput

   const organizerInput = new Organizer(
    input.firstName,
    input.lastName,
    input.email,
    input.id,
    input.identityDocument,
    input.password
   )

   const organizer = await repository.add(organizerInput)
   res.status(201).send({message: 'Organizer created', data: organizer})
}

async function update(req: Request,res: Response){
  req.body.sanitizedInput.id = req.params.id
  const organizer = await repository.update(req.body.sanitizedInput)
  if(!organizer){
    return res.status(404).send({message: 'Organizer not found'})
  }
  return res.status(200).send({message: 'Organizer updated successfully', data: organizer})
}

async function remove(req: Request<{id: string}>,res: Response){
  const id = req.params.id
  const organizer = await repository.delete({ id })

  if(!organizer){
    res.status(404).send({message: 'Organizer not found'})
  } else {
    res.status(200).send({message:'Organizer deleted successfully'})
  }
}

export {sanitizeOrganizerInput, findAll, findOne, add, update, remove}