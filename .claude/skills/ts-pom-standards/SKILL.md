---
name: ts-pom-standards
description: The team's TypeScript + Playwright automation standard — one project for UI and API tests, Page Object Model for UI, API Object Model for API, typed fixtures with automatic cleanup, TC-tagged tests, condition-based waits. Use when generating, reviewing, or explaining UI/API automation code.
---

# TypeScript + POM Automation Standard

One Playwright project tests both UI and API. Same language, same runner,
same report.

## 1. Folder layout — `automation/`

```
automation/
├── playwright.config.ts        projects: api, db, ui, e2e
├── tsconfig.json               "strict": true
├── package.json                scripts below
├── eslint.config.mjs           ESLint flat config (typescript-eslint recommended)
├── config/env.ts               typed ENV object — loads ../.env with dotenv, then reads process.env;
│                               REQUIRED values missing → clear error naming them;
│                               OPTIONAL ones (revocation delay, cross-tenant status,
│                               DB_*) may be empty
├── types/                      Endpoint, ApiKey, ErrorResponse ...
├── discovery/                  ── DISCOVERY HARNESS (learn the app) ──
│   ├── explore.ts                       CLI: run one walk, write artifacts
│   ├── session.ts                       login per tenant, reusable storageState
│   ├── recorders/network.ts             request/response capture per step
│   ├── recorders/screens.ts             screenshot + field/attribute dump
│   ├── recorders/console.ts             console errors and page errors
│   ├── recorders/dbTrace.ts             read-only tracer lookup + row diff by PK (skipped without DB_TYPE)
│   ├── walks/<name>.walk.ts             one replayable walk per SEQ-
│   └── artifacts/<walk>/                raw recordings (gitignored)
├── ui/                         ── PAGE OBJECT MODEL ──
│   ├── locators/<feature>.locators.ts   selector strings ONLY
│   └── pages/<Feature>Page.ts           one business action per method
├── api/                        ── API OBJECT MODEL ──
│   ├── clients/BaseClient.ts            headers, auth, error handling
│   ├── clients/PlatformClient.ts        create/list/delete endpoints & keys
│   ├── clients/GeneratedEndpointClient.ts  call a customer's endpoint with a key
│   ├── schemas/<name>.schema.json       JSON schemas (from test cases)
│   └── validators/schemaValidator.ts    ajv-based validation helper
├── db/                         ── DATABASE LAYER (read-only) ──
│   ├── DbClient.ts                      read-only connection, driver by DB_TYPE
│   ├── catalog.ts                       information_schema: tables, columns, PKs, FKs (cached)
│   ├── tracer.ts                        find a qa- value's table+column, walk FKs, diff a row by PK
│   ├── queries/<area>.queries.ts        named, parameterized SELECTs only
│   └── DbVerifier.ts                    business-level checks (endpointRow, orphanKeys…)
├── fixtures/baseTest.ts        exposes pages + clients + db; creates & cleans qa- data
├── utils/                      poll helpers, unique names (qa-<tc>-<time>-w<worker>-<random>)
│   └── testData.ts             typed loader for ../test-data/*.json
│                               (dataFor('TC-005'), getData('DAT-004'))
└── tests/
    ├── api/<feature>.api.spec.ts
    ├── ui/<feature>.ui.spec.ts
    ├── e2e/<flow>.e2e.spec.ts
    └── db/<area>.db.spec.ts         standalone integrity checks (@db)
```

`package.json` scripts: `test`, `test:api`, `test:ui`, `test:e2e`, `test:db` (`--project=db`),
`test:headed`, `discover` (`tsx discovery/explore.ts`), `typecheck` (`tsc --noEmit`),
`lint`, `report`.

### The discovery harness

Discovery runs before any test exists, so whichever agent walks the app
first creates `automation/` and builds `discovery/` inside it. It shares
`config/env.ts`, `types/`, and the login helper with the tests — one
project, one source of truth for URLs and credentials.

A walk file is the sequence as code, and the UI generator reuses it as
the skeleton of the real test:

```ts
// discovery/walks/generate-api-key.walk.ts
export const walk: Walk = {
  id: 'SEQ-002',
  title: 'Generate an API key for an endpoint',
  tenant: 'a',
  steps: [
    { screen: 'endpoint-list',   do: (p) => p.goto('/endpoints') },
    { screen: 'endpoint-detail', do: (p) => p.getByRole('link', { name: qaEndpoint }).click() },
    { screen: 'generate-key',    do: (p) => p.getByRole('button', { name: /generate key/i }).click() },
  ],
};
```

Each step writes `artifacts/<walk>/screens/<SEQ>-<step>-<screen>.png`,
the DOM field dump, and the network slice for that step — so every
request can be traced back to the click that caused it.
`artifacts/` is gitignored; screenshots that become evidence are copied
into `docs/discovery/screens/`.

### First-time setup (whoever creates `automation/` runs this once)

```bash
cd automation
npm init -y
npm i -D @playwright/test typescript tsx @types/node dotenv ajv ajv-formats @faker-js/faker \
  eslint typescript-eslint
npx playwright install chromium
```

