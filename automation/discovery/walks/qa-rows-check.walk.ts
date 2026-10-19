import type { Walk } from '../../types/discovery.js';
import { traceSelect } from '../recorders/dbTrace.js';

/** Housekeeping walk: list every qa- row this discovery run left behind. */
export const walk: Walk = {
  id: 'HOUSEKEEPING',
  title: 'List qa- rows left in bank_account',
  tenant: 'a',
  login: 'none',
  steps: [
    {
      screen: 'qa-rows',
      why: 'Read-only check of what cleanup still owes.',
      do: async (page, ctx) => {
        const result = await traceSelect(
          "SELECT id, name, balance, user_id FROM bank_account WHERE name LIKE 'qa-%' ORDER BY id",
        );
        ctx.data.qaRows = JSON.stringify(result);
        await page.goto('/');
      },
    },
  ],
};
