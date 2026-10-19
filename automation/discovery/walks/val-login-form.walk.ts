import type { Page } from '@playwright/test';
import type { Walk, WalkContext } from '../../types/discovery.js';

/**
 * Validation probes for the sign-in form (SEQ-001, screen `login`).
 *
 * Deliberately small: every probe is a failed sign-in, and nobody has told us
 * yet whether this app locks an account after repeated failures. All but one
 * probe use a username that does not exist (`qa-nosuch...`); exactly one
 * wrong-password attempt is made against the real tenant-a account, to read the
 * message a real user would see.
 */
const locators = {
  username: '[data-cy="username"]',
  password: '[data-cy="password"]',
  submit: '[data-cy="submit"]',
} as const;

async function messages(page: Page): Promise<string> {
  const texts = await page
    .locator('.alert-danger, .invalid-feedback, .text-danger, form small, [role="alert"]')
    .allInnerTexts()
    .catch(() => [] as string[]);
  return JSON.stringify(texts.map((t) => t.replace(/\s+/g, ' ').trim()).filter((t) => t.length > 0));
}

/** One sign-in attempt; records the message on screen and the API answer. */
async function attempt(
  page: Page,
  ctx: WalkContext,
  key: string,
  username: string,
  password: string,
): Promise<void> {
  await page.goto('/login');
  await page.locator(locators.username).waitFor();
  await page.locator(locators.username).fill(username);
  await page.locator(locators.password).fill(password);
  ctx.data[`${key}.submitDisabled`] = String(await page.locator(locators.submit).isDisabled());
  const answered = page
    .waitForResponse((r) => r.url().includes('/api/authenticate'), { timeout: 8000 })
    .catch(() => null);
  await page.locator(locators.submit).click();
  const response = await answered;
  ctx.data[`${key}.apiStatus`] = response ? String(response.status()) : 'no request sent';
  await page.waitForTimeout(500);
  ctx.data[`${key}.messages`] = await messages(page);
  ctx.data[`${key}.url`] = page.url();
}

export const walk: Walk = {
  id: 'SEQ-001/validations',
  title: 'Validation probes - sign-in form',
  tenant: 'a',
  login: 'none',
  steps: [
    {
      screen: 'login-dom',
      why: 'Read the DOM first: required, maxlength, pattern, autocomplete, and the submit state.',
      do: async (page, ctx) => {
        await page.goto('/login');
        await page.locator(locators.username).waitFor();
        ctx.data['dom.username'] = JSON.stringify(
          await page.locator(locators.username).evaluate((el) => ({
            type: el.getAttribute('type'),
            required: el.hasAttribute('required'),
            ariaRequired: el.getAttribute('aria-required'),
            maxlength: el.getAttribute('maxlength'),
            minlength: el.getAttribute('minlength'),
            pattern: el.getAttribute('pattern'),
            autocomplete: el.getAttribute('autocomplete'),
          })),
        );
        ctx.data['dom.password'] = JSON.stringify(
          await page.locator(locators.password).evaluate((el) => ({
            type: el.getAttribute('type'),
            required: el.hasAttribute('required'),
            ariaRequired: el.getAttribute('aria-required'),
            maxlength: el.getAttribute('maxlength'),
            minlength: el.getAttribute('minlength'),
            pattern: el.getAttribute('pattern'),
            autocomplete: el.getAttribute('autocomplete'),
          })),
        );
        ctx.data['dom.submitDisabled'] = String(await page.locator(locators.submit).isDisabled());
      },
    },
    {
      screen: 'l01-both-empty',
      why: 'Probe 1: submit with both fields empty. Is anything required, and what is said?',
      do: async (page, ctx) => {
        await attempt(page, ctx, 'l01-both-empty', '', '');
      },
    },
    {
      screen: 'l02-password-empty',
      why: 'Probe 1 for Password only: a real username, no password.',
      do: async (page, ctx) => {
        await attempt(page, ctx, 'l02-password-empty', 'qa-nosuchuser', '');
      },
    },
    {
      screen: 'l03-wrong-password',
      why: 'The message a real user sees on a wrong password - one attempt only, lockout is unknown.',
      do: async (page, ctx) => {
        await attempt(page, ctx, 'l03-wrong-password', 'admin', 'qa-wrong-password');
      },
    },
    {
      screen: 'l04-unknown-user',
      why: 'Does the message differ for a username that does not exist? (user enumeration)',
      do: async (page, ctx) => {
        await attempt(page, ctx, 'l04-unknown-user', 'qa-nosuchuser', 'qa-wrong-password');
      },
    },
    {
      screen: 'l05-long-username',
      why: 'Probe 3: 256 characters in Username. Must come back as a clean rejection, never a 5xx.',
      do: async (page, ctx) => {
        await attempt(page, ctx, 'l05-long-username', `qa-${'k'.repeat(253)}`, 'qa-wrong-password');
      },
    },
    {
      screen: 'l06-spaces-around-username',
      why: 'Probe 5: a real username wrapped in spaces - trimmed or treated as a different login?',
      do: async (page, ctx) => {
        await attempt(page, ctx, 'l06-spaces', '  admin  ', 'qa-wrong-password');
      },
    },
    {
      screen: 'l07-injection',
      why: "Probe 8: the SQL string in Username. Must be a clean 4xx, never a 5xx and never a sign-in.",
      do: async (page, ctx) => {
        await attempt(page, ctx, 'l07-injection', "qa-' OR '1'='1", "' OR '1'='1");
      },
    },
    {
      screen: 'l08-unicode',
      why: 'Probe 7: unicode and emoji in Username.',
      do: async (page, ctx) => {
        await attempt(page, ctx, 'l08-unicode', 'qa-日本-🔑', 'qa-wrong-password');
      },
    },
    {
      screen: 'l09-password-in-dom',
      why: 'Baseline: the password must not appear in the DOM, the URL or a network trace.',
      do: async (page, ctx) => {
        await page.goto('/login');
        await page.locator(locators.password).fill('qa-secret-probe');
        ctx.data['l09.passwordAttrValue'] =
          (await page.locator(locators.password).getAttribute('value')) ?? '(no value attribute)';
        ctx.data['l09.passwordInputType'] =
          (await page.locator(locators.password).getAttribute('type')) ?? '';
        ctx.data['l09.passwordInPageHtml'] = String((await page.content()).includes('qa-secret-probe'));
        ctx.data['l09.url'] = page.url();
      },
    },
  ],
};
