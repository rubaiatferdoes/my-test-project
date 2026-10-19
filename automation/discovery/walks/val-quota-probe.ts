/**
 * Three things the field probes cannot reach:
 *  1. the owner field with a REAL user id (API3 - can tenant a file an account
 *     under tenant b's user?),
 *  2. the count/quota limit on the only collection in scope - bank accounts
 *     under the signed-in tenant - capped by DISCOVERY_QUOTA_PROBE_CAP,
 *  3. a read-only DB check of what the whitespace and unicode probes stored.
 *
 * Tokens are masked before anything is written or printed.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENV, tenantOf } from '../../config/env.js';
import { traceSelect } from '../recorders/dbTrace.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, '../artifacts/val-quota-probe');

const out: Record<string, unknown> = {};
const createdIds: number[] = [];

function mask(text: string): string {
  return text.replace(/eyJ[\w-]{10,}\.[\w-]+\.[\w-]+/g, (t) => `${t.slice(0, 3)}...${t.slice(-4)}`);
}

async function token(tenant: 'a' | 'b'): Promise<string> {
  const t = tenantOf(tenant);
  const response = await fetch(`${ENV.apiUrl}/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: t.user, password: t.password, rememberMe: false }),
  });
  const data = (await response.json()) as { id_token?: string };
  if (!data.id_token) throw new Error(`No token for tenant ${tenant} (status ${response.status})`);
  return data.id_token;
}

async function post(jwt: string, body: unknown): Promise<{ status: number; text: string; id: number | null }> {
  const response = await fetch(`${ENV.apiUrl}/bank-accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify(body),
  });
  const text = mask((await response.text()).slice(0, 900));
  let id: number | null = null;
  try {
    const parsed = JSON.parse(text) as { id?: number };
    if (response.status === 201 && typeof parsed.id === 'number') {
      id = parsed.id;
      createdIds.push(id);
    }
  } catch {
    /* keep the text */
  }
  return { status: response.status, text, id };
}

async function main(): Promise<void> {
  fs.mkdirSync(outDir, { recursive: true });
  const jwt = await token('a');
  const stamp = Date.now().toString(36);

  // --- 1. Real user ids, then the owner probe --------------------------
  const usersResponse = await fetch(`${ENV.apiUrl}/users`, { headers: { Authorization: `Bearer ${jwt}` } });
  const users = (await usersResponse.json()) as { id: number; login: string }[];
  out.usersVisible = users.map((u) => ({ id: u.id, login: u.login }));
  console.log(`GET /api/users -> ${usersResponse.status}: ${users.map((u) => `${u.id}:${u.login}`).join(', ')}`);

  const tenantB = users.find((u) => u.login === tenantOf('b').user);
  if (tenantB) {
    const forged = await post(jwt, {
      id: null,
      name: `qa-owner-${stamp}-b`,
      balance: 1,
      user: { id: tenantB.id, login: tenantB.login },
    });
    out.forgedOwnerRealId = { sentUserId: tenantB.id, ...forged };
    console.log(`owner forged to tenant b (id ${tenantB.id}) -> ${forged.status} ${forged.text.slice(0, 120)}`);
  }

  // --- 2. The quota probe ----------------------------------------------
  console.log(
    `\nQUOTA PROBE: collection "bank accounts" under parent "tenant a (${tenantOf('a').user})", ` +
      `created one at a time through POST /api/bank-accounts, cap ${ENV.quotaProbeCap}.`,
  );
  const quota: { n: number; status: number; ms: number; body?: string }[] = [];
  let rejectedAt: number | null = null;
  for (let i = 1; i <= ENV.quotaProbeCap; i += 1) {
    const started = Date.now();
    const result = await post(jwt, {
      id: null,
      name: `qa-quota-${stamp}-${String(i).padStart(2, '0')}`,
      balance: 1,
      user: null,
    });
    const ms = Date.now() - started;
    quota.push({ n: i, status: result.status, ms, body: result.status === 201 ? undefined : result.text });
    if (ms > 2000) {
      console.log(`STOP: creation ${i} took ${ms} ms (> 2 s). Pausing the probe and asking before continuing.`);
      break;
    }
    if (result.status !== 201) {
      rejectedAt = i;
      console.log(`rejected at #${i}: ${result.status} ${result.text.slice(0, 200)}`);
      break;
    }
  }
  const slowest = Math.max(...quota.map((q) => q.ms));
  out.quota = {
    collection: 'bank accounts under tenant a',
    cap: ENV.quotaProbeCap,
    created: quota.filter((q) => q.status === 201).length,
    rejectedAt,
    slowestMs: slowest,
    attempts: quota,
  };
  console.log(
    `quota probe finished: ${quota.filter((q) => q.status === 201).length} created, ` +
      `${rejectedAt === null ? 'none rejected at or below the cap' : `rejected at ${rejectedAt}`}, slowest ${slowest} ms`,
  );

  // --- 3. Read-only DB check of what the earlier probes stored ----------
  const db = await traceSelect(
    "SELECT id, name, length(name) AS name_length, balance, user_id FROM bank_account WHERE name LIKE 'qa-%' OR name = '' OR name ~ '^\\s+$' ORDER BY id",
  );
  out.db = db;
  console.log(`\nDB rows matching the probes: ${db.rows ? db.rows.length : `skipped - ${db.reason ?? ''}`}`);
  if (db.rows) {
    for (const row of db.rows.slice(0, 60)) {
      console.log(`  ${String(row.id)} | len ${String(row.name_length)} | ${JSON.stringify(row.name)} | bal ${String(row.balance)} | user ${String(row.user_id)}`);
    }
  }

  fs.writeFileSync(path.join(outDir, 'quota-and-owner.json'), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(outDir, 'created-ids.json'), JSON.stringify(createdIds, null, 2));
  console.log(`\ncreated ids (to clean up): ${createdIds.join(', ') || 'none'}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
