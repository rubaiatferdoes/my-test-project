import { test as base, request as playwrightRequest } from '@playwright/test';
import type { Page } from '@playwright/test';
import { ENV, tenantOf } from '../config/env.js';
import { AuthClient } from '../api/clients/AuthClient.js';
import { BankAccountClient } from '../api/clients/BankAccountClient.js';
import { UsersClient } from '../api/clients/UsersClient.js';
import { uniqueQaName } from '../utils/testData.js';
import { LoginPage } from '../ui/pages/LoginPage.js';
import { HomePage } from '../ui/pages/HomePage.js';
import { BankAccountPage } from '../ui/pages/BankAccountPage.js';
import type { TenantKey } from '../types/discovery.js';

/** sessionStorage key the app reads its JWT from — confirmed live
 * (SEQ-001 recorded only that the token lives in sessionStorage, not the
 * exact key; see the generator's report). Seeding it lets a UI test start
 * already signed in without clicking through `/login` (ts-pom-standards
 * "setup through API clients, not the UI"). */
const AUTH_TOKEN_SESSION_KEY = 'jhi-authenticationToken';

interface WorkerFixtures {
  /** Signed in once per worker and reused (ts-pom-standards §4) — never hard-coded. */
  tenantAToken: string;
  tenantBToken: string;
}

interface TestFixtures {
  auth: AuthClient;
  bankAccounts: BankAccountClient;
  users: UsersClient;
  /** `qa-<tc>-<time>-w<worker>-<random>`, derived from the test's own `[TC-xxx]` title. */
  qaName: string;
  /** Registers a bank-account id for cleanup; deleted (admin token) even if the test fails. */
  trackAccount: (id: number | string) => void;

  /** A page already signed in as tenant A — the JWT is seeded into
   * sessionStorage from the worker's API token, no UI login performed. */
  signedInPage: Page;
  loginPage: LoginPage;
  homePage: HomePage;
  /** Wraps `signedInPage` — only use when sign-in itself isn't the step
   * under test (TC-001 builds its own `LoginPage`/`HomePage` from `page`). */
  bankAccountPage: BankAccountPage;
}

async function signIn(tenant: TenantKey): Promise<string> {
  const context = await playwrightRequest.newContext({ baseURL: ENV.apiUrl, ignoreHTTPSErrors: true });
  try {
    const client = new AuthClient(context, ENV.apiUrl);
    const credentials = tenantOf(tenant);
    const response = await client.authenticate({ username: credentials.user, password: credentials.password });
    if (response.status !== 200 || !response.body?.id_token) {
      throw new Error(`Worker sign-in failed for tenant ${tenant}: ${response.status} ${response.rawText}`);
    }
    return response.body.id_token;
  } finally {
    await context.dispose();
  }
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  tenantAToken: [
    async ({}, use) => {
      await use(await signIn('a'));
    },
    { scope: 'worker' },
  ],
  tenantBToken: [
    async ({}, use) => {
      await use(await signIn('b'));
    },
    { scope: 'worker' },
  ],

  auth: async ({ request }, use) => {
    await use(new AuthClient(request, ENV.apiUrl));
  },
  bankAccounts: async ({ request }, use) => {
    await use(new BankAccountClient(request, ENV.apiUrl));
  },
  users: async ({ request }, use) => {
    await use(new UsersClient(request, ENV.apiUrl));
  },

  qaName: async ({}, use, testInfo) => {
    const match = /\[(TC-\d+)]/.exec(testInfo.title);
    const tcId = match ? match[1] : 'tc-unknown';
    await use(uniqueQaName(tcId, testInfo.workerIndex));
  },

  trackAccount: async ({ bankAccounts, tenantAToken }, use) => {
    const createdIds: Array<number | string> = [];
    await use((id) => {
      createdIds.push(id);
    });
    for (const id of createdIds) {
      await bankAccounts.remove(id, { token: tenantAToken }).catch(() => undefined);
    }
  },

  signedInPage: async ({ context, tenantAToken }, use) => {
    await context.addInitScript(
      ([key, token]) => {
        window.sessionStorage.setItem(key, JSON.stringify(token));
      },
      [AUTH_TOKEN_SESSION_KEY, tenantAToken] as const,
    );
    const page = await context.newPage();
    await use(page);
    await page.close();
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  bankAccountPage: async ({ signedInPage }, use) => {
    await use(new BankAccountPage(signedInPage));
  },
});

export { expect } from '@playwright/test';
