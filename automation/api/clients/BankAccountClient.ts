import { BaseClient } from './BaseClient.js';
import type { RequestOptions } from './BaseClient.js';
import type { ApiResponse, BankAccount, BankAccountPayload } from '../../types/api.js';

/**
 * `/api/bank-accounts` (EVT-005..008, accounts.events.md). One method per
 * route; no assertions here. `list`/`getById` accept raw query/auth
 * overrides so TC-005's token-in-URL and malformed-header rows can reach
 * the same route a normal call uses.
 */
export class BankAccountClient extends BaseClient {
  /** GET /api/bank-accounts?eagerload=true&sort=id,asc — EVT-005. */
  async list(opts?: RequestOptions): Promise<ApiResponse<BankAccount[]>> {
    return this.get<BankAccount[]>('/bank-accounts', {
      ...opts,
      query: { eagerload: 'true', sort: 'id,asc', ...opts?.query },
    });
  }

  /** GET /api/bank-accounts/{id} — EVT-008. */
  async getById(id: number | string, opts?: RequestOptions): Promise<ApiResponse<BankAccount>> {
    return this.get<BankAccount>(`/bank-accounts/${id}`, opts);
  }

  /** POST /api/bank-accounts — EVT-007. */
  async create(payload: BankAccountPayload, opts?: RequestOptions): Promise<ApiResponse<BankAccount>> {
    return this.post<BankAccount>('/bank-accounts', payload, opts);
  }

  /**
   * DELETE /api/bank-accounts/{id} — not in an approved event definition
   * (journey step 7 is BLOCKED, Q-022). Confirmed by calling it directly
   * while building this client: 204, then a GET on the same id returns
   * 404. Used ONLY for fixture cleanup, never asserted on by a test —
   * see the generator's report.
   */
  async remove(id: number | string, opts?: RequestOptions): Promise<ApiResponse<unknown>> {
    return super.delete(`/bank-accounts/${id}`, opts);
  }
}
