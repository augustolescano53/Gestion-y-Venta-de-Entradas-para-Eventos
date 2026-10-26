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
  name!: string;

  // Hasta 2000 caracteres (validado en el controller); varchar(255) no
  // alcanzaba para una descripción completa.
  @Property({ nullable: false, columnType: 'text' })
  description!: string;

  @Property({ nullable: false })
  status!: string;

  // Las URLs de imágenes de CDN pueden superar los 255 caracteres.
  @Property({ nullable: false, length: 2048 })
  coverImage!: string;

  // Imagen horizontal del detalle del evento. Opcional: los eventos
  // anteriores a este campo no la tienen.
  @Property({ nullable: true, length: 2048 })
  banner?: string | null;

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
