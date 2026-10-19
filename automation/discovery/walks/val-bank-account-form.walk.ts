import type { Page } from '@playwright/test';
import type { Walk, WalkContext } from '../../types/discovery.js';
import { qaName } from '../../utils/names.js';

/**
 * Validation probes for the bank account create form (SEQ-002, screen
 * `bank-account-form`). Every step is one probe from the validation-definition
 * skill's probe order. The harness screenshots and dumps the DOM after each one.
 *
 * CLAUDE.md section 4: bad data is allowed here, under `qa-` names, on the local
 * sample app, with cleanup afterwards.
 */
export const locators = {
  createButton: '[data-cy="entityCreateButton"]',
  name: '[data-cy="name"]',
  balance: '[data-cy="balance"]',
  user: '[data-cy="user"]',
  save: '[data-cy="entityCreateSaveButton"]',
  cancel: '[data-cy="entityCreateCancelButton"]',
} as const;

const DUP_NAME = qaName('val-dup');

/** Reads every validation message the form is currently showing, in order. */
async function messages(page: Page): Promise<string> {
  const texts = await page
    .locator('form .invalid-feedback, form .form-text, form .text-danger, form small, .alert')
    .allInnerTexts();
  return JSON.stringify(texts.map((t) => t.replace(/\s+/g, ' ').trim()).filter((t) => t.length > 0));
}

async function state(page: Page, ctx: WalkContext, key: string): Promise<void> {
  ctx.data[`${key}.nameValue`] = await page.locator(locators.name).inputValue();
  ctx.data[`${key}.nameClasses`] =
    (await page.locator(locators.name).getAttribute('class')) ?? '';
  ctx.data[`${key}.balanceValue`] = await page.locator(locators.balance).inputValue();
  ctx.data[`${key}.balanceClasses`] =
    (await page.locator(locators.balance).getAttribute('class')) ?? '';
  ctx.data[`${key}.saveDisabled`] = String(await page.locator(locators.save).isDisabled());
  ctx.data[`${key}.messages`] = await messages(page);
}

async function freshForm(page: Page): Promise<void> {
  await page.goto('/bank-account/new');
  await page.locator(locators.name).waitFor();
}

/** Fills the form, clicks Save, and records what the API answered. */
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
  ctx.data[`${key}.afterSubmitUrl`] = page.url();
  ctx.data[`${key}.afterSubmitMessages`] = await messages(page);
}

