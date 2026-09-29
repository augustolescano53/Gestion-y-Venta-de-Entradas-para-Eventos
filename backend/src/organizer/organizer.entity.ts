import { Entity, OneToMany, Collection } from '@mikro-orm/core'
import { User } from '../user/user.entity.js'
import { Event } from '../event/event.entity.js'

@Entity({ discriminatorValue: 'organizer' })
export class Organizer extends User {
  @OneToMany(() => Event, (event) => event.organizer)
  events = new Collection<Event>(this)
}
