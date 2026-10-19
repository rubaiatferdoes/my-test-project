import { test, expect } from '../../fixtures/baseTest.js';
import { dataFor, filledValue } from '../../utils/testData.js';
import { validateAgainstSchema } from '../../api/validators/schemaValidator.js';
import { loginResponseSchema } from '../../api/schemas/index.js';
import { tenantOf } from '../../config/env.js';
import type { LoginRequest } from '../../types/api.js';

/**
 * `[auth]` — SEQ-001 / EVT-001..004 / VAL-010..014. Only the API-reachable
 * half of each test case lives here; the on-screen half (TC-001's UI
 * steps, TC-004's row-1 screen message) is playwright-generator's.
 */

test(
  '[TC-001] sign-in API returns a usable session for tenant A',
  { tag: ['@P0', '@mod-auth', '@flow-1', '@E2E-01', '@SEQ-001', '@api', '@smoke'] },
  async ({ auth }) => {
    const credentials = tenantOf('a');
    const response = await auth.authenticate({ username: credentials.user, password: credentials.password });

    expect(response.status).toBe(200);
    const { valid, errors } = validateAgainstSchema('login-response', loginResponseSchema, response.body);
    expect(valid, errors.join('; ')).toBe(true);

    const account = await auth.getAccount({ token: response.body.id_token });
    expect(account.status).toBe(200);
    expect(account.body.login).toBe('admin');
    expect(account.body.authorities).toContain('ROLE_ADMIN');
  },
);

test.describe('[TC-002] username required and length boundary enforced by the API', () => {
  // Expected status per DAT record — the test case's own "Test data" table.
  const expected: Record<string, { status: number; bodyIncludes: string }> = {
    'DAT-010': { status: 400, bodyIncludes: 'size must be between 1 and 254' },
    'DAT-011': { status: 401, bodyIncludes: 'was not found in the database' },
    'DAT-012': { status: 401, bodyIncludes: 'was not found in the database' },
    'DAT-013': { status: 400, bodyIncludes: 'size must be between 1 and 254' },
    'DAT-014': { status: 400, bodyIncludes: 'size must be between 1 and 254' },
  };

  for (const record of dataFor('TC-002')) {
    test(
      `[TC-002] ${record.id} ${record.field}`,
      { tag: ['@P1', '@mod-auth', '@flow-1', '@VAL-010', '@VAL-011', '@api'] },
      async ({ auth }, testInfo) => {
        const expectation = expected[record.id];
        const login = filledValue(record.id, { tcId: 'TC-002', workerIndex: testInfo.workerIndex }) as LoginRequest;

        const response = await auth.authenticate(login);

        expect(response.status, 'never a server error').toBeLessThan(500);
        expect(response.status).toBe(expectation.status);
        expect(response.rawText).toContain(expectation.bodyIncludes);
      },
    );
  }
});

test.describe('[TC-003] password required and length boundary enforced by the API', () => {
  const expected: Record<string, { status: number; bodyIncludes: string }> = {
    'DAT-015': { status: 400, bodyIncludes: 'size must be between 4 and 100' },
    'DAT-016': { status: 400, bodyIncludes: 'size must be between 4 and 100' },
    'DAT-017': { status: 401, bodyIncludes: 'Bad credentials' },
    'DAT-018': { status: 401, bodyIncludes: 'Bad credentials' },
    'DAT-019': { status: 400, bodyIncludes: 'size must be between 4 and 100' },
  };

  for (const record of dataFor('TC-003')) {
    test(
      `[TC-003] ${record.id} ${record.field}`,
      { tag: ['@P1', '@mod-auth', '@flow-1', '@VAL-012', '@VAL-013', '@api'] },
      async ({ auth }, testInfo) => {
        const expectation = expected[record.id];
        const login = filledValue(record.id, { tcId: 'TC-003', workerIndex: testInfo.workerIndex }) as LoginRequest;

        const response = await auth.authenticate(login);

        expect(response.status, 'never a server error').toBeLessThan(500);
        expect(response.status).toBe(expectation.status);
        expect(response.rawText).toContain(expectation.bodyIncludes);

        // DAT-016's note: the response echoes the rejected password back —
        // a known defect (Finding 3, auth.validations.md). Recorded, not fixed.
        if (record.id === 'DAT-016') {
          const sentPassword = (login as LoginRequest).password;
          expect(response.rawText, 'known defect: password echoed back in the 400 body').toContain(sentPassword);
        }
      },
    );
  }
});

