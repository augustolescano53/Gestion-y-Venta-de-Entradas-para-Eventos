import { Repository } from "../shared/repository.js";
import { Organizer } from "./organizer.entity.js";

const organizer = [
  new Organizer(
    "Juan",
    "Perez",
    "juan.perez@example.com",
    "4f5b2b31-c2a9-4f7f-a2d8-7c4fe2d3cc91",
    "12345678",
    "contrasena123") ]

export class OrganizerRepository implements Repository<Organizer>{

  public findAll(): Organizer[] | undefined {
    return organizer
  }

  public findOne(item: { id: string }): Organizer | undefined {
    return organizer.find((org) => org.id === item.id)
  }

  public add(item: Organizer): Organizer | undefined {
    organizer.push(item)
    return item
  }

  public update(item: Organizer): Organizer | undefined {
      const organizerIdx = organizer.findIndex(org => org.id === item.id)

  if(organizerIdx !== -1){
    organizer[organizerIdx] = {...organizer[organizerIdx], ...item}
  }
  return organizer[organizerIdx]
  }

  public delete(item: { id: string; }): Organizer | undefined {
    const organizerIdx = organizer.findIndex((org) => org.id === item.id)

  if(organizerIdx !== -1){
    const deletedOrganizer = organizer[organizerIdx]
    organizer.splice(organizerIdx,1)
    return deletedOrganizer
  }
  }

}