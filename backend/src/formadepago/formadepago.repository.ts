import { Repository } from "../shared/repository.js";
import { FormaDePago } from "./formadepago.entity.js";

const formadepago = [ 
  new FormaDePago(
    "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "Efectivo") ]

export class FormaDePagoRepository implements Repository<FormaDePago>{

  public findAll(): FormaDePago[] | undefined {
    return formadepago
  }

  public findOne(item: { id: string }): FormaDePago | undefined {
    return formadepago.find((fdp) => fdp.id === item.id)
  }

  public add(item: FormaDePago): FormaDePago | undefined {
    formadepago.push(item)
    return item
  }

  public update(item: FormaDePago): FormaDePago | undefined {
      const formadepagoIdx = formadepago.findIndex(fdp => fdp.id === fdp.id)

  if(formadepagoIdx !== -1){
    formadepago[formadepagoIdx] = {...formadepago[formadepagoIdx], ...item}
  }
  return formadepago[formadepagoIdx]
  }

  public delete(item: { id: string; }): FormaDePago | undefined {
    const formadepagoIdx = formadepago.findIndex((fdp) => fdp.id === item.id)

  if(formadepagoIdx !== -1){
    const deletedFormaDePago = formadepago[formadepagoIdx]
    formadepago.splice(formadepagoIdx,1)  
    return deletedFormaDePago
  }
  }

}