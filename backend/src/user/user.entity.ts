import { Entity, Property } from '@mikro-orm/core'
import { BaseEntity } from '../shared/db/baseEntity.entity.js'

@Entity({ discriminatorColumn: 'type', abstract: true })
export abstract class User extends BaseEntity {
  @Property({ nullable: false })
  firstName!: string

  @Property({ nullable: false })
  lastName!: string

  @Property({ nullable: false, unique: true })
  email!: string

  // Puede repetirse entre usuarios: solo el email es único.
  @Property({ nullable: false })
  identityDocument!: string

  @Property({ nullable: false })
  password!: string

  @Property({ nullable: false, columnType: 'date' })
  birthDate!: string
}
