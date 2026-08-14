import { Repository } from "../shared/repository.js";
import { TicketType } from "./tickettype.entity.js"

const ticketType = [
  new TicketType(
    3,
    "Palco",
    true,
    "4f5b2b31-c2a9-4f7f-a2d8-7c4fe2d3cc91",) ]

export class TicketTypeRepository implements Repository<TicketType>{

  public findAll(): TicketType[] | undefined {
    return ticketType
  }

  public findOne(item: { id: string }): TicketType | undefined {
    return ticketType.find((tt) => tt.id === item.id)
  }

  public add(item: TicketType): TicketType | undefined {
    ticketType.push(item)
    return item
  }

  public update(item: TicketType): TicketType | undefined {
      const ticketTypeIdx = ticketType.findIndex(tt => tt.id === item.id)

  if(ticketTypeIdx !== -1){
    ticketType[ticketTypeIdx] = {...ticketType[ticketTypeIdx], ...item}
  }
  return ticketType[ticketTypeIdx]
  }

  public delete(item: { id: string; }): TicketType | undefined {
    const ticketTypeIdx = ticketType.findIndex((tt) => tt.id === item.id)

  if(ticketTypeIdx !== -1){
    const deletedTicketType = ticketType[ticketTypeIdx]
    ticketType.splice(ticketTypeIdx,1)
    return deletedTicketType
  }
  }

}