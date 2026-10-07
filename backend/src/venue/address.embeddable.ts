import { Embeddable, Property } from '@mikro-orm/core';

@Embeddable()
export class Address {
  @Property({ nullable: false })
  street!: string;

  @Property({ nullable: false })
  streetNumber!: string;

  @Property({ nullable: false })
  postalCode!: string;

  @Property({ nullable: false })
  locality!: string;

  @Property({ nullable: false })
  province!: string;

  @Property({ nullable: true })
  googleMapsUrl?: string;
}
