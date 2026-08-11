import { sweepExpiredSignups } from '@codeware/app-cms/util/tour-signups';
import type { TaskConfig } from 'payload';

/**
 * Nightly retention sweep over tour signups.
 *
 * GDPR asks for a defined period rather than a promise to tidy up later
 * (Art. 5(1)(e)), which means something has to enforce it without anyone
 * remembering. The guide can still clear a tour by hand the day it gets home;
 * this is the floor under that.
 *
 * Runs at 03:00 through the jobs queue, whose own locking keeps a second Fly
 * machine from doing the same work twice.
 */
export const anonymizeTourSignupsTask: TaskConfig<{
  input: Record<string, never>;
  output: { cleared: number };
}> = {
  slug: 'anonymize-tour-signups',
  label: 'Anonymize tour signups past retention',
  schedule: [{ cron: '0 3 * * *', queue: 'nightly' }],
  handler: async ({ req }) => {
    const cleared = await sweepExpiredSignups(req.payload);

    if (cleared) {
      req.payload.logger.info(
        `[anonymizeTourSignups] Cleared personal data on ${cleared} signups`
      );
    }

    return { output: { cleared } };
  }
};
