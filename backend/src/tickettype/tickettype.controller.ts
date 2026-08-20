import { Request, Response, NextFunction } from "express"
import { TicketTypeRepository } from "./tickettype.repository.js"
import { TicketType } from "./tickettype.entity.js"

const repository = new TicketTypeRepository()

function sanitizeTicketTypeInput(req: Request, res: Response, next: NextFunction){
  req.body.sanitizedInput = {
    quantity: req.body.quantity,
    location: req.body.location,
    isNumbered: req.body.isNumbered,
    idVenue: req.params.idVenue,
  }

  Object.keys(req.body.sanitizedInput).forEach((key) =>{
    if(req.body.sanitizedInput[key]===undefined){
      delete req.body.sanitizedInput[key]}
  })

  next()
}

async function findAll(req: Request,res: Response) {
  try {
    const idVenue = req.params.idVenue
    res.json({ data: await repository.findAll(idVenue) })
  } catch (error: any) {
    res.status(500).send({ message: error.message })
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const id = req.params.idTicketType
    const idVenue = req.params.idVenue
    const ticketType = await repository.findOne({ id, idVenue })
    if(!ticketType){
      return res.status(404).send({message: 'TicketType not found'})
    }
    res.json({data: ticketType})
  } catch (error: any) {
    res.status(500).send({ message: error.message })
  }
}

async function add(req: Request, res: Response) {
  try {
    const input = req.body.sanitizedInput

    const ticketTypeInput = new TicketType(
      input.quantity,
      input.location,
      input.isNumbered,
      input.idVenue,
    )

    const ticketType = await repository.add(ticketTypeInput)
    res.status(201).send({message: 'TicketType created', data: ticketType})
  } catch (error: any) {
    res.status(500).send({ message: error.message })
  }
}

async function update(req: Request,res: Response){
  try {
    const id = req.params.idTicketType
    const ticketType = await repository.update(id, req.body.sanitizedInput)
    if(!ticketType){
      return res.status(404).send({message: 'TicketType not found'})
    }
    return res.status(200).send({message: 'TicketType updated successfully', data: ticketType})
  } catch (error: any) {
    res.status(500).send({ message: error.message })
  }
}

async function remove(req: Request,res: Response){
  try {
    const id = req.params.idTicketType
    const idVenue = req.params.idVenue
    const ticketType = await repository.delete({ id, idVenue })

    if(!ticketType){
      res.status(404).send({message: 'TicketType not found'})
    } else {
      res.status(200).send({message:'TicketType deleted successfully'})
    }
  } catch (error: any) {
    res.status(500).send({ message: error.message })
  }
}

export {sanitizeTicketTypeInput, findAll, findOne, add, update, remove}
