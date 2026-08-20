import { Entity } from '@mikro-orm/core'
import { User } from '../user/user.entity.js'

@Entity({ discriminatorValue: 'participant' })
export class Participant extends User {}
