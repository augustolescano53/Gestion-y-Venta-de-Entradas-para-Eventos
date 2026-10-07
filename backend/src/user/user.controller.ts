import { Request, Response, NextFunction } from "express"
import { isValidDateString, localTodayString } from "../event/event.status.js"

function sanitizeUserInput(req: Request, res: Response, next: NextFunction){
  req.body.sanitizedInput = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    identityDocument: req.body.identityDocument,
    password: req.body.password,
    birthDate: req.body.birthDate,
  }

  Object.keys(req.body.sanitizedInput).forEach((key) =>{
    if(req.body.sanitizedInput[key]===undefined){
      delete req.body.sanitizedInput[key]}
  })

  next()
}

// La fecha de nacimiento es opcional y no se exige una edad mínima.
function validateUserInput(req: Request, res: Response, next: NextFunction){
  const { birthDate } = req.body.sanitizedInput

  if (birthDate !== undefined && birthDate !== null) {
    if (!isValidDateString(birthDate)) {
      return res.status(400).send({ message: 'La fecha de nacimiento no es válida.' })
    }
    if (birthDate > localTodayString()) {
      return res.status(400).send({ message: 'La fecha de nacimiento no puede ser futura.' })
    }
  }

  next()
}

export { sanitizeUserInput, validateUserInput }
