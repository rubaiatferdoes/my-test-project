import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

function load(file: string): object {
  return JSON.parse(fs.readFileSync(path.join(here, file), 'utf-8')) as object;
}

export const bankAccountSchema = load('bank-account.schema.json');
export const loginResponseSchema = load('login-response.schema.json');
export const errorResponseSchema = load('error-response.schema.json');
export const userSummarySchema = load('user-summary.schema.json');
