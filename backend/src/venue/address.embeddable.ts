import { Embeddable, Property } from '@mikro-orm/core';

// Un @Embeddable es una clase de MikroORM que NO es una tabla propia:
// sus propiedades se guardan como columnas normales dentro de la tabla
// de la entidad que la embebe (acá, "venue"). Sirve para agrupar en el
// código un conjunto de campos que conceptualmente forman un solo dato
// (la dirección), sin perder la posibilidad de consultar cada columna
// por separado en MySQL (a diferencia de guardar todo como un JSON).
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

  // Opcional: no todos los lugares tienen un link de Google Maps cargado.
  @Property({ nullable: true })
  googleMapsUrl?: string;
}
