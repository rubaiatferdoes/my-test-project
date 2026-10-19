import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));

/** The single source of truth for secrets and URLs: the project-root .env. */
dotenv.config({ path: path.resolve(here, '../../.env') });

const missing: string[] = [];

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    missing.push(name);
    return '';
  }
  return value;
}

function optional(name: string, fallback = ''): string {
  return process.env[name]?.trim() ?? fallback;
}

export interface TenantCredentials {
  readonly key: 'a' | 'b';
  readonly user: string;
  readonly password: string;
}

const baseUrl = required('TEST_ENV_BASE_URL');
const apiUrl = required('TEST_ENV_API_URL');

const tenants: Record<'a' | 'b', TenantCredentials> = {
  a: { key: 'a', user: required('QA_TENANT_A_USER'), password: required('QA_TENANT_A_PASSWORD') },
  b: { key: 'b', user: required('QA_TENANT_B_USER'), password: required('QA_TENANT_B_PASSWORD') },
};

if (missing.length > 0) {
  throw new Error(
    `Missing required environment values: ${missing.join(', ')}. ` +
      'Copy .env.example to .env and run /setup:env-readiness.',
  );
}

/** Hosts discovery is allowed to navigate to. Empty DISCOVERY_ALLOWED_HOSTS = the base URL host only. */
const configuredHosts = optional('DISCOVERY_ALLOWED_HOSTS')
  .split(',')
  .map((h) => h.trim())
  .filter((h) => h.length > 0);

export const ENV = {
  baseUrl,
  apiUrl,
  swaggerUrl: optional('TEST_ENV_SWAGGER_URL'),
  tenants,
  allowedHosts: configuredHosts.length > 0 ? configuredHosts : [new URL(baseUrl).host],
  headed: optional('DISCOVERY_HEADED', 'false').toLowerCase() === 'true',
  quotaProbeCap: Number(optional('DISCOVERY_QUOTA_PROBE_CAP', '25')),
  dbType: optional('DB_TYPE'),
  dbUrl: optional('DB_URL'),
  dbUser: optional('DB_READONLY_USER'),
  dbPassword: optional('DB_READONLY_PASSWORD'),
  dbSchema: optional('DB_SCHEMA', 'public'),
} as const;

export function tenantOf(key: 'a' | 'b'): TenantCredentials {
  return ENV.tenants[key];
}

/** Guard from CLAUDE.md section 5: a walk never leaves the test environment. */
export function assertAllowedUrl(target: string): void {
  const url = new URL(target, ENV.baseUrl);
  if (!ENV.allowedHosts.includes(url.host)) {
    throw new Error(
      `Blocked navigation to ${url.host}. Allowed hosts: ${ENV.allowedHosts.join(', ')}`,
    );
  }
}
