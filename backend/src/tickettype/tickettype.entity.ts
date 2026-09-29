import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  Rel,
  Collection,
} from '@mikro-orm/core';
import { Venue } from '../venue/venue.entity.js';
import { Ticket } from '../ticket/ticket.entity.js';

@Entity()
export class TicketType {
  @PrimaryKey()
  idTicketType!: number;

  @ManyToOne(() => Venue, { primary: true, nullable: false })
  venue!: Rel<Venue>;

  @Property({ nullable: false })
  quantity!: number;

  @Property({ nullable: false })
  location!: string;

  @Property({ nullable: false })
  isNumbered!: boolean;

  @OneToMany(() => Ticket, (ticket) => ticket.ticketType)
  tickets = new Collection<Ticket>(this);
}