- `config/env.ts` starts with `dotenv.config({ path: path.resolve(__dirname, '../../.env') })`
  — the single `.env` at the project root. Never a second `.env` inside `automation/`.
- Commit `package-lock.json`; teammates then run `npm ci`.
- ESLint uses the **flat config** file `eslint.config.mjs` (current ESLint
  ignores `.eslintrc.*`):
  ```js
  import tseslint from 'typescript-eslint';
  export default tseslint.config(...tseslint.configs.recommended,
    { ignores: ['reports/**', 'test-results/**'] });
  ```

## 2. The POM rule — three layers, each with one job

| Layer | Job | Never |
|---|---|---|
| **Locators / Schemas** | WHERE things are (selectors) / WHAT shape data has (schemas) | No logic |
| **Pages / Clients** | HOW to do one business action (`createEndpoint(name)`, `revokeKey(id)`) | No `expect()` assertions |
| **Tests** | WHAT to check — call pages/clients, then `expect()` | No selectors, no raw `page.click`, no raw `request.get` |

```ts
// ui/locators/endpoint.locators.ts
export const endpointLocators = {
  createButton: '[data-testid="create-endpoint"]',
  nameInput: '[data-testid="endpoint-name"]',
  saveButton: '[data-testid="save-endpoint"]',
  successToast: '[data-testid="toast-success"]',
} as const;

// ui/pages/EndpointPage.ts
export class EndpointPage {
  readonly createButton: Locator;
  readonly nameInput: Locator;
  readonly saveButton: Locator;
  readonly successToast: Locator;

  constructor(private readonly page: Page) {
    this.createButton = page.locator(endpointLocators.createButton);
    this.nameInput = page.locator(endpointLocators.nameInput);
    this.saveButton = page.locator(endpointLocators.saveButton);
    this.successToast = page.locator(endpointLocators.successToast);
  }

  async createEndpoint(name: string): Promise<void> {
    await this.createButton.click();
    await this.nameInput.fill(name);
    await this.saveButton.click();
  }
}

// api/clients/PlatformClient.ts
export class PlatformClient extends BaseClient {
  async createApiKey(endpointId: string): Promise<ApiResponse<ApiKey>> {
    return this.post<ApiKey>(`/endpoints/${endpointId}/keys`);
  }
}

// tests/e2e/endpoint-flow.e2e.spec.ts
test('[TC-001] create endpoint in UI and call it with a new key',
  { tag: ['@P0', '@F-001', '@mod-endpoints', '@flow-1', '@e2e', '@smoke'] },
  async ({ endpointPage, platform, endpointCaller, qaName }) => {
  await endpointPage.createEndpoint(qaName);
  await expect(endpointPage.successToast).toBeVisible();

  const key = await platform.createApiKeyFor(qaName);
  const response = await endpointCaller.call(qaName, key.value);
  expect(response.status).toBe(200);
});
```

### Database layer — same three layers, read-only

| Layer | Job | Never |
|---|---|---|
| `db/catalog.ts` | WHAT EXISTS — tables, columns, keys, read from `information_schema` once per run | No assumptions about a schema file |
| `db/tracer.ts` | WHERE a `qa-` value landed — locate table+column, walk FKs, diff one row by primary key | No whole-table scans |
| `db/queries/` | WHAT to read — one named SELECT with `$1`-style parameters | No INSERT/UPDATE/DELETE/DDL, no string-built SQL |
| `db/DbVerifier.ts` | HOW to answer a business question (`endpointRow('qa-tc001-…')`) | No `expect()` |
| Tests | WHAT to check — `expect(await db.endpointRow(name)).toMatchObject({ tenant: 'qa-tenant-a' })` | No raw SQL |

Read-only is enforced three times: the DB user has SELECT rights only,
`DbClient` opens every query in a read-only transaction, and `DbClient`
rejects any statement that does not start with `SELECT`.

Driver by `DB_TYPE`: `postgres` → `pg`, `mysql` → `mysql2`, `mssql` →
`mssql` (install only the one needed).

