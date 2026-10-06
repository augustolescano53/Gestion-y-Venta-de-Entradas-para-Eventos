import { Entity, ManyToOne, Property, Rel } from '@mikro-orm/core';
import { BaseEntity } from '../shared/db/baseEntity.entity.js';
import { Event } from '../event/event.entity.js';
import { TicketType } from '../tickettype/tickettype.entity.js';
import { PaymentMethod } from '../paymentmethod/paymentmethod.entity.js';
import { Participant } from '../participant/participant.entity.js';

@Entity()
export class Ticket extends BaseEntity {
  @Property({ nullable: false })
  status!: string;

  // Estado que tenía la entrada al anularse el evento: conserva si estaba
  // vendida o escaneada aunque ahora figure como cancelada.
  @Property({ nullable: true })
  previousStatus?: string | null;

  @Property({ nullable: false, unique: true })
  qr!: string;

  @Property({ nullable: true })
  seatNumber?: number;

  @Property({ nullable: true })
  purchaseDate?: Date;

  @ManyToOne(() => Event, { nullable: false })
  event!: Rel<Event>;

  @ManyToOne(() => TicketType, { nullable: false })
  ticketType!: Rel<TicketType>;

  // RESTRICT: un medio de pago usado en compras no se puede borrar.
  @ManyToOne(() => PaymentMethod, { nullable: true, onDelete: 'restrict' })
  paymentMethod?: Rel<PaymentMethod>;

  @ManyToOne(() => Participant, { nullable: true })
  participant?: Rel<Participant>;
}
