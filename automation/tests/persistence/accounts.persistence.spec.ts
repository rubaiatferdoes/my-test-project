import { test, expect } from '../../fixtures/baseTest.js';
import { getData } from '../../utils/testData.js';
import type { BankAccount } from '../../types/api.js';

/**
 * `@persistence` — DB_ACCESS=none (test-plan §0). TC-012 is the only
 * approved `@persistence` case.
 *
 * ADAPTATION, reported to the pipeline owner: TC-012 as written is a UI
 * action (double-click Save in the browser) checked through the list API
 * instead of a DB read. This generator's scope is API-only, so the probe
 * below fires the identical `POST /api/bank-accounts` request twice in
 * parallel instead of clicking a button twice — the "Idempotency" pattern
 * from the `ts-pom-standards` persistence table ("submit twice, then
 * count through the list endpoint"). It is NOT the same mechanism TC-012
 * names: the UI may be guarding this with a disabled button or a fast
 * navigation away, neither of which exists when the two POSTs are fired
 * directly. The test case's own notes already flag this: "no confirmed
 * server-side safeguard against a double submit". Expect this test to
 * show the real, un-guarded server behaviour — which may well be 2 rows,
 * not 1 — and treat that result as a finding, not something to loosen.
 * playwright-generator should still add the literal UI double-click
 * version of TC-012 separately.
 */
test(
  '[TC-012] submitting the same create request twice creates exactly one bank account',
  { tag: ['@P2', '@mod-accounts', '@flow-2', '@VAL-008', '@EVT-007', '@persistence'] },
  async ({ bankAccounts, tenantAToken, qaName, trackAccount }) => {
    const balance = getData('DAT-003').value as number;
    const payload = { name: qaName, balance };

    const [first, second] = await Promise.all([
      bankAccounts.create(payload, { token: tenantAToken }),
      bankAccounts.create(payload, { token: tenantAToken }),
    ]);

    for (const response of [first, second]) {
      if (response.status === 201) {
        trackAccount((response.body as BankAccount).id);
      }
    }

    // Assert on a fresh GET, never on either POST's own echo.
    const list = await bankAccounts.list({ token: tenantAToken });
    const matches = list.body.filter((account) => account.name === qaName);

    expect(matches, 'exactly one account created, even though the request was sent twice').toHaveLength(1);
  },
);
