import { ScheduledJobArgs, ScheduledJobConfig } from '@medusajs/medusa';
import PostcodeFiService from '../services/postcodeFi';

export default async function handler({ container }: ScheduledJobArgs) {
  const postcodeFIService: PostcodeFiService = container.resolve('postcodeFiService');
  console.log(container)

  await postcodeFIService.triggerUpdate();
}

export const config: ScheduledJobConfig = {
  name: 'update-finnish-postcode-once-a-day',
  // schedule: '* * * * *',
  schedule: '0 2 * * 1',
};
