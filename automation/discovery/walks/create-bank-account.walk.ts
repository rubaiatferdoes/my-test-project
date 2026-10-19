import type { Walk } from '../../types/discovery.js';
import { qaName } from '../../utils/names.js';
import { traceSelect } from '../recorders/dbTrace.js';

/** Selectors read off the live screens (artifacts/scratch-bank-account-form/screens.json). */
export const bankAccountLocators = {
  createButton: '[data-cy="entityCreateButton"]',
  nameInput: '[data-cy="name"]',
  balanceInput: '[data-cy="balance"]',
  userSelect: '[data-cy="user"]',
  saveButton: '[data-cy="entityCreateSaveButton"]',
  cancelButton: '[data-cy="entityCreateCancelButton"]',
  table: 'table',
} as const;

const accountName = qaName('seq002');
const accountBalance = '123.45';

/** SEQ-002 - create a bank account as the signed-in admin. */
export const walk: Walk = {
  id: 'SEQ-002',
  title: 'Create a bank account',
  tenant: 'a',
  login: 'session',
  steps: [
    {
      screen: 'bank-account-list-before',
      why: 'The list is the starting point and shows what exists before the walk writes anything.',
      do: async (page, ctx) => {
        await page.goto('/bank-account');
        await page.locator(bankAccountLocators.createButton).waitFor();
        ctx.data.rowsBefore = String(await page.locator('tbody tr').count());
        ctx.data.accountName = accountName;
      },
    },
    {
      screen: 'bank-account-form-empty',
      why: '"Create a new Bank Account" is the only control that starts a new record.',
      do: async (page, ctx) => {
        await page.locator(bankAccountLocators.createButton).click();
        await page.waitForURL('**/bank-account/new', { timeout: 10000 });
        ctx.data.saveDisabledOnEmptyForm = String(
          await page.locator(bankAccountLocators.saveButton).isDisabled(),
        );
      },
    },
    {
      screen: 'bank-account-form-filled',
      why: 'Fill only the two fields the form marks; leave User untouched to see what the app stores.',
      do: async (page, ctx) => {
        await page.locator(bankAccountLocators.nameInput).fill(accountName);
        await page.locator(bankAccountLocators.balanceInput).fill(accountBalance);
        ctx.data.userSelectValue = await page.locator(bankAccountLocators.userSelect).inputValue();
        ctx.data.saveDisabledWhenFilled = String(
          await page.locator(bankAccountLocators.saveButton).isDisabled(),
        );
      },
    },
    {
      screen: 'bank-account-list-after-save',
      why: 'Save is the control that commits the record.',
      do: async (page, ctx) => {
        const created = page.waitForResponse(
          (response) => response.url().includes('/api/bank-accounts') && response.request().method() === 'POST',
        );
        await page.locator(bankAccountLocators.saveButton).click();
        const response = await created;
        ctx.data.createStatus = String(response.status());
        ctx.data.createRequestBody = response.request().postData() ?? '';
        await page.waitForURL('**/bank-account', { timeout: 10000 });
      },
    },
    {
      screen: 'bank-account-list-new-row',
      why: 'Read the new row as the user sees it, to record what the list shows after a create.',
      do: async (page, ctx) => {
        const row = page.locator('tbody tr', { hasText: accountName });
        await row.first().waitFor({ timeout: 10000 });
        ctx.data.rowsAfter = String(await page.locator('tbody tr').count());
        ctx.data.newRowText = (await row.first().innerText()).replace(/\s+/g, ' ').trim();

        // The POST response body cannot be read (the SPA navigates away), so the
        // new id is read from the row's own View link.
        const href = (await row.first().locator('[data-cy="entityDetailsButton"]').getAttribute('href')) ?? '';
        ctx.data.createdId = href.split('/')[2] ?? '';
        ctx.track('bank-account', accountName, ctx.data.createdId);
        await row.first().scrollIntoViewIfNeeded();
      },
    },
    {
      screen: 'bank-account-detail',
      why: 'The View link on the new row shows the stored record, including its owner.',
      do: async (page, ctx) => {
        const id = ctx.data.createdId;
        await page.goto(`/bank-account/${id}/view`);
        await page.locator('h2, h1').first().waitFor();
      },
    },
    {
      screen: 'db-trace',
      why: 'Read-only check that the row really landed in bank_account, and what user_id it carries.',
      do: async (page, ctx) => {
        const result = await traceSelect(
          'SELECT id, name, balance, user_id FROM bank_account WHERE name = $1',
          [accountName],
        );
        ctx.data.dbTrace = JSON.stringify(result);
        await page.goto('/bank-account');
      },
    },
  ],
};