export const walk: Walk = {
  id: 'SEQ-002/validations',
  title: 'Validation probes - bank account create form',
  tenant: 'a',
  login: 'session',
  steps: [
    {
      screen: 'form-empty-dom',
      why: 'Read the DOM before typing anything: required, maxlength, type, min/max, pattern.',
      do: async (page, ctx) => {
        await page.goto('/bank-account');
        await page.locator(locators.createButton).click();
        await page.waitForURL('**/bank-account/new', { timeout: 10000 });
        await state(page, ctx, 'p00-pristine');
        ctx.data['p00-pristine.nameRequiredAttr'] = String(
          await page.locator(locators.name).evaluate((el) => el.hasAttribute('required')),
        );
        ctx.data['p00-pristine.userOptions'] = JSON.stringify(
          await page.locator(`${locators.user} option`).allInnerTexts(),
        );
        ctx.data['p00-pristine.userValues'] = JSON.stringify(
          await page
            .locator(`${locators.user} option`)
            .evaluateAll((els) => els.map((e) => (e as HTMLOptionElement).value)),
        );
      },
    },
    {
      screen: 'p01-name-empty',
      why: 'Probe 1: touch Name, then leave it empty. Learns required-ness and its message.',
      do: async (page, ctx) => {
        await page.locator(locators.name).fill('x');
        await page.locator(locators.name).fill('');
        await page.locator(locators.name).blur();
        await page.locator(locators.balance).fill('10');
        await page.locator(locators.balance).blur();
        await state(page, ctx, 'p01-name-empty');
        await submit(page, ctx, 'p01-name-empty');
      },
    },
    {
      screen: 'p02-balance-empty',
      why: 'Probe 1 for Balance: touch and clear it. An empty number is not zero.',
      do: async (page, ctx) => {
        await freshForm(page);
        await page.locator(locators.name).fill(qaName('val-p02'));
        await page.locator(locators.balance).fill('1');
        await page.locator(locators.balance).fill('');
        await page.locator(locators.balance).blur();
        await state(page, ctx, 'p02-balance-empty');
        await submit(page, ctx, 'p02-balance-empty');
      },
    },
    {
      screen: 'p03-both-empty',
      why: 'Both fields touched and empty - what the form says when nothing is filled in.',
      do: async (page, ctx) => {
        await freshForm(page);
        await page.locator(locators.name).fill('x');
        await page.locator(locators.name).fill('');
        await page.locator(locators.name).blur();
        await page.locator(locators.balance).fill('1');
        await page.locator(locators.balance).fill('');
        await page.locator(locators.balance).blur();
        await state(page, ctx, 'p03-both-empty');
      },
    },
    {
      screen: 'p04-name-one-char',
      why: 'Probe 2: a single character in Name. Learns whether a minimum length exists.',
      do: async (page, ctx) => {
        await freshForm(page);
        await page.locator(locators.name).fill('q');
        await page.locator(locators.name).blur();
        await page.locator(locators.balance).fill('1');
        await page.locator(locators.balance).blur();
        await state(page, ctx, 'p04-name-one-char');
      },
    },
    {
      screen: 'p05-name-256',
      why: 'Probe 3: 256 characters. Learns the maximum length and whether typing is capped.',
      do: async (page, ctx) => {
        await freshForm(page);
        const long = 'k'.repeat(256);
        await page.locator(locators.name).fill(long);
        await page.locator(locators.name).blur();
        await page.locator(locators.balance).fill('1');
        await state(page, ctx, 'p05-name-256');
        ctx.data['p05-name-256.typedLength'] = String(
          (await page.locator(locators.name).inputValue()).length,
        );
      },
    },
    {
      screen: 'p06-name-spaces',
      why: 'Probe 5: leading and trailing spaces, and a whitespace-only name.',
      do: async (page, ctx) => {
        await freshForm(page);
        await page.locator(locators.name).fill('   ');
        await page.locator(locators.name).blur();
        await page.locator(locators.balance).fill('1');
        await state(page, ctx, 'p06-name-only-spaces');
      },
    },
    {
      screen: 'p07-balance-text',
      why: 'Probe 4 for Balance: type letters into the number input.',
      do: async (page, ctx) => {
        await freshForm(page);
        await page.locator(locators.name).fill(qaName('val-p07'));
        await page.locator(locators.balance).pressSequentially('12abc', { delay: 20 });
        await page.locator(locators.balance).blur();
        await state(page, ctx, 'p07-balance-12abc');
        ctx.data['p07-balance-12abc.validity'] = JSON.stringify(
          await page
            .locator(locators.balance)
            .evaluate((el) => ({
              value: (el as HTMLInputElement).value,
              badInput: (el as HTMLInputElement).validity.badInput,
              valid: (el as HTMLInputElement).validity.valid,
            })),
        );
      },
    },
    {
      screen: 'p08-balance-negative',
      why: 'Probe for Balance: a negative value. The product has to state a decision either way.',
      do: async (page, ctx) => {
        await freshForm(page);
        await page.locator(locators.name).fill('qa-val-p08-neg');
        await page.locator(locators.balance).fill('-1');
        await page.locator(locators.balance).blur();
        await state(page, ctx, 'p08-balance-negative');
      },
    },
    {
      screen: 'p09-balance-3-decimals',
      why: 'The column is decimal(21,2): a third decimal must round or be rejected, never silently truncate.',
      do: async (page, ctx) => {
        await freshForm(page);
        await page.locator(locators.name).fill('qa-val-p09-dec');
        await page.locator(locators.balance).fill('1.555');
        await page.locator(locators.balance).blur();
        await state(page, ctx, 'p09-balance-3-decimals');
      },
    },
    {
      screen: 'p10-balance-1e999',
      why: 'Probe 4: an absurd number. Must come back as a clean rejection, never a 5xx.',
      do: async (page, ctx) => {
        await freshForm(page);
        await page.locator(locators.name).fill('qa-val-p10-huge');
        await page.locator(locators.balance).pressSequentially('1e999', { delay: 20 });
        await page.locator(locators.balance).blur();
        await state(page, ctx, 'p10-balance-1e999');
      },
    },
    {
      screen: 'p11-create-duplicate-source',
      why: 'Probe 6 needs a value that already exists: create one record first, through the UI.',
      do: async (page, ctx) => {
        await freshForm(page);
        await page.locator(locators.name).fill(DUP_NAME);
        await page.locator(locators.balance).fill('10');
        await submit(page, ctx, 'p11-dup-source');
        const row = page.locator('tbody tr', { hasText: DUP_NAME }).first();
        await row.waitFor({ timeout: 10000 }).catch(() => undefined);
        const href =
          (await row.locator('[data-cy="entityDetailsButton"]').getAttribute('href')) ?? '';
        ctx.data['p11-dup-source.id'] = href.split('/')[2] ?? '';
        ctx.track('bank-account', DUP_NAME, ctx.data['p11-dup-source.id']);
      },
    },
    {
      screen: 'p12-name-duplicate',
      why: 'Probe 6: submit a name that already exists. Learns whether Name is unique.',
      do: async (page, ctx) => {
        await freshForm(page);
        await page.locator(locators.name).fill(DUP_NAME);
        await page.locator(locators.balance).fill('20');
        await state(page, ctx, 'p12-name-duplicate');
        await submit(page, ctx, 'p12-name-duplicate');
        const rows = page.locator('tbody tr', { hasText: DUP_NAME });
        await page.waitForTimeout(500);
        ctx.data['p12-name-duplicate.rowsWithThatName'] = String(await rows.count());
        const second = rows.nth(1);
        const href =
          (await second.locator('[data-cy="entityDetailsButton"]').getAttribute('href').catch(() => '')) ?? '';
        ctx.data['p12-name-duplicate.secondId'] = href.split('/')[2] ?? '';
        if (ctx.data['p12-name-duplicate.secondId']) {
          ctx.track('bank-account', `${DUP_NAME} (duplicate)`, ctx.data['p12-name-duplicate.secondId']);
        }
      },
    },
    {
      screen: 'p13-name-unicode',
      why: 'Probe 7: unicode and emoji. Learns encoding handling end to end.',
      do: async (page, ctx) => {
        const unicodeName = 'qa-val-日本-🔑';
        ctx.data['p13-unicode.sent'] = unicodeName;
        await freshForm(page);
        await page.locator(locators.name).fill(unicodeName);
        await page.locator(locators.balance).fill('1.25');
        await state(page, ctx, 'p13-name-unicode');
        await submit(page, ctx, 'p13-unicode');
        await page.waitForTimeout(500);
        const rowUnicode = page.locator('tbody tr', { hasText: unicodeName }).first();
        ctx.data['p13-unicode.renderedRow'] = (await rowUnicode.innerText().catch(() => ''))
          .replace(/\s+/g, ' ')
          .trim();
        const href =
          (await rowUnicode.locator('[data-cy="entityDetailsButton"]').getAttribute('href').catch(() => '')) ?? '';
        ctx.data['p13-unicode.id'] = href.split('/')[2] ?? '';
        if (ctx.data['p13-unicode.id']) ctx.track('bank-account', unicodeName, ctx.data['p13-unicode.id']);
      },
    },
    {
      screen: 'p14-name-injection-xss',
      why: 'Probe 8: one injection string. Must be stored as text and rendered escaped, never executed.',
      do: async (page, ctx) => {
        const xss = 'qa-val-<script>alert(1)</script>';
        ctx.data['p14-xss.sent'] = xss;
        let dialogText = 'no dialog';
        page.once('dialog', (d) => {
          dialogText = d.message();
          void d.dismiss();
        });
        await freshForm(page);
        await page.locator(locators.name).fill(xss);
        await page.locator(locators.balance).fill('2');
        await state(page, ctx, 'p14-name-injection-xss');
        await submit(page, ctx, 'p14-xss');
        await page.waitForTimeout(800);
        const row = page.locator('tbody tr', { hasText: 'qa-val-<script>' }).first();
        ctx.data['p14-xss.renderedRow'] = (await row.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
        ctx.data['p14-xss.rowHtml'] = (await row.innerHTML().catch(() => '')).slice(0, 400);
        ctx.data['p14-xss.dialog'] = dialogText;
        const href = (await row.locator('[data-cy="entityDetailsButton"]').getAttribute('href').catch(() => '')) ?? '';
        ctx.data['p14-xss.id'] = href.split('/')[2] ?? '';
        if (ctx.data['p14-xss.id']) ctx.track('bank-account', xss, ctx.data['p14-xss.id']);
      },
    },
    {
      screen: 'p15-name-injection-sql',
      why: 'Probe 8: the SQL string. JPA binds parameters, so this should be inert - confirm it.',
      do: async (page, ctx) => {
        const sql = "qa-val-' OR '1'='1";
        ctx.data['p15-sql.sent'] = sql;
        await freshForm(page);
        await page.locator(locators.name).fill(sql);
        await page.locator(locators.balance).fill('3');
        await submit(page, ctx, 'p15-sql');
        await page.waitForTimeout(800);
        const row = page.locator('tbody tr', { hasText: "qa-val-' OR '1'='1" }).first();
        ctx.data['p15-sql.renderedRow'] = (await row.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
        const href = (await row.locator('[data-cy="entityDetailsButton"]').getAttribute('href').catch(() => '')) ?? '';
        ctx.data['p15-sql.id'] = href.split('/')[2] ?? '';
        if (ctx.data['p15-sql.id']) ctx.track('bank-account', sql, ctx.data['p15-sql.id']);
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
        await page.locator(locators.user).selectOption({ label: 'admin' }).catch(() => undefined);
        ctx.data['p16.saveWithUser'] = String(await page.locator(locators.save).isDisabled());
        ctx.data['p16.messages'] = await messages(page);
      },
    },
    {
      screen: 'p17-double-submit',
      why: 'Form-level rule: clicking Save twice quickly - one record or two?',
      do: async (page, ctx) => {
        const doubleName = qaName('val-double');
        ctx.data['p17.name'] = doubleName;
        await freshForm(page);
        await page.locator(locators.name).fill(doubleName);
        await page.locator(locators.balance).fill('7');
        const posts: number[] = [];
        page.on('response', (r) => {
          if (r.url().includes('/api/bank-accounts') && r.request().method() === 'POST') {
            posts.push(r.status());
          }
        });
        const save = page.locator(locators.save);
        await save.click({ timeout: 5000 }).catch(() => undefined);
        await save.click({ timeout: 1000, force: true }).catch(() => undefined);
        await page.waitForTimeout(1500);
        ctx.data['p17.postCount'] = String(posts.length);
        ctx.data['p17.postStatuses'] = JSON.stringify(posts);
        await page.goto('/bank-account');
        await page.waitForTimeout(500);
        const rows = page.locator('tbody tr', { hasText: doubleName });
        const count = await rows.count();
        ctx.data['p17.rowsCreated'] = String(count);
        for (let i = 0; i < count; i += 1) {
          const href =
            (await rows.nth(i).locator('[data-cy="entityDetailsButton"]').getAttribute('href').catch(() => '')) ?? '';
          ctx.track('bank-account', `${doubleName} #${i + 1}`, href.split('/')[2] ?? '');
        }
      },
    },
  ],
};
