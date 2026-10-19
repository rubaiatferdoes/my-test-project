import { test, expect } from '../../fixtures/baseTest.js';
import { filledValue, getData, uniqueQaName } from '../../utils/testData.js';
import { validateAgainstSchema } from '../../api/validators/schemaValidator.js';
import { bankAccountSchema } from '../../api/schemas/index.js';
import type { BankAccount, BankAccountPayload } from '../../types/api.js';

/**
 * `/api/bank-accounts` — SEQ-002 / EVT-005..008 / VAL-001..009. Only the
 * API-reachable half of each mixed UI+API case lives here (TC-006..009's
 * UI steps belong to playwright-generator); API-only cases (TC-010,
 * TC-013, TC-014, TC-015) are fully covered here.
 */

function trackIfCreated(response: { status: number; body: unknown }, trackAccount: (id: number | string) => void): void {
  if (response.status >= 200 && response.status < 300 && response.body && typeof response.body === 'object' && 'id' in response.body) {
    trackAccount((response.body as BankAccount).id);
  }
}

test(
  '[TC-006] create bank account via API with a valid name and balance succeeds',
  { tag: ['@P0', '@mod-accounts', '@flow-2', '@E2E-01', '@SEQ-002', '@api', '@smoke'] },
  async ({ bankAccounts, tenantAToken, trackAccount }, testInfo) => {
    const name = filledValue('DAT-002', { tcId: 'TC-006', workerIndex: testInfo.workerIndex }) as string;
    const balance = getData('DAT-003').value as number;

    const created = await bankAccounts.create({ name, balance, user: null }, { token: tenantAToken });
    trackIfCreated(created, trackAccount);

    expect(created.status).toBe(201);
    const { valid, errors } = validateAgainstSchema('bank-account', bankAccountSchema, created.body);
    expect(valid, errors.join('; ')).toBe(true);
    expect(created.body.name).toBe(name);
    expect(Number(created.body.balance)).toBe(balance);

    const list = await bankAccounts.list({ token: tenantAToken });
    expect(list.status).toBe(200);
    expect(list.body.some((account) => account.id === created.body.id && account.name === name)).toBe(true);
  },
);

test(
  '[TC-007] DAT-023 the API accepts an empty name the UI blocks (known gap)',
  { tag: ['@P1', '@mod-accounts', '@flow-2', '@E2E-06', '@VAL-002', '@api'] },
  async ({ bankAccounts, tenantAToken, trackAccount }) => {
    const emptyName = getData('DAT-023').value as string;
    const balance = getData('DAT-003').value as number;

    const response = await bankAccounts.create({ name: emptyName, balance }, { token: tenantAToken });
    trackIfCreated(response, trackAccount);

    expect(response.status, 'documented gap — VAL-002, accounts.validations.md Finding 2').toBe(201);
    expect(response.body.name).toBe('');
  },
);

test.describe('[TC-008] balance is required and rejected at both layers when missing', () => {
  const rows = [
    { datId: 'DAT-024', label: 'balance null' },
    { datId: 'DAT-025', label: 'balance empty string' },
  ];

  for (const row of rows) {
    test(
      `[TC-008] ${row.datId} ${row.label} is rejected by the API`,
      { tag: ['@P2', '@mod-accounts', '@flow-2', '@E2E-02', '@VAL-003', '@api'] },
      async ({ bankAccounts, tenantAToken }, testInfo) => {
        const name = filledValue('DAT-002', { tcId: 'TC-008', workerIndex: testInfo.workerIndex }) as string;
        const balance = getData(row.datId).value as string | null;

        const response = await bankAccounts.create({ name, balance }, { token: tenantAToken });

        expect(response.status, 'never a server error').toBeLessThan(500);
        expect(response.status).toBe(400);
        expect(response.rawText).toContain('must not be null');
      },
    );
  }
});

test(
  '[TC-009] DAT-029 malformed balance text is rejected cleanly by the API',
  { tag: ['@P2', '@mod-accounts', '@flow-2', '@VAL-004', '@api'] },
  async ({ bankAccounts, tenantAToken }, testInfo) => {
    const name = filledValue('DAT-002', { tcId: 'TC-009', workerIndex: testInfo.workerIndex }) as string;
    const balance = getData('DAT-029').value as string;

    const response = await bankAccounts.create({ name, balance }, { token: tenantAToken });

    expect(response.status, 'never a server error').toBeLessThan(500);
    expect(response.status).toBe(400);
    expect(response.rawText).toContain('Failed to read request');
  },
);

test(
  '[TC-010] a client-supplied id on create is rejected by the API',
  { tag: ['@P2', '@mod-accounts', '@flow-2', '@VAL-006', '@api'] },
  async ({ bankAccounts, tenantAToken, trackAccount }, testInfo) => {
    const name = filledValue('DAT-002', { tcId: 'TC-010', workerIndex: testInfo.workerIndex }) as string;
    const balance = getData('DAT-003').value as number;

    const withoutId = await bankAccounts.create(
      { id: getData('DAT-009').value as null, name, balance },
      { token: tenantAToken },
    );
    trackIfCreated(withoutId, trackAccount);
    expect(withoutId.status).toBe(201);

    const withForgedId = await bankAccounts.create(
      { id: getData('DAT-030').value as number, name, balance },
      { token: tenantAToken },
    );
    trackIfCreated(withForgedId, trackAccount);

    expect(withForgedId.status, 'never a server error').toBeLessThan(500);
    expect(withForgedId.status).toBe(400);
    expect(withForgedId.rawText).toContain('error.idexists');
  },
);

