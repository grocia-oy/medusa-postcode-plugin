import { Postcode } from './models/postCode';

declare module '@medusajs/medusa/dist/models/country' {
  interface Country {
    post_codes: Postcode[];
  }
}
