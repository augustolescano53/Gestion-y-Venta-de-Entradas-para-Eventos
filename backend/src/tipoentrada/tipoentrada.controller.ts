import { Request, Response, NextFunction } from "express"
import { TipoEntradaRepository } from "./tipoentrada.repository.js"
import { TipoEntrada } from "./tipoentrada.entity.js"

const repository = new TipoEntradaRepository()

function sanitizeTipoEntradaInput(req: Request, res: Response, next: NextFunction){
  req.body.sanitizedInput = {
    cantidad: req.body.cantidad,
    ubicacion: req.body.ubicacion,
    esNumerada: req.body.esNumerada,
    id: req.body.id,
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
  const tipoentrada = repository.findOne({ id : req.params.id })
  if(!tipoentrada){
    return res.status(404).send({message: 'TipoEntrada not found'})
  }
  res.json({data: tipoentrada})
}

function add(req: Request, res: Response) {
   const input = req.body.sanitizedInput

   const tipoentradaInput = new TipoEntrada(
    input.cantidad,
    input.ubicacion,
    input.esNumerada,
    input.id
   )
   
   const tipoentrada = repository.add(tipoentradaInput)
   res.status(201).send({message: 'TipoEntrada created', data: tipoentrada})
}

function update(req: Request,res: Response){
  req.body.sanitizedInput.id = req.params.id
  const tipoentrada = repository.update(req.body.sanitizedInput)
  if(!tipoentrada){
    return res.status(404).send({message: 'TipoEntrada not found'})
  }
  return res.status(200).send({message: 'TipoEntrada updated successfully', data: tipoentrada})
}

function remove(req: Request<{id: string}>,res: Response){
  const id = req.params.id
  const tipoentrada = repository.delete({ id })

  if(!tipoentrada){
    res.status(404).send({message: 'TipoEntrada not found'})
  } else {
    res.status(200).send({message:'TipoEntrada deleted successfully'})
  }
}

export {sanitizeTipoEntradaInput, findAll, findOne, add, update, remove}