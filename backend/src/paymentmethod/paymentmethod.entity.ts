import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from '../shared/db/baseEntity.entity.js';

@Entity()
export class PaymentMethod extends BaseEntity {
  @Property({ nullable: false })
  type!: string;
}
