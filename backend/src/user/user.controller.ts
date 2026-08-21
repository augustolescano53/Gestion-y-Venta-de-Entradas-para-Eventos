import { Request, Response, NextFunction } from "express"

function sanitizeUserInput(req: Request, res: Response, next: NextFunction){
  req.body.sanitizedInput = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    identityDocument: req.body.identityDocument,
    password: req.body.password,
  }

  Object.keys(req.body.sanitizedInput).forEach((key) =>{
    if(req.body.sanitizedInput[key]===undefined){
      delete req.body.sanitizedInput[key]}
  })

  next()
}

export { sanitizeUserInput }