DB steps inside API/E2E tests go through `db.check(...)`. When `DB_TYPE`
is empty it skips ONLY that step (annotation "DB check skipped — DB
pending"), so the API/UI part of the test still runs. Standalone
`tests/db/` specs skip whole with `test.skip(!ENV.dbType, 'DB pending')`.

```ts
// inside an existing API test — after the action, check the DB
test('[TC-001] create endpoint stores it for the right tenant',
  { tag: ['@P0', '@F-001', '@mod-endpoints', '@flow-1', '@db'] },
  async ({ platform, db, qaName }) => {
    await platform.createEndpoint(qaName);

    await db.check('endpoint row saved for qa-tenant-a', async (verify) => {
      expect(await verify.endpointRow(qaName)).toMatchObject({ name: qaName, tenant: 'qa-tenant-a' });
    });
  });
```

## 3. TypeScript rules

- `strict: true`; ES modules (`import`/`export`); no `require`.
- No `any` — use a type from `types/`, or `unknown` + a check.
- Every client method returns a typed result: `Promise<ApiResponse<T>>`.
- `npm run typecheck` and `npm run lint` must pass before any test run.

## 4. Test rules (UI and API)

- **Title starts with the TC ID:** `test('[TC-014] revoked key returns 401', ...)`.
- **Tags copy the test case's columns** so any subset can be run:
  `{ tag: ['@P0', '@F-003', '@mod-keys', '@flow-3', '@E2E-03', '@e2e', '@smoke'] }`
  — priority, each Req ID's feature, module, flow step(s), E2E scenario
  (if any), type, and `@smoke` for the smoke set.
- **Fixtures create and clean data.** `baseTest.ts` gives each test a
  unique `qaName` and tracks everything it creates; teardown deletes it
  (key first, then endpoint) even when the test fails.
- **Test data comes from `test-data/` via `utils/testData.ts`** — never
  typed into a test. Data-driven cases loop over `dataFor('TC-005')`,
  one `test()` per record, title `[TC-005] <DAT id> <short value>`.
  The loader fills the data factory's patterns at runtime: `{qa-name}`
  → `qa-tc014-lz3k9a-w2-x7f1` (test case, time in base-36 ms, `test.info().workerIndex`,
  4 random characters — unique even across parallel workers and
  `--repeat-each` copies), `{repeat:k:41}` → 41 × "k", and
  `{faker:<method>}` → `@faker-js/faker` seeded with the TC number, so
  the value is realistic but identical on every run.
- **Setup through API clients, not the UI.** Only the step under test
  uses the UI.
- **Waits are conditions, never time:** `expect().toBeVisible()`,
  `waitForResponse`, `expect.poll()`. `waitForTimeout` and `setTimeout`
  are forbidden.
- **Key-dead checks:** `expect.poll(() => caller.status(key), { timeout: ENV.keyRevocationMaxMs }).toBe(401)`.
  Such a test starts with `test.setTimeout(ENV.keyRevocationMaxMs + 60_000)`,
  is tagged `@slow`, and is never `@smoke`. It first proves the key works (200).
- **Never expect 5xx.** Cross-tenant status comes from `ENV.crossTenantStatus`.
- **Tests that need an undecided value skip themselves**, e.g.
  `test.skip(!ENV.keyRevocationMaxMs, 'Waiting for product: revocation delay (Q-…)')`
  — the rest of the suite still runs.
- **Schema check on every API response** via `schemaValidator`.
- One scenario per test; no `if/else` in tests; keep tests ≤ 15 lines.
- No hardcoded URLs or secrets; no commented-out code, `console.log`,
  or unused code.

## 5. Selectors (UI)

Take them from the discovery artifacts — the DOM dump recorded while
walking the real app, so they are already verified. If one is missing,
check the live page, then report it so the event definition gains it.
Never guess. Priority: `data-testid` → id → role/label (`getByRole`,
`getByLabel`) → stable class → text (last resort).

When a selector breaks later, the healer updates it in ONE place
(`ui/locators/`) and records the change so discovery stays true.

## 6. Config (`playwright.config.ts`)

- Projects: `api` (`tests/api`, no browser), `db` (`tests/db`, no browser),
  `ui` and `e2e` (Desktop Chrome; firefox/webkit present but commented out).
  Each script runs one project: `test:api` → `--project=api`, and so on.
- timeout 60s (key-dead tests raise their own — see section 4), expect 10s, `fullyParallel: true`, `retries: process.env.CI ? 2 : 0`.
- Reporter: list + HTML to `reports/html` (`open: 'never'`).
- Screenshot, trace, **and video** on failure → `reports/artifacts`
  (`screenshot: 'only-on-failure'`, `trace: 'retain-on-failure'`,
  `video: 'retain-on-failure'`). The healer diagnoses from these: a
  failure with no video is one somebody has to reproduce by hand.
- `baseURL` from ENV; `ignoreHTTPSErrors: true` for the test environment.

## 7. Commands

| Goal | Command (in `automation/`) |
|---|---|
| Walk the app (discovery) | `npm run discover -- walks/<name>.walk.ts` |
| All tests | `npm test` |
| API only / UI only / E2E only | `npm run test:api` / `test:ui` / `test:e2e` |
| Smoke only | `npx playwright test --grep @smoke` |
| One test case | `npx playwright test --grep "TC-014"` |
| Several test cases | `npx playwright test --grep "TC-014\|TC-020"` |
| A feature / a priority | `npx playwright test --grep @F-003` / `--grep @P0` |
| A module / a flow step | `npx playwright test --grep @mod-keys` / `--grep @flow-3` |
| DB integrity checks only (`tests/db/`) | `npm run test:db` |
| Everything that touches the DB (integrity + API/E2E tests with DB steps) | `npx playwright test --grep @db` |
| Both (AND) | `npx playwright test --grep "(?=.*@F-003)(?=.*@P0)"` |
| Stability gate | `npx playwright test --repeat-each=3` |
| Open report | `npm run report` |
