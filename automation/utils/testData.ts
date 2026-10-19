import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { faker } from '@faker-js/faker';

const here = path.dirname(fileURLToPath(import.meta.url));
const testDataDir = path.resolve(here, '../../test-data');

/** One row from `test-data/*.json` (data-factory's output — never edited here). */
export interface DatRecord {
  readonly id: string;
  readonly field: string;
  readonly value: unknown;
  readonly expected: string;
  readonly rule: string;
  readonly used_by: string[];
}

function loadFile(name: string): DatRecord[] {
  const raw = fs.readFileSync(path.join(testDataDir, name), 'utf-8');
  return JSON.parse(raw) as DatRecord[];
}

const allRecords: DatRecord[] = [
  ...loadFile('valid-data.json'),
  ...loadFile('negative-data.json'),
  ...loadFile('security-data.json'),
];

/** Context a pattern needs to fill itself in uniquely per test/worker. */
export interface FillContext {
  readonly tcId: string;
  readonly workerIndex: number;
}

/** `qa-<tc>-<time base36>-w<worker>-<4 random chars>` (ts-pom-standards). */
export function uniqueQaName(tcId: string, workerIndex: number): string {
  const tc = tcId.toLowerCase().replace(/[^a-z0-9]/g, '');
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 6);
  return `qa-${tc}-${time}-w${workerIndex}-${random}`;
}

function qaNameFor(ctx: FillContext): string {
  return uniqueQaName(ctx.tcId, ctx.workerIndex);
}

/** Seeded on the TC number so a `{faker:...}` value is realistic but
 * identical on every run (ts-pom-standards). */
function fakerSeedFor(ctx: FillContext): number {
  const digits = ctx.tcId.replace(/\D/g, '');
  return digits.length > 0 ? Number(digits) : 1;
}

function resolveFakerMethod(dotted: string): () => unknown {
  let node: unknown = faker;
  for (const segment of dotted.split('.')) {
    if (typeof node !== 'object' || node === null) {
      throw new Error(`Unknown faker method: ${dotted}`);
    }
    node = (node as Record<string, unknown>)[segment];
  }
  if (typeof node !== 'function') {
    throw new Error(`Unknown faker method: ${dotted}`);
  }
  return node as () => unknown;
}

/**
 * Fills `{qa-name}`, `{repeat:k:41}` and `{faker:<method>}` placeholders.
 * Anything else (literal booleans, numbers, attack strings, the
 * "RUNTIME — built by the fixture" prose on DAT-039/DAT-041) passes
 * through unchanged — those two are never auto-filled, the test builds
 * the real token itself (see tests/api/auth.api.spec.ts).
 */
export function fillPatterns(value: unknown, ctx: FillContext): unknown {
  if (typeof value === 'string') {
    if (value === '{qa-name}') return qaNameFor(ctx);

    const repeatMatch = /^\{repeat:(.+):(\d+)\}$/.exec(value);
    if (repeatMatch) return repeatMatch[1].repeat(Number(repeatMatch[2]));

    const fakerMatch = /^\{faker:([\w.]+)\}$/.exec(value);
    if (fakerMatch) {
      faker.seed(fakerSeedFor(ctx));
      return resolveFakerMethod(fakerMatch[1])();
    }

    return value;
  }
  if (Array.isArray(value)) return value.map((item) => fillPatterns(item, ctx));
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      result[key] = fillPatterns(nested, ctx);
    }
    return result;
  }
  return value;
}

/** One record by its DAT id. Throws if the id doesn't exist — a typo here
 * should fail the test, not silently run with `undefined`. */
export function getData(datId: string): DatRecord {
  const found = allRecords.find((record) => record.id === datId);
  if (!found) {
    throw new Error(`No test-data record ${datId}`);
  }
  return found;
}

/** Every record a test case's `data:` front matter lists, in file order. */
export function dataFor(tcId: string): DatRecord[] {
  return allRecords.filter((record) => record.used_by.includes(tcId));
}

/** `getData(datId).value`, with placeholders filled for this test/worker. */
export function filledValue(datId: string, ctx: FillContext): unknown {
  return fillPatterns(getData(datId).value, ctx);
}
