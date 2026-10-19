import { test, expect } from '../../fixtures/baseTest.js';
import { tenantOf } from '../../config/env.js';
import { filledValue, getData } from '../../utils/testData.js';
import { HomePage } from '../../ui/pages/HomePage.js';

/**
 * E2E-01 — the happy path this trial can reach: sign in (journey step 1,
 * SEQ-001) then create a bank account (journey step 2, SEQ-002). Steps
 * 3-7 (labels, operations, edit, delete) aren't discovered yet — see
 * TC-001/TC-006 notes. TC-001 signs in through the UI because that IS the
 * step under test; TC-006 starts from an API-seeded session instead
 * (ts-pom-standards "setup through API clients, not the UI") — its own
 * precondition only needs *a* signed-in session, not TC-001's UI flow.
 */

test(
  '[TC-001] sign in as admin reaches the signed-in home page',
  { tag: ['@P0', '@mod-auth', '@flow-1', '@E2E-01', '@SEQ-001', '@e2e', '@smoke'] },
  async ({ page, loginPage, homePage }) => {
    const admin = tenantOf('a');

    await homePage.goto();
    await homePage.openSignIn();
    await expect(page).toHaveURL(/\/login$/);

    await loginPage.signIn(admin.user, admin.password);
    await expect(page).not.toHaveURL(/\/login$/);
    await expect(homePage.signedInAlert).toHaveText('You are logged in as user "admin".');
    await expect(homePage.entityMenu).toBeVisible();
    await expect(homePage.adminMenu).toBeVisible();

    await homePage.openEntitiesMenu();
    await expect(homePage.bankAccountMenuLink).toBeVisible();
    await expect(homePage.labelMenuLink).toBeVisible();
    await expect(homePage.operationMenuLink).toBeVisible();
  },
);

test(
  '[TC-006] create a bank account with a valid name and balance succeeds',
  { tag: ['@P0', '@mod-accounts', '@flow-2', '@E2E-01', '@SEQ-002', '@e2e', '@smoke'] },
  async ({ signedInPage, bankAccountPage, trackAccount }, testInfo) => {
    const name = filledValue('DAT-002', { tcId: 'TC-006', workerIndex: testInfo.workerIndex }) as string;
    const balance = String(getData('DAT-003').value);
    const homePage = new HomePage(signedInPage);

    await homePage.goto();
    const listLoaded = signedInPage.waitForResponse(
      (r) => r.url().includes('/api/bank-accounts') && r.request().method() === 'GET',
    );
    await homePage.goToBankAccounts();
    await listLoaded;
    await bankAccountPage.createButton.waitFor();

    await bankAccountPage.createAccount(name, balance);
    trackAccount(await bankAccountPage.detailIdFor(name));

    await expect(bankAccountPage.successAlert).toContainText('A new Bank Account is created with identifier');
    const row = bankAccountPage.rowByName(name);
    await expect(row).toContainText(name);
    await expect(row).toContainText(balance);
  },
);
