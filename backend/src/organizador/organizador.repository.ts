import { Repository } from "../shared/repository.js";
import { Organizador } from "./organizador.entity.js";

const organizador = [ 
  new Organizador(
    "Juan",
    "Perez", 
    "juan.perez@example.com",
    "4f5b2b31-c2a9-4f7f-a2d8-7c4fe2d3cc91", 
    "12345678", 
    "contrasena123") ]

export class OrganizadorRepository implements Repository<Organizador>{

  public findAll(): Organizador[] | undefined {
    return organizador
  }

  public findOne(item: { id: string }): Organizador | undefined {
    return organizador.find((org) => org.id === item.id)
  }

  public add(item: Organizador): Organizador | undefined {
    organizador.push(item)
    return item
  }

  public update(item: Organizador): Organizador | undefined {
      const organizadorIdx = organizador.findIndex(org => org.id === item.id)

  if(organizadorIdx !== -1){
    organizador[organizadorIdx] = {...organizador[organizadorIdx], ...item}
  }
  return organizador[organizadorIdx]
  }

  public delete(item: { id: string; }): Organizador | undefined {
    const organizadorIdx = organizador.findIndex((org) => org.id === item.id)

  if(organizadorIdx !== -1){
    const deletedOrganizador = organizador[organizadorIdx]
    organizador.splice(organizadorIdx,1)  
    return deletedOrganizador
  }
  }

}