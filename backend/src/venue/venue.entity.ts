import { Entity, Property, OneToMany, Cascade, Collection } from '@mikro-orm/core';
import { BaseEntity } from '../shared/db/baseEntity.entity.js';
import { TicketType } from '../tickettype/tickettype.entity.js';
import { Event } from '../event/event.entity.js';

@Entity()
export class Venue extends BaseEntity {
  @Property({ nullable: false })
  name!: string;

  @OneToMany(() => TicketType, (ticketType) => ticketType.venue, {
    cascade: [Cascade.ALL],
  })
  ticketTypes = new Collection<TicketType>(this);

  @OneToMany(() => Event, (event) => event.venue, {
    cascade: [Cascade.ALL],
  })
  events = new Collection<Event>(this);
}
