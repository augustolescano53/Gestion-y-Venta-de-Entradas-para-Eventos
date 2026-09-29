import { Entity, OneToMany, Collection } from '@mikro-orm/core'
import { User } from '../user/user.entity.js'
import { Ticket } from '../ticket/ticket.entity.js'

@Entity({ discriminatorValue: 'participant' })
export class Participant extends User {
  @OneToMany(() => Ticket, (ticket) => ticket.participant)
  tickets = new Collection<Ticket>(this)
}
