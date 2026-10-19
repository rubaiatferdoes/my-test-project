import { ENV } from '../../config/env.js';

export interface DbTraceResult {
  readonly skipped: boolean;
  readonly reason?: string;
  readonly rows?: Record<string, unknown>[];
}

/**
 * Read-only tracer lookup for the walk. Skipped entirely when DB_TYPE is empty.
 * Only SELECT statements are allowed - the application is the only writer
 * (CLAUDE.md section 4).
 */
export async function traceSelect(sql: string, params: unknown[] = []): Promise<DbTraceResult> {
  if (!ENV.dbType) return { skipped: true, reason: 'DB_TYPE empty - DB trace skipped' };
  if (ENV.dbType !== 'postgres') {
    return { skipped: true, reason: `DB_TYPE ${ENV.dbType} has no driver installed in the discovery harness` };
  }
  if (!/^\s*select\s/i.test(sql)) throw new Error('Discovery DB trace accepts SELECT statements only');

  const { default: pg } = await import('pg');
  const [hostPort, database] = ENV.dbUrl.split('/');
  const [host, port] = hostPort.split(':');
  const client = new pg.Client({
    host,
    port: Number(port ?? '5432'),
    database,
    user: ENV.dbUser,
    password: ENV.dbPassword,
  });

  try {
    await client.connect();
    await client.query('BEGIN TRANSACTION READ ONLY');
    const result = await client.query(sql, params);
    await client.query('COMMIT');
    return { skipped: false, rows: result.rows as Record<string, unknown>[] };
  } catch (error) {
    return { skipped: true, reason: `DB trace failed: ${(error as Error).message}` };
  } finally {
    await client.end().catch(() => undefined);
  }
}
