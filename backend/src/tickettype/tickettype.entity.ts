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

  // Precio unitario en pesos. MySQL devuelve el DECIMAL como texto.
  @Property({ columnType: 'decimal(10,2)', nullable: false, default: 0 })
  price!: number;

  @OneToMany(() => Ticket, (ticket) => ticket.ticketType)
  tickets = new Collection<Ticket>(this);
}
