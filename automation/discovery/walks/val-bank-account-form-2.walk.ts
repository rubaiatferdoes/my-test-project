import type { Page } from '@playwright/test';
import type { Walk, WalkContext } from '../../types/discovery.js';
import { qaName } from '../../utils/names.js';

/**
 * Part 2 of the bank account form probes (unicode, injection, the 256-character
 * submit, form-level rules). Part 1 is `val-bank-account-form.walk.ts`.
 */
const locators = {
  name: '[data-cy="name"]',
  balance: '[data-cy="balance"]',
  user: '[data-cy="user"]',
  save: '[data-cy="entityCreateSaveButton"]',
} as const;

async function messages(page: Page): Promise<string> {
  const texts = await page
    .locator('form .invalid-feedback, form .form-text, form .text-danger, form small, .alert')
    .allInnerTexts()
    .catch(() => [] as string[]);
  return JSON.stringify(texts.map((t) => t.replace(/\s+/g, ' ').trim()).filter((t) => t.length > 0));
}

async function freshForm(page: Page): Promise<void> {
  await page.goto('/bank-account/new');
  await page.locator(locators.name).waitFor();
}

async function submit(page: Page, ctx: WalkContext, key: string): Promise<void> {
  const posted = page
    .waitForResponse(
      (r) => r.url().includes('/api/bank-accounts') && r.request().method() === 'POST',
      { timeout: 8000 },
    )
    .catch(() => null);
  await page.locator(locators.save).click({ timeout: 5000 }).catch(() => undefined);
  const response = await posted;
  ctx.data[`${key}.postStatus`] = response ? String(response.status()) : 'no POST sent';
  ctx.data[`${key}.postBody`] = response?.request().postData() ?? '';
  if (response && response.status() >= 400) {
    ctx.data[`${key}.errorBody`] = (await response.text().catch(() => '')).slice(0, 800);
  }
  await page.waitForTimeout(600);
  ctx.data[`${key}.afterSubmitUrl`] = page.url();
  ctx.data[`${key}.afterSubmitMessages`] = await messages(page);
}

