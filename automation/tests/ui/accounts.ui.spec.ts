import { test, expect } from '../../fixtures/baseTest.js';
import { filledValue, getData } from '../../utils/testData.js';

/**
 * `[accounts]` UI layer — SEQ-002, EVT-005..008, VAL-001..009. Only the
 * UI-reachable half of each mixed case lives here; the API-only rows
 * (TC-007 row 2, TC-008 rows 2-3, TC-009 row 3) live in
 * `tests/api/accounts.api.spec.ts`.
 */

test(
  '[TC-007] DAT-022 empty Name is blocked by the form, nothing is sent',
  { tag: ['@P1', '@mod-accounts', '@flow-2', '@E2E-06', '@VAL-001', '@ui'] },
  async ({ bankAccountPage }) => {
    await bankAccountPage.gotoList();
    await bankAccountPage.openCreateForm();

    await bankAccountPage.fillName('x');
    await bankAccountPage.fillName(getData('DAT-022').value as string);
    await bankAccountPage.blurName();

    await expect(bankAccountPage.nameErrors()).toHaveText(['This field is required.']);
    await expect(bankAccountPage.saveButton, 'Save stays disabled — nothing can be sent').toBeDisabled();
  },
);

test(
  '[TC-008] DAT-026 empty Balance shows both messages at once on the form',
  { tag: ['@P2', '@mod-accounts', '@flow-2', '@E2E-02', '@VAL-003', '@ui'] },
  async ({ bankAccountPage }, testInfo) => {
    const name = filledValue('DAT-002', { tcId: 'TC-008', workerIndex: testInfo.workerIndex }) as string;

    await bankAccountPage.gotoList();
    await bankAccountPage.openCreateForm();
    await bankAccountPage.fillName(name);
    await bankAccountPage.fillBalance('1');
    await bankAccountPage.fillBalance(getData('DAT-026').value as string);
    await bankAccountPage.blurBalance();

    await expect(bankAccountPage.balanceErrors()).toHaveText([
      'This field is required.',
      'This field should be a number.',
    ]);
  },
);

test(
  '[TC-009] DAT-027 malformed balance text is filtered as it is typed',
  { tag: ['@P2', '@mod-accounts', '@flow-2', '@VAL-005', '@ui'] },
  async ({ bankAccountPage }, testInfo) => {
    const name = filledValue('DAT-002', { tcId: 'TC-009', workerIndex: testInfo.workerIndex }) as string;

    await bankAccountPage.gotoList();
    await bankAccountPage.openCreateForm();
    await bankAccountPage.fillName(name);
    await bankAccountPage.typeBalance(getData('DAT-027').value as string);

    await expect(bankAccountPage.balanceInput, 'letters are dropped as typed').toHaveValue('12');
  },
);

test(
  '[TC-009] DAT-028 an absurd balance clears the field and shows both messages',
  { tag: ['@P2', '@mod-accounts', '@flow-2', '@VAL-004', '@ui'] },
  async ({ bankAccountPage }, testInfo) => {
    const name = filledValue('DAT-002', { tcId: 'TC-009', workerIndex: testInfo.workerIndex }) as string;

    await bankAccountPage.gotoList();
    await bankAccountPage.openCreateForm();
    await bankAccountPage.fillName(name);
    await bankAccountPage.typeBalance(getData('DAT-028').value as string);
    await bankAccountPage.blurBalance();

    await expect(bankAccountPage.balanceInput).toHaveValue('');
    await expect(bankAccountPage.balanceErrors()).toHaveText([
      'This field is required.',
      'This field should be a number.',
    ]);
  },
);

test(
  '[TC-011] Save stays disabled until Name and Balance both hold a value',
  { tag: ['@P2', '@mod-accounts', '@flow-2', '@VAL-007', '@ui'] },
  async ({ bankAccountPage }, testInfo) => {
    const ctx = { tcId: 'TC-011', workerIndex: testInfo.workerIndex };
    const nameOnly = filledValue('DAT-006', ctx) as string;
    const balanceOnly = getData('DAT-007').value as string;
    const both = filledValue('DAT-008', ctx) as { name: string; balance: string };

    await bankAccountPage.gotoList();
    await bankAccountPage.openCreateForm();

    await bankAccountPage.fillName(nameOnly);
    await expect(bankAccountPage.saveButton, 'Balance still empty').toBeDisabled();

    await bankAccountPage.fillName('');
    await bankAccountPage.fillBalance(balanceOnly);
    await expect(bankAccountPage.saveButton, 'Name still empty').toBeDisabled();

    await bankAccountPage.fillName(both.name);
    await bankAccountPage.fillBalance(both.balance);
    await expect(bankAccountPage.saveButton, 'both fields now hold a value').toBeEnabled();
  },
);

test(
  '[TC-012] double-clicking Save creates exactly one bank account',
  { tag: ['@P2', '@mod-accounts', '@flow-2', '@VAL-008', '@EVT-007', '@persistence', '@ui'] },
  async ({ bankAccountPage, bankAccounts, tenantAToken, trackAccount }, testInfo) => {
    const name = filledValue('DAT-002', { tcId: 'TC-012', workerIndex: testInfo.workerIndex }) as string;
    const balance = String(getData('DAT-003').value);

    await bankAccountPage.gotoList();
    await bankAccountPage.openCreateForm();
    await bankAccountPage.fillName(name);
    await bankAccountPage.fillBalance(balance);
    await bankAccountPage.doubleClickSave();

    const list = await bankAccounts.list({ token: tenantAToken });
    const matches = list.body.filter((account) => account.name === name);
    for (const account of matches) trackAccount(account.id);

    expect(matches.length, 'exactly one account, even though Save was clicked twice').toBe(1);
  },
);
