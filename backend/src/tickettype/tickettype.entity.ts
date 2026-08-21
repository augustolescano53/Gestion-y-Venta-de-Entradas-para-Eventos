import { Entity, ManyToOne, PrimaryKey, Property, Rel } from '@mikro-orm/core';
import { Venue } from '../venue/venue.entity.js';

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
}
