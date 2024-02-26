import { Logger, TransactionBaseService } from '@medusajs/medusa';
import { Country } from '../models/country';

export interface CountryServiceParams {
  logger: Logger;
}

class CountryService extends TransactionBaseService {
  constructor(container: CountryServiceParams) {
    super(container);
  }

  async retrieveByCountryISO2(iso_2) {
    const countryRepo = this.activeManager_.getRepository(Country);

    return await countryRepo.findOneBy({ iso_2 });
  }
}


export default CountryService;