import type { Walk } from '../../types/discovery.js';
import { loginLocators } from '../session.js';
import { tenantOf } from '../../config/env.js';

const admin = tenantOf('a');

/** SEQ-001 - sign in as the admin tenant and land on the home screen. */
export const walk: Walk = {
  id: 'SEQ-001',
  title: 'Sign in as admin',
  tenant: 'a',
  login: 'none',
  steps: [
    {
      screen: 'home-anonymous',
      why: 'Start at the base URL to see what an anonymous visitor is shown.',
      do: (page) => page.goto('/'),
    },
    {
      screen: 'login-empty',
      why: 'The Account menu and the home page both point at /login; read the empty form first.',
      do: async (page) => {
        await page.goto('/login');
        await page.locator(loginLocators.username).waitFor();
      },
    },
    {
      screen: 'login-filled',
      why: 'Type the tenant-a credentials without submitting, so the filled state is recorded.',
      do: async (page) => {
        await page.locator(loginLocators.username).fill(admin.user);
        await page.locator(loginLocators.password).fill(admin.password);
      },
    },
    {
      screen: 'home-signed-in',
      why: 'Sign in is the only control that completes the step.',
      do: async (page) => {
        await page.locator(loginLocators.submit).click();
        await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
        await page.locator('#entity-menu').waitFor();
      },
    },
    {
      screen: 'entities-menu-open',
      why: 'Read the menus the signed-in user gains, which is where the workflow continues.',
      do: (page) => page.locator('#entity-menu').click(),
    },
  ],
};