test.describe('[TC-004] username/password mismatch is rejected, with an unresolved enumeration gap', () => {
  // The screen always shows the same message (UI layer); the API body
  // differs underneath — that gap is the point of this case (Q-016).
  const expected: Record<string, { status: number; bodyIncludes: string }> = {
    'DAT-020': { status: 401, bodyIncludes: 'Bad credentials' },
    'DAT-021': { status: 401, bodyIncludes: 'was not found in the database' },
  };

  for (const record of dataFor('TC-004')) {
    test(
      `[TC-004] ${record.id} API response for ${record.field}`,
      { tag: ['@P0', '@mod-auth', '@flow-1', '@VAL-014', '@api'] },
      async ({ auth }, testInfo) => {
        const expectation = expected[record.id];
        const login = filledValue(record.id, { tcId: 'TC-004', workerIndex: testInfo.workerIndex }) as LoginRequest;

        const response = await auth.authenticate(login);

        expect(response.status).toBe(expectation.status);
        expect(response.rawText).toContain(expectation.bodyIncludes);
      },
    );
  }
});

test.describe('[TC-005] API calls with no, empty, or malformed tokens are rejected', () => {
  const literalRows = ['DAT-035', 'DAT-036', 'DAT-037', 'DAT-038', 'DAT-040'];

  for (const datId of literalRows) {
    test(
      `[TC-005] ${datId} bank-accounts list rejects the bad Authorization value`,
      { tag: ['@P0', '@mod-auth', '@flow-1', '@E2E-03', '@security', '@api'] },
      async ({ bankAccounts }, testInfo) => {
        const header = filledValue(datId, { tcId: 'TC-005', workerIndex: testInfo.workerIndex }) as string | null;
        const response = await bankAccounts.list({ authorizationHeader: header });

        expect(response.status).toBe(401);
        expect(response.status, 'never a server error').toBeLessThan(500);
        expect(response.rawText).not.toMatch(/"id"\s*:/);
      },
    );
  }

  test(
    '[TC-005] DAT-039 an expired tenant-A token is rejected',
    { tag: ['@P0', '@mod-auth', '@flow-1', '@E2E-03', '@security', '@api'] },
    async ({ bankAccounts }) => {
      // Built here, not stored: a JWT whose `exp` claim is already in the
      // past, signed with a key the app will never recognise (we don't
      // have its signing secret) — this is "wrong signature" AND
      // "expired" at once, which is still a valid probe of row 5: a real
      // token's shape, but unusable.
      const header =
        'Bearer eyJhbGciOiJIUzI1NiJ9.' +
        Buffer.from(JSON.stringify({ sub: 'admin', exp: Math.floor(Date.now() / 1000) - 3600 })).toString(
          'base64url',
        ) +
        '.expiredsignatureplaceholder';
      const response = await bankAccounts.list({ authorizationHeader: header });

      expect(response.status).toBe(401);
      expect(response.status, 'never a server error').toBeLessThan(500);
    },
  );

  test(
    '[TC-005] DAT-041 a valid token placed in the URL instead of the header is rejected',
    { tag: ['@P0', '@mod-auth', '@flow-1', '@E2E-03', '@security', '@api'] },
    async ({ bankAccounts, tenantAToken }) => {
      const response = await bankAccounts.list({
        authorizationHeader: null,
        query: { access_token: tenantAToken },
      });

      expect(response.status).toBe(401);
      expect(response.status, 'never a server error').toBeLessThan(500);
    },
  );
});
