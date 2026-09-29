import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  Rel,
  Cascade,
  Collection,
} from '@mikro-orm/core';
import { Venue } from '../venue/venue.entity.js';
import { Organizer } from '../organizer/organizer.entity.js';
import { Ticket } from '../ticket/ticket.entity.js';

@Entity()
export class Event {
  @PrimaryKey()
  idEvent!: number;

  @ManyToOne(() => Venue, { primary: true, nullable: false })
  venue!: Rel<Venue>;

  @ManyToOne(() => Organizer, { nullable: false })
  organizer!: Rel<Organizer>;

  @Property({ nullable: false })
  description!: string;

  @Property({ nullable: false })
  status!: string;

  @Property({ nullable: false })
  coverImage!: string;

  @Property({ nullable: false, columnType: 'date' })
  date!: string;

  @Property({ nullable: false, columnType: 'time' })
  startTime!: string;

  @Property({ nullable: false, columnType: 'time' })
  endTime!: string;

  @OneToMany(() => Ticket, (ticket) => ticket.event, {
    cascade: [Cascade.ALL],
  })
  tickets = new Collection<Ticket>(this);
}
