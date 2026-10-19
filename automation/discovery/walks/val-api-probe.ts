/**
 * Enforcement check for the bank account rules (validation-definition, step 3):
 * every value the UI blocked is sent straight to the API route from the event
 * definition / SEQ-002, with the same tenant-a session.
 *
 * Writes artifacts/val-api-probe/probes.json. Tokens are never printed.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENV, tenantOf } from '../../config/env.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, '../artifacts/val-api-probe');

interface ProbeResult {
  probe: string;
  route: string;
  sent: unknown;
  status: number;
  body: string;
  createdId: number | null;
}

const results: ProbeResult[] = [];
const createdIds: number[] = [];

async function token(): Promise<string> {
  const t = tenantOf('a');
  const response = await fetch(`${ENV.apiUrl}/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: t.user, password: t.password, rememberMe: false }),
  });
  const data = (await response.json()) as { id_token?: string };
  if (!data.id_token) throw new Error(`No token in authenticate response (status ${response.status})`);
  return data.id_token;
}

/** Shortens anything that looks like a JWT before it reaches a file or the console. */
function mask(text: string): string {
  return text.replace(/eyJ[\w-]{10,}\.[\w-]+\.[\w-]+/g, (t) => `${t.slice(0, 3)}...${t.slice(-4)}`);
}

async function probe(jwt: string, name: string, body: unknown, route = '/bank-accounts'): Promise<ProbeResult> {
  const response = await fetch(`${ENV.apiUrl}${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify(body),
  });
  const text = mask((await response.text()).slice(0, 1200));
  let createdId: number | null = null;
  try {
    const parsed = JSON.parse(text) as { id?: number };
    if (response.status === 201 && typeof parsed.id === 'number') {
      createdId = parsed.id;
      createdIds.push(parsed.id);
    }
  } catch {
    /* not JSON - keep the text */
  }
  const result: ProbeResult = {
    probe: name,
    route: `POST /api${route}`,
    sent: JSON.parse(mask(JSON.stringify(body))) as unknown,
    status: response.status,
    body: text,
    createdId,
  };
  results.push(result);
  console.log(
    `${String(response.status).padEnd(4)} ${name.padEnd(34)} ${createdId ? `#${createdId}` : ''} ${text.slice(0, 160)}`,
  );
  return result;
}

/** Same call, but with a hand-written JSON body - some values cannot survive JSON.stringify. */
async function probeRaw(jwt: string, name: string, raw: string, route = '/bank-accounts'): Promise<void> {
  const response = await fetch(`${ENV.apiUrl}${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: raw,
  });
  const text = mask((await response.text()).slice(0, 1200));
  let createdId: number | null = null;
  try {
    const parsed = JSON.parse(text) as { id?: number };
    if (response.status === 201 && typeof parsed.id === 'number') {
      createdId = parsed.id;
      createdIds.push(parsed.id);
    }
  } catch {
    /* not JSON */
  }
  results.push({ probe: name, route: `POST /api${route}`, sent: raw, status: response.status, body: text, createdId });
  console.log(
    `${String(response.status).padEnd(4)} ${name.padEnd(34)} ${createdId ? `#${createdId}` : ''} ${text.slice(0, 160)}`,
  );
}

async function main(): Promise<void> {
  fs.mkdirSync(outDir, { recursive: true });
  const jwt = await token();
  console.log('tenant-a token obtained (masked in every artifact)\n');

  const stamp = Date.now().toString(36);
  const n = (suffix: string): string => `qa-api-${stamp}-${suffix}`;

  // --- Name: required ---------------------------------------------------
  await probe(jwt, 'name missing (key absent)', { id: null, balance: 1, user: null });
  await probe(jwt, 'name null', { id: null, name: null, balance: 1, user: null });
  await probe(jwt, 'name empty string', { id: null, name: '', balance: 1, user: null });
  await probe(jwt, 'name only spaces', { id: null, name: '   ', balance: 1, user: null });
  await probe(jwt, 'name one character', { id: null, name: 'q', balance: 1, user: null });
  await probe(jwt, 'name leading/trailing spaces', { id: null, name: `  ${n('trim')}  `, balance: 1, user: null });

  // --- Name: length. One 5xx is already on record from the UI (256 chars).
  // The skill allows a second 5xx to pin the boundary, then the probe stops.
  await probe(jwt, 'name 255 characters', { id: null, name: `${n('255')}${'k'.repeat(255 - n('255').length)}`, balance: 1, user: null });
  await probe(jwt, 'name 256 characters', { id: null, name: `${n('256')}${'k'.repeat(256 - n('256').length)}`, balance: 1, user: null });

  // --- Balance ----------------------------------------------------------
  await probe(jwt, 'balance missing (key absent)', { id: null, name: n('nobal'), user: null });
  await probe(jwt, 'balance null', { id: null, name: n('nullbal'), balance: null, user: null });
  await probe(jwt, 'balance empty string', { id: null, name: n('emptybal'), balance: '', user: null });
  await probe(jwt, 'balance "12abc"', { id: null, name: n('textbal'), balance: '12abc', user: null });
  await probe(jwt, 'balance -1', { id: null, name: n('negbal'), balance: -1, user: null });
  await probe(jwt, 'balance 1.555 (3 decimals)', { id: null, name: n('dec3'), balance: 1.555, user: null });
  // 1e999 is Infinity in JavaScript and JSON.stringify would turn it into null,
  // so this one goes out as hand-written JSON.
  await probeRaw(jwt, 'balance 1e999', `{"id":null,"name":"${n('1e999')}","balance":1e999,"user":null}`);
  await probe(jwt, 'balance 1e20 (over decimal 21,2)', { id: null, name: n('1e20'), balance: 1e20, user: null });

  // --- Owner (API3: a forged owner in the body) -------------------------
  await probe(jwt, 'user forged = tenant b (user)', {
    id: null,
    name: n('owner-b'),
    balance: 1,
    user: { id: 4, login: 'user' },
  });
  await probe(jwt, 'user forged = id 99999', {
    id: null,
    name: n('owner-ghost'),
    balance: 1,
    user: { id: 99999, login: 'qa-nobody' },
  });

  // --- Client-sent id ---------------------------------------------------
  await probe(jwt, 'id supplied by the client', { id: 424242, name: n('forgedid'), balance: 1, user: null });

  // --- Injection, straight at the API ----------------------------------
  await probe(jwt, 'name SQL injection', { id: null, name: `qa-api-'; DROP TABLE bank_account; --`, balance: 1, user: null });
  await probe(jwt, 'name path traversal', { id: null, name: 'qa-api-../../etc/passwd', balance: 1, user: null });

  fs.writeFileSync(path.join(outDir, 'probes.json'), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(outDir, 'created-ids.json'), JSON.stringify(createdIds, null, 2));
  console.log(`\ncreated ids (to clean up): ${createdIds.join(', ') || 'none'}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
