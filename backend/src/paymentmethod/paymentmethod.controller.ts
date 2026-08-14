import { Request, Response, NextFunction } from "express"
import { PaymentMethodRepository } from "./paymentmethod.repository.js"
import { PaymentMethod } from "./paymentmethod.entity.js"

const repository = new PaymentMethodRepository()

function sanitizePaymentMethodInput(req: Request, res: Response, next: NextFunction){
  req.body.sanitizedInput = {
    id: req.body.id,
    type: req.body.type,
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
  try {
    const id = req.params.id as string
    const paymentmethod = await repository.findOne({ id })
    if(!paymentmethod){
      return res.status(404).send({message: 'Payment method not found'})
    }
    res.json({data: paymentmethod })
  } catch (error: any) {
    res.status(500).send({ message: error.message })
  }
}

async function add(req: Request, res: Response) {
  try {
    const input = req.body.sanitizedInput

    const paymentmethodInput = new PaymentMethod(
     input.type,
     input.id
    )

    const paymentmethod = await repository.add(paymentmethodInput)
    res.status(201).send({message: 'Payment method created', data: paymentmethod})
  } catch (error: any) {
    res.status(500).send({ message: error.message })
  }
}

async function update(req: Request,res: Response){
  try {
    const id = req.params.id as string
    const paymentmethod = await repository.update(id, req.body.sanitizedInput)
    if(!paymentmethod){
      return res.status(404).send({message: 'Payment method not found'})
    }
    return res.status(200).send({message: 'Payment method updated successfully', data: paymentmethod})
  } catch (error: any) {
    res.status(500).send({ message: error.message })
  }
}

async function remove(req: Request,res: Response){
  try {
    const id = req.params.id as string
    const paymentmethod = await repository.delete({ id })

    if(!paymentmethod){
      res.status(404).send({message: 'Payment method not found'})
    } else {
      res.status(200).send({message:'Payment method deleted successfully'})
    }
  } catch (error: any) {
    res.status(500).send({ message: error.message })
  }
}

export {sanitizePaymentMethodInput, findAll, findOne, add, update, remove}