/** Finds the row for a name on the list and records how it is rendered. */
async function readRow(page: Page, ctx: WalkContext, key: string, needle: string): Promise<void> {
  await page.goto('/bank-account');
  await page.waitForTimeout(600);
  const rows = page.locator('tbody tr', { hasText: needle });
  const count = await rows.count().catch(() => 0);
  ctx.data[`${key}.rowCount`] = String(count);
  if (count === 0) return;
  const row = rows.first();
  ctx.data[`${key}.renderedRow`] = (await row.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
  ctx.data[`${key}.rowHtml`] = (await row.innerHTML().catch(() => '')).slice(0, 500);
  for (let i = 0; i < count; i += 1) {
    const href =
      (await rows.nth(i).locator('[data-cy="entityDetailsButton"]').getAttribute('href').catch(() => '')) ?? '';
    ctx.track('bank-account', `${needle} #${i + 1}`, href.split('/')[2] ?? '');
  }
}

export const walk: Walk = {
  id: 'SEQ-002/validations-2',
  title: 'Validation probes - bank account form, part 2',
  tenant: 'a',
  login: 'session',
  steps: [
    {
      screen: 'p12b-duplicate-list',
      why: 'Part 1 submitted a duplicate name and got 201. Count the rows that now carry that name.',
      do: async (page, ctx) => {
        await readRow(page, ctx, 'p12b-duplicate', 'qa-valdup-');
      },
    },
    {
      screen: 'p18-name-256-submit',
      why: 'The UI let a 256-character name through. What does the API do with it?',
      do: async (page, ctx) => {
        const long = `qa-val-256-${'k'.repeat(245)}`;
        ctx.data['p18.sentLength'] = String(long.length);
        await freshForm(page);
        await page.locator(locators.name).fill(long);
        await page.locator(locators.balance).fill('1');
        await submit(page, ctx, 'p18');
        await readRow(page, ctx, 'p18', 'qa-val-256-');
      },
    },
    {
      screen: 'p13-name-unicode',
      why: 'Probe 7: unicode and emoji, end to end - typed, stored, rendered back.',
      do: async (page, ctx) => {
        const unicodeName = 'qa-val-日本-🔑';
        ctx.data['p13.sent'] = unicodeName;
        await freshForm(page);
        await page.locator(locators.name).fill(unicodeName);
        await page.locator(locators.balance).fill('1.25');
        ctx.data['p13.messages'] = await messages(page);
        await submit(page, ctx, 'p13');
        await readRow(page, ctx, 'p13', 'qa-val-日本');
      },
    },
    {
      screen: 'p14-name-injection-xss',
      why: 'Probe 8: an XSS string. Must be stored as text and rendered escaped, never executed.',
      do: async (page, ctx) => {
        const xss = 'qa-val-<script>alert(1)</script>';
        ctx.data['p14.sent'] = xss;
        let dialogText = 'no dialog';
        page.on('dialog', (d) => {
          dialogText = d.message();
          void d.dismiss();
        });
        await freshForm(page);
        await page.locator(locators.name).fill(xss);
        await page.locator(locators.balance).fill('2');
        await submit(page, ctx, 'p14');
        await readRow(page, ctx, 'p14', 'qa-val-<script>');
        ctx.data['p14.dialog'] = dialogText;
      },
    },
    {
      screen: 'p15-name-injection-sql',
      why: 'Probe 8: the SQL string. JPA binds parameters, so it should be inert - confirm it.',
      do: async (page, ctx) => {
        const sql = "qa-val-' OR '1'='1";
        ctx.data['p15.sent'] = sql;
        await freshForm(page);
        await page.locator(locators.name).fill(sql);
        await page.locator(locators.balance).fill('3');
        await submit(page, ctx, 'p15');
        await readRow(page, ctx, 'p15', "qa-val-' OR '1'='1");
      },
    },
    {
      screen: 'p16-save-enablement',
      why: 'Form-level rule: what exactly makes the disabled Save button enable?',
      do: async (page, ctx) => {
        await freshForm(page);
        ctx.data['p16.saveOnOpen'] = String(await page.locator(locators.save).isDisabled());
        await page.locator(locators.name).fill('qa-val-p16');
        ctx.data['p16.saveAfterNameOnly'] = String(await page.locator(locators.save).isDisabled());
        await page.locator(locators.name).fill('');
        await page.locator(locators.balance).fill('5');
        ctx.data['p16.saveAfterBalanceOnly'] = String(await page.locator(locators.save).isDisabled());
        await page.locator(locators.name).fill('qa-val-p16');
        ctx.data['p16.saveAfterBoth'] = String(await page.locator(locators.save).isDisabled());
        await page.locator(locators.balance).fill('0');
        ctx.data['p16.saveWithZeroBalance'] = String(await page.locator(locators.save).isDisabled());
        ctx.data['p16.messages'] = await messages(page);
      },
    },
    {
      screen: 'p17-double-submit',
      why: 'Form-level rule: two fast clicks on Save - one record or two?',
      do: async (page, ctx) => {
        const doubleName = qaName('val-double');
        ctx.data['p17.name'] = doubleName;
        const posts: number[] = [];
        page.on('response', (r) => {
          if (r.url().includes('/api/bank-accounts') && r.request().method() === 'POST') {
            posts.push(r.status());
          }
        });
        await freshForm(page);
        await page.locator(locators.name).fill(doubleName);
        await page.locator(locators.balance).fill('7');
        const save = page.locator(locators.save);
        await Promise.all([
          save.click({ timeout: 5000 }).catch(() => undefined),
          save.click({ timeout: 5000, force: true }).catch(() => undefined),
        ]);
        await page.waitForTimeout(1500);
        ctx.data['p17.postCount'] = String(posts.length);
        ctx.data['p17.postStatuses'] = JSON.stringify(posts);
        await readRow(page, ctx, 'p17', doubleName);
      },
    },
  ],
};
