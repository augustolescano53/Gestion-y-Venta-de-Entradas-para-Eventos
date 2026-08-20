import { Entity } from '@mikro-orm/core'
import { User } from '../user/user.entity.js'

@Entity({ discriminatorValue: 'organizer' })
export class Organizer extends User {}
