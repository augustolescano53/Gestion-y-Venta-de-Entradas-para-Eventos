import { Entity, Property, Embedded, OneToMany, Collection } from '@mikro-orm/core';
import { BaseEntity } from '../shared/db/baseEntity.entity.js';
import { TicketType } from '../tickettype/tickettype.entity.js';
import { Event } from '../event/event.entity.js';
import { Address } from './address.embeddable.js';

@Entity()
export class Venue extends BaseEntity {
  @Property({ nullable: false })
  name!: string;

  // @Embedded guarda "address" como columnas propias de la tabla venue
  // (address_street, address_street_number, etc.), prefijadas con el
  // nombre de la propiedad. Ver address.embeddable.ts para el detalle.
  @Embedded(() => Address)
  address!: Address;

  // Ya no cascadean el borrado: si un venue tiene eventos o tipos de
  // entrada asociados, el controller rechaza el delete (409) en vez de
  // arrastrarlos silenciosamente. Ver venue.controller.ts -> remove.
  @OneToMany(() => TicketType, (ticketType) => ticketType.venue)
  ticketTypes = new Collection<TicketType>(this);

  @OneToMany(() => Event, (event) => event.venue)
  events = new Collection<Event>(this);
}