test(
  '[TC-013] no rejection observed after creating 25 bank accounts in a row',
  { tag: ['@P3', '@mod-accounts', '@flow-2', '@VAL-009', '@api'] },
  async ({ bankAccounts, tenantAToken, trackAccount }, testInfo) => {
    const balance = getData('DAT-003').value as number;
    const baseName = uniqueQaName('TC-013', testInfo.workerIndex);

    for (let i = 0; i < 25; i += 1) {
      const response = await bankAccounts.create({ name: `${baseName}-${i}`, balance }, { token: tenantAToken });
      trackIfCreated(response, trackAccount);
      expect(response.status, `call ${i + 1} of 25 must not be rejected`).toBe(201);
      expect(response.status, 'never a server error').toBeLessThan(500);
    }
  },
);

test.describe('[TC-014] tenant B can read every bank account and the full user list; a forged owner is honoured', () => {
  test(
    "[TC-014] DAT-043 tenant B's bank accounts list includes accounts it doesn't own",
    { tag: ['@P1', '@mod-accounts', '@flow-2', '@E2E-04', '@EVT-005', '@security', '@api'] },
    async ({ bankAccounts, tenantAToken, tenantBToken, trackAccount }, testInfo) => {
      const name = filledValue('DAT-002', { tcId: 'TC-014', workerIndex: testInfo.workerIndex }) as string;
      const balance = getData('DAT-003').value as number;

      const created = await bankAccounts.create({ name, balance }, { token: tenantAToken });
      trackIfCreated(created, trackAccount);
      expect(created.status).toBe(201);

      const asTenantB = await bankAccounts.list({ token: tenantBToken });
      expect(asTenantB.status, 'current behaviour, not endorsed — Q-006').toBe(200);
      expect(asTenantB.body.some((account) => account.id === created.body.id)).toBe(true);
    },
  );

  test(
    "[TC-014] DAT-044 tenant B's users list returns every tenant's details",
    { tag: ['@P1', '@mod-accounts', '@flow-2', '@E2E-04', '@EVT-006', '@security', '@api'] },
    async ({ users, tenantBToken }) => {
      const response = await users.list({ token: tenantBToken });

      expect(response.status, 'current behaviour, not endorsed — Q-009').toBe(200);
      const logins = response.body.map((user) => user.login);
      expect(logins).toEqual(expect.arrayContaining(['admin', 'user']));
    },
  );

  test(
    '[TC-014] DAT-045 tenant A creating an account owned by tenant B succeeds',
    { tag: ['@P1', '@mod-accounts', '@flow-2', '@E2E-04', '@EVT-007', '@security', '@api'] },
    async ({ bankAccounts, tenantAToken, trackAccount }, testInfo) => {
      const name = filledValue('DAT-002', { tcId: 'TC-014', workerIndex: testInfo.workerIndex }) as string;
      const balance = getData('DAT-003').value as number;
      const forgedOwner = getData('DAT-045').value as { id: number; login: string };

      const response = await bankAccounts.create({ name, balance, user: forgedOwner }, { token: tenantAToken });
      trackIfCreated(response, trackAccount);

      expect(response.status, 'current behaviour, not endorsed — Q-007/Q-011').toBe(201);
      expect(response.body.user?.id).toBe(forgedOwner.id);
    },
  );
});

test.describe('[TC-015] oversized or invalid input must return a clean rejection, never a server error', () => {
  const rows: Array<{
    datId: string;
    build: (name: string, balance: number, oversizedName: string) => BankAccountPayload;
    leakMarkers: string[];
  }> = [
    {
      datId: 'DAT-031',
      build: (_name, balance, oversizedName) => ({ name: oversizedName, balance }),
      leakMarkers: ['insert into', 'could not execute'],
    },
    {
      datId: 'DAT-032',
      build: (name) => ({ name, balance: getData('DAT-032').value as string }),
      leakMarkers: ['numeric field overflow'],
    },
    {
      datId: 'DAT-033',
      build: (name) => ({ name, balance: getData('DAT-033').value as string }),
      leakMarkers: ['numeric field overflow'],
    },
    {
      datId: 'DAT-034',
      build: (name, balance) => ({ name, balance, user: getData('DAT-034').value as { id: number } }),
      leakMarkers: ['constraint', 'fk_bank_account'],
    },
  ];

  for (const row of rows) {
    test(
      `[TC-015] ${row.datId} is rejected cleanly, never with a server error (today: BUG candidate)`,
      { tag: ['@P1', '@mod-accounts', '@flow-2', '@SEQ-002', '@api'] },
      async ({ bankAccounts, tenantAToken, trackAccount }, testInfo) => {
        const ctx = { tcId: 'TC-015', workerIndex: testInfo.workerIndex };
        const name = filledValue('DAT-002', ctx) as string;
        const balance = getData('DAT-003').value as number;
        const oversizedName = filledValue('DAT-031', ctx) as string;
        const payload = row.build(name, balance, oversizedName);

        const response = await bankAccounts.create(payload, { token: tenantAToken });
        trackIfCreated(response, trackAccount);

        expect(response.status, 'CLAUDE.md §6: a 5xx is always a bug — never expect one').toBeLessThan(500);
        for (const marker of row.leakMarkers) {
          expect(response.rawText.toLowerCase(), 'must not leak internals').not.toContain(marker.toLowerCase());
        }
      },
    );
  }
});
