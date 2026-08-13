import { Request, Response, NextFunction } from "express"
import { OrganizadorRepository } from "./organizador.repository.js"
import { Organizador } from "./organizador.entity.js"

const repository = new OrganizadorRepository()

function sanitizeOrganizadorInput(req: Request, res: Response, next: NextFunction){
  req.body.sanitizedInput = {
    nombre: req.body.nombre,
    apellido: req.body.apellido,
    mail: req.body.mail,
    dni: req.body.dni,
    id: req.body.id,
    contrasena: req.body.contrasena,
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
  const organizador = await repository.findOne({ id : req.params.id })
  if(!organizador){
    return res.status(404).send({message: 'Organizador not found'})
  }
  res.json({data: organizador})
}

async function add(req: Request, res: Response) {
   const input = req.body.sanitizedInput

   const organizadorInput = new Organizador(
    input.nombre, 
    input.apellido,
    input.mail,
    input.id,
    input.dni,
    input.contrasena
   )
   
   const organizador = await repository.add(organizadorInput)
   res.status(201).send({message: 'Organizador created', data: organizador})
}

async function update(req: Request,res: Response){
  req.body.sanitizedInput.id = req.params.id
  const organizador = await repository.update(req.body.sanitizedInput)
  if(!organizador){
    return res.status(404).send({message: 'Organizador not found'})
  }
  return res.status(200).send({message: 'Organizador updated successfully', data: organizador})
}

async function remove(req: Request<{id: string}>,res: Response){
  const id = req.params.id
  const organizador = await repository.delete({ id })

  if(!organizador){
    res.status(404).send({message: 'Organizador not found'})
  } else {
    res.status(200).send({message:'Organizador deleted successfully'})
  }
}

export {sanitizeOrganizadorInput, findAll, findOne, add, update, remove}