/**
 * Cleanup for the validation probes (CLAUDE.md sections 4 and 5, and the
 * explicit instruction in this run's task to delete everything the probes
 * created).
 *
 * Deletes ONLY the ids this run created. The two rows left by the SEQ-002 walk
 * (1002, 1003) are not touched: they belong to another walk and Q-004 is still
 * open. Nothing that was not created by these probes is deleted.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENV, tenantOf } from '../../config/env.js';
import { traceSelect } from '../recorders/dbTrace.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, '../artifacts/val-cleanup');

/** Every id created by the three probe runs, with the probe that made it. */
const MINE: { id: number; why: string }[] = [
  { id: 1004, why: 'UI duplicate-probe source' },
  { id: 1005, why: 'UI duplicate-probe copy' },
  { id: 1007, why: 'UI unicode probe' },
  { id: 1008, why: 'UI XSS probe' },
  { id: 1009, why: 'UI SQL probe' },
  { id: 1010, why: 'UI double-submit probe' },
  { id: 1011, why: 'API empty-string name' },
  { id: 1012, why: 'API whitespace-only name' },
  { id: 1013, why: 'API one-character name' },
  { id: 1014, why: 'API leading/trailing spaces name' },
  { id: 1015, why: 'API 255-character name' },
  { id: 1017, why: 'API negative balance' },
  { id: 1018, why: 'API 3-decimal balance' },
  { id: 1023, why: 'API SQL injection name' },
  { id: 1024, why: 'API path traversal name' },
  { id: 1025, why: 'API forged owner (tenant b)' },
  ...Array.from({ length: 25 }, (_, i) => ({ id: 1026 + i, why: 'quota probe' })),
];

async function token(): Promise<string> {
  const t = tenantOf('a');
  const response = await fetch(`${ENV.apiUrl}/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: t.user, password: t.password, rememberMe: false }),
  });
  const data = (await response.json()) as { id_token?: string };
  if (!data.id_token) throw new Error('No token');
  return data.id_token;
}

async function main(): Promise<void> {
  fs.mkdirSync(outDir, { recursive: true });
  const jwt = await token();
  const results: { id: number; why: string; status: number }[] = [];

  for (const record of MINE) {
    const response = await fetch(`${ENV.apiUrl}/bank-accounts/${record.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${jwt}` },
    });
    results.push({ ...record, status: response.status });
  }

  const failed = results.filter((r) => r.status !== 204);
  console.log(`deleted ${results.length - failed.length}/${results.length}`);
  for (const f of failed) console.log(`  NOT DELETED: ${f.id} (${f.why}) -> ${f.status}`);

  // Read-only confirmation: nothing of this run is left behind.
  const left = await traceSelect(
    `SELECT id, name, balance, user_id FROM bank_account
     WHERE id BETWEEN 1004 AND 1060 ORDER BY id`,
  );
  console.log('\nrows left in the 1004-1060 range:');
  if (left.rows) {
    if (left.rows.length === 0) console.log('  none');
    for (const row of left.rows) console.log(`  ${String(row.id)} | ${JSON.stringify(row.name)}`);
  } else {
    console.log(`  DB check skipped: ${left.reason ?? ''}`);
  }

  const qaRows = await traceSelect(
    `SELECT id, name FROM bank_account WHERE name LIKE 'qa-%' OR name LIKE '%qa-%' ORDER BY id`,
  );
  console.log('\nall qa- rows still in the table:');
  for (const row of qaRows.rows ?? []) console.log(`  ${String(row.id)} | ${JSON.stringify(row.name)}`);

  fs.writeFileSync(
    path.join(outDir, 'cleanup.json'),
    JSON.stringify({ results, left: left.rows ?? left.reason, qaRows: qaRows.rows ?? qaRows.reason }, null, 2),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
