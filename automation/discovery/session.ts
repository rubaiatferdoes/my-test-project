import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Browser, Page } from '@playwright/test';
import { ENV, tenantOf } from '../config/env.js';
import type { TenantKey } from '../types/discovery.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const authDir = path.resolve(here, '.auth');

/** Selectors confirmed from the first login-page probe (artifacts/login-probe/screens.json). */
export const loginLocators = {
  accountMenu: '#account-menu',
  username: '[data-cy="username"]',
  password: '[data-cy="password"]',
  submit: '[data-cy="submit"]',
  failedAlert: '.alert-danger',
} as const;

/** Signs in through the UI. Used both by the login walk and by session reuse. */
export async function signIn(page: Page, tenant: TenantKey): Promise<void> {
  const credentials = tenantOf(tenant);
  await page.goto('/login');
  await page.locator(loginLocators.username).fill(credentials.user);
  await page.locator(loginLocators.password).fill(credentials.password);
  await page.locator(loginLocators.submit).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
}

export interface SessionState {
  /** Path to the Playwright storageState file (cookies + localStorage). */
  readonly statePath: string;
  /** sessionStorage is NOT part of storageState; without "Remember me" the JWT lives here. */
  readonly sessionStorage: Record<string, string>;
  /** Which storage the app used for the token - recorded as an observation. */
  readonly tokenStorage: 'localStorage' | 'sessionStorage' | 'none';
}

const READ_STORAGE = `(() => ({
  local: Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k) || ''])),
  session: Object.fromEntries(Object.keys(sessionStorage).map((k) => [k, sessionStorage.getItem(k) || '']))
}))()`;

/**
 * Signs in once and returns a reusable session. The cache lives in discovery/.auth/
 * and is gitignored - it holds a real JWT.
 */
export async function loadSession(browser: Browser, tenant: TenantKey): Promise<SessionState> {
  fs.mkdirSync(authDir, { recursive: true });
  const statePath = path.join(authDir, `tenant-${tenant}.json`);

  const context = await browser.newContext({ baseURL: ENV.baseUrl, ignoreHTTPSErrors: true });
  const page = await context.newPage();
  await signIn(page, tenant);

  const storage = (await page.evaluate(READ_STORAGE)) as {
    local: Record<string, string>;
    session: Record<string, string>;
  };
  await context.storageState({ path: statePath });
  await context.close();

  const tokenKey = /token/i;
  const tokenStorage = Object.keys(storage.local).some((k) => tokenKey.test(k))
    ? 'localStorage'
    : Object.keys(storage.session).some((k) => tokenKey.test(k))
      ? 'sessionStorage'
      : 'none';

  return { statePath, sessionStorage: storage.session, tokenStorage };
}
