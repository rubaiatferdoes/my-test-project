import type { Locator, Page } from '@playwright/test';
import { bankAccountLocators } from '../locators/bankAccount.locators.js';

/**
 * `/bank-account`, `/bank-account/new`, `/bank-account/{id}/view` —
 * SEQ-002, EVT-005..008, VAL-001..009. No assertions here (POM rule).
 * Waits are kept on the routes the event definitions recorded
 * (`**\/api/bank-accounts*`, `**\/api/users`), not on a visible element.
 */
export class BankAccountPage {
  readonly createButton: Locator;
  readonly nameInput: Locator;
  readonly balanceInput: Locator;
  readonly userSelect: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly successAlert: Locator;
  readonly rows: Locator;

  constructor(private readonly page: Page) {
    this.createButton = page.locator(bankAccountLocators.createButton);
    this.nameInput = page.locator(bankAccountLocators.nameInput);
    this.balanceInput = page.locator(bankAccountLocators.balanceInput);
    this.userSelect = page.locator(bankAccountLocators.userSelect);
    this.saveButton = page.locator(bankAccountLocators.saveButton);
    this.cancelButton = page.locator(bankAccountLocators.cancelButton);
    this.successAlert = page.locator(bankAccountLocators.successAlert);
    this.rows = page.locator(bankAccountLocators.rows);
  }

  /** EVT-005 — the list route is what every list screen waits on. */
  async gotoList(): Promise<void> {
    const list = this.page.waitForResponse(
      (r) => r.url().includes('/api/bank-accounts') && r.request().method() === 'GET',
    );
    await this.page.goto('/bank-account');
    await list;
    await this.createButton.waitFor();
  }

  /** EVT-006 — opening the form also fires `GET /api/users` (the owner dropdown). */
  async openCreateForm(): Promise<void> {
    const usersLoaded = this.page.waitForResponse(
      (r) => r.url().includes('/api/users') && r.request().method() === 'GET',
    );
    await this.createButton.click();
    await this.page.waitForURL('**/bank-account/new');
    await usersLoaded;
  }

  async fillName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  /** Sets the value directly — for rows that start from a valid, already-typed value. */
  async fillBalance(balance: string): Promise<void> {
    await this.balanceInput.fill(balance);
  }

  /** Simulates real keystrokes — needed to observe the browser's own
   * `type="number"` character filtering (VAL-005), which `fill()` bypasses. */
  async typeBalance(text: string): Promise<void> {
    await this.balanceInput.pressSequentially(text, { delay: 20 });
  }

  async blurName(): Promise<void> {
    await this.nameInput.blur();
  }

  async blurBalance(): Promise<void> {
    await this.balanceInput.blur();
  }

  nameErrors(): Locator {
    return this.page.locator(bankAccountLocators.nameErrors);
  }

  balanceErrors(): Locator {
    return this.page.locator(bankAccountLocators.balanceErrors);
  }

  /** EVT-007 — Save, then wait for the list reload before reading the new row. */
  async save(): Promise<void> {
    const created = this.page.waitForResponse(
      (r) => r.url().includes('/api/bank-accounts') && r.request().method() === 'POST',
    );
    await this.saveButton.click();
    await created;
    await this.page.waitForURL('**/bank-account');
  }

  async createAccount(name: string, balance: string): Promise<void> {
    await this.openCreateForm();
    await this.fillName(name);
    await this.fillBalance(balance);
    await this.save();
  }

  /**
   * VAL-008 — two separate clicks right after each other, exactly as the
   * validation walk probed it (`val-bank-account-form-2`, p17): a native
   * `dblclick()` fires both mouse events faster than that probe did and
   * reliably produces 2 POSTs instead of the approved 1 — same action,
   * different timing, not this case's finding to change.
   */
  async doubleClickSave(): Promise<void> {
    await this.saveButton.click({ timeout: 5000 }).catch(() => undefined);
    await this.saveButton.click({ timeout: 1000, force: true }).catch(() => undefined);
    await this.page.waitForURL('**/bank-account', { timeout: 10_000 }).catch(() => undefined);
    await this.page.waitForLoadState('networkidle');
  }

  rowByName(name: string): Locator {
    return this.rows.filter({ hasText: name });
  }

  async detailIdFor(name: string): Promise<string> {
    const href = await this.rowByName(name).first().locator(bankAccountLocators.rowDetailLink).getAttribute('href');
    return href?.split('/')[2] ?? '';
  }
}
