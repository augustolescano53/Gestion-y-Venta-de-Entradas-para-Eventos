import { Entity, Property, Embedded, OneToMany, Collection } from '@mikro-orm/core';
import { BaseEntity } from '../shared/db/baseEntity.entity.js';
import { TicketType } from '../tickettype/tickettype.entity.js';
import { Event } from '../event/event.entity.js';
import { Address } from './address.embeddable.js';

@Entity()
export class Venue extends BaseEntity {
  @Property({ nullable: false })
  name!: string;

  @Embedded(() => Address)
  address!: Address;

  // Sin cascada: el controller rechaza borrar un lugar con eventos o tipos
  // de entrada asociados.
  @OneToMany(() => TicketType, (ticketType) => ticketType.venue)
  ticketTypes = new Collection<TicketType>(this);

  @OneToMany(() => Event, (event) => event.venue)
  events = new Collection<Event>(this);
}
