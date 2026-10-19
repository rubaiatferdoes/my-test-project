import { test, expect } from '../../fixtures/baseTest.js';
import { dataFor, filledValue } from '../../utils/testData.js';
import type { LoginRequest } from '../../types/api.js';

/**
 * `[auth]` UI layer — SEQ-001, VAL-010..014. The API-reachable half of
 * each mixed case lives in `tests/api/auth.api.spec.ts`.
 */

test.describe('[TC-004] username/password mismatch is rejected, with an unresolved enumeration gap', () => {
  // The screen shows the same generic message for both rows — the gap is
  // in the API body underneath (covered in auth.api.spec.ts), not here.
  for (const record of dataFor('TC-004')) {
    test(
      `[TC-004] ${record.id} shows the generic sign-in error on screen`,
      { tag: ['@P0', '@mod-auth', '@flow-1', '@VAL-014', '@ui'] },
      async ({ loginPage }, testInfo) => {
        const login = filledValue(record.id, { tcId: 'TC-004', workerIndex: testInfo.workerIndex }) as LoginRequest;

        await loginPage.goto();
        await loginPage.signIn(login.username, login.password);

        await expect(loginPage.loginError).toHaveText(
          'Failed to sign in! Please check your credentials and try again.',
        );
      },
    );
  }
});

test(
  '[TC-016] DAT-042 anonymous home page should not advertise working credentials (today: BUG candidate, Q-001)',
  { tag: ['@P2', '@mod-auth', '@flow-1', '@security', '@ui'] },
  async ({ homePage }) => {
    await homePage.goto();
    const text = await homePage.credentialsAlert().innerText();

    expect(text, 'target behaviour — see Q-001; today the page prints both in clear text').not.toContain(
      'password="admin"',
    );
    expect(text, 'target behaviour — see Q-001; today the page prints both in clear text').not.toContain(
      'password="user"',
    );
  },
);
