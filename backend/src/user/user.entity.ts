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

  @Property({ nullable: false, unique: true })
  identityDocument!: string

  @Property({ nullable: false })
  password!: string
}
