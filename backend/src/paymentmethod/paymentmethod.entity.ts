import { Entity, Property, OneToMany, Collection } from '@mikro-orm/core';
import { BaseEntity } from '../shared/db/baseEntity.entity.js';
import { Ticket } from '../ticket/ticket.entity.js';

@Entity()
export class PaymentMethod extends BaseEntity {
  @Property({ nullable: false })
  type!: string;

  @OneToMany(() => Ticket, (ticket) => ticket.paymentMethod)
  tickets = new Collection<Ticket>(this);
}
