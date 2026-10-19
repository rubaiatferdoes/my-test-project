import type { Locator, Page } from '@playwright/test';
import { homeLocators } from '../locators/home.locators.js';

/** `/` — SEQ-001 #1,4,5 (EVT-001, EVT-004). No assertions here (POM rule). */
export class HomePage {
  readonly accountMenu: Locator;
  readonly signInLink: Locator;
  readonly entityMenu: Locator;
  readonly adminMenu: Locator;
  readonly bankAccountMenuLink: Locator;
  readonly labelMenuLink: Locator;
  readonly operationMenuLink: Locator;
  readonly signedInAlert: Locator;

  constructor(private readonly page: Page) {
    this.accountMenu = page.locator(homeLocators.accountMenu);
    this.signInLink = page.locator(homeLocators.signInLink);
    this.entityMenu = page.locator(homeLocators.entityMenu);
    this.adminMenu = page.locator(homeLocators.adminMenu);
    this.bankAccountMenuLink = page.locator(homeLocators.bankAccountMenuLink);
    this.labelMenuLink = page.locator(homeLocators.labelMenuLink);
    this.operationMenuLink = page.locator(homeLocators.operationMenuLink);
    this.signedInAlert = page.locator(homeLocators.signedInAlert);
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  /** The credentials banner an anonymous visitor sees (SEQ-001 finding 1, Q-001). */
  credentialsAlert(): Locator {
    return this.page.locator(homeLocators.credentialsAlert).first();
  }

  /** Account menu → "Sign in" — the path TC-001 describes, not a direct `goto('/login')`. */
  async openSignIn(): Promise<void> {
    await this.accountMenu.click();
    await this.signInLink.click();
  }

  async openEntitiesMenu(): Promise<void> {
    await this.entityMenu.click();
  }

  async goToBankAccounts(): Promise<void> {
    await this.openEntitiesMenu();
    await this.bankAccountMenuLink.click();
  }
}
