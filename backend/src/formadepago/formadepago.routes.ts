import { Request, Response, NextFunction } from "express"
import { FormaDePagoRepository } from "./formadepago.repository.js"
import { FormaDePago } from "./formadepago.entity.js"

const repository = new FormaDePagoRepository()

function sanitizeFormaDePagoInput(req: Request, res: Response, next: NextFunction){
  req.body.sanitizedInput = {
    FormaDePagoClass: req.body.FormaDePagoClass,
    id: req.body.id,
    tipo: req.body.tipo,
  }

  Object.keys(req.body.sanitizedInput).forEach((key) =>{
    if(req.body.sanitizedInput[key]===undefined){
      delete req.body.sanitizedInput[key]}
  })

  next()
}

function findAll(req: Request,res: Response) {
  res.json({ data: repository.findAll() })
}

function findOne(req: Request<{id: string}>, res: Response) {
  const formadepago = repository.findOne({ id : req.params.id })
  if(!formadepago){
    return res.status(404).send({message: 'Forma de Pago not found'})
  }
  res.json({data: formadepago})
}

function add(req: Request, res: Response) {
   const input = req.body.sanitizedInput

   const formadepagoInput = new FormaDePago(
    input.id,
    input.tipo
   )
   
   const formadepago = repository.add(formadepagoInput)
   res.status(201).send({message: 'Forma de Pago created', data: formadepago})
}

function update(req: Request,res: Response){
  req.body.sanitizedInput.id = req.params.id
  const formadepago = repository.update(req.body.sanitizedInput)
  if(!formadepago){
    return res.status(404).send({message: 'Forma de Pago not found'})
  }
  return res.status(200).send({message: 'Forma de Pago updated successfully', data: formadepago})
}

function remove(req: Request<{id: string}>,res: Response){
  const id = req.params.id
  const formadepago = repository.delete({ id })

  if(!formadepago){
    res.status(404).send({message: 'Forma de Pago not found'})
  } else {
    res.status(200).send({message:'Forma de Pago deleted successfully'})
  }
}

export {sanitizeFormaDePagoInput, findAll, findOne, add, update, remove}