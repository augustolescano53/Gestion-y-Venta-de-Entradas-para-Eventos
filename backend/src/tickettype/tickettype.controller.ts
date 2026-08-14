import { Request, Response, NextFunction } from "express"
import { TicketTypeRepository } from "./tickettype.repository.js"
import { TicketType } from "./tickettype.entity.js"

const repository = new TicketTypeRepository()

function sanitizeTicketTypeInput(req: Request, res: Response, next: NextFunction){
  req.body.sanitizedInput = {
    quantity: req.body.quantity,
    location: req.body.location,
    isNumbered: req.body.isNumbered,
    id: req.body.id,
  }

  Object.keys(req.body.sanitizedInput).forEach((key) =>{
    if(req.body.sanitizedInput[key]===undefined){
      delete req.body.sanitizedInput[key]}
  })

  next()
}

async function findAll(req: Request,res: Response) {
  res.json({ data: repository.findAll() })
}

async function findOne(req: Request<{id: string}>, res: Response) {
  const ticketType = await repository.findOne({ id : req.params.id })
  if(!ticketType){
    return res.status(404).send({message: 'TicketType not found'})
  }
  res.json({data: ticketType})
}

async function add(req: Request, res: Response) {
   const input = req.body.sanitizedInput

   const ticketTypeInput = new TicketType(
    input.quantity,
    input.location,
    input.isNumbered,
    input.id
   )

   const ticketType = await repository.add(ticketTypeInput)
   res.status(201).send({message: 'TicketType created', data: ticketType})
}

async function update(req: Request,res: Response){
  req.body.sanitizedInput.id = req.params.id
  const ticketType = await repository.update(req.body.sanitizedInput)
  if(!ticketType){
    return res.status(404).send({message: 'TicketType not found'})
  }
  return res.status(200).send({message: 'TicketType updated successfully', data: ticketType})
}

async function remove(req: Request<{id: string}>,res: Response){
  const id = req.params.id
  const ticketType = await repository.delete({ id })

  if(!ticketType){
    res.status(404).send({message: 'TicketType not found'})
  } else {
    res.status(200).send({message:'TicketType deleted successfully'})
  }
}

export {sanitizeTicketTypeInput, findAll, findOne, add, update, remove}