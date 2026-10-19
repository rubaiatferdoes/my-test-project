import type { Locator, Page } from '@playwright/test';
import { loginLocators } from '../locators/login.locators.js';

/** `/login` — SEQ-001 #2-4, VAL-010..014. No assertions here (POM rule). */
export class LoginPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly loginError: Locator;

  constructor(private readonly page: Page) {
    this.username = page.locator(loginLocators.username);
    this.password = page.locator(loginLocators.password);
    this.submit = page.locator(loginLocators.submit);
    this.loginError = page.locator(loginLocators.loginError);
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await this.username.waitFor();
  }

  /** Fills both fields and clicks Sign in — does not wait for the result,
   * since a negative case stays on `/login` and a positive one navigates
   * away (EVT-003); the caller decides what to wait for next. */
  async signIn(username: string, password: string): Promise<void> {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.submit.click();
  }
}
