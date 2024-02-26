import { Entity, OneToMany } from 'typeorm';
import { Country as MedusaCountry } from '@medusajs/medusa';
import { Postcode } from './postcode';

@Entity()
export class Country extends MedusaCountry {
  @OneToMany(() => Postcode, (post_code) => post_code.country)
  post_codes: Postcode[];
}
