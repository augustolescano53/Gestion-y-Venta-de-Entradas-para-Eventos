import { Request, Response } from "express"
import { Organizer } from "./organizer.entity.js"
import { orm } from "../shared/db/orm.js"
import { sanitizeUserInput as sanitizeOrganizerInput } from "../user/user.controller.js"

const em = orm.em

async function findAll(req: Request,res: Response) {
  try {
    const organizers = await em.find(Organizer, {})
    res.json({ data: organizers })
  } catch (error: any) {
    res.status(500).send({ message: error.message })
  }
}

async function findOne(req: Request, res: Response) {
  try{
    const id = Number.parseInt(req.params.id as string)
    const organizer = await em.findOne(Organizer, { id })
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
    const organizer = em.create(Organizer, req.body.sanitizedInput)
    await em.flush()
    res.status(201).send({message: 'Organizer created', data: organizer})
  } catch (error: any) {
    res.status(500).send({ message: error.message })
  }
}

async function update(req: Request,res: Response){
  try{
    const id = Number.parseInt(req.params.id as string)
    const organizerToUpdate = await em.findOne(Organizer, { id })
    if(!organizerToUpdate){
      return res.status(404).send({message: 'Organizer not found'})
    }
    em.assign(organizerToUpdate, req.body.sanitizedInput)
    await em.flush()
    return res.status(200).send({message: 'Organizer updated successfully', data: organizerToUpdate})
  } catch (error: any) {
    res.status(500).send({ message: error.message })
  }
}

async function remove(req: Request,res: Response){
  try {
    const id = Number.parseInt(req.params.id as string)
    const organizer = await em.findOne(Organizer, { id })

    if(!organizer){
      res.status(404).send({message: 'Organizer not found'})
    } else {
      await em.removeAndFlush(organizer)
      res.status(200).send({message:'Organizer deleted successfully'})
    }
  } catch (error: any) {
    res.status(500).send({ message: error.message })
  }
}

export {sanitizeOrganizerInput, findAll, findOne, add, update, remove}
