import { BaseClient } from './BaseClient.js';
import type { RequestOptions } from './BaseClient.js';
import type { ApiResponse, LoginRequest, LoginResponse, UserAccount } from '../../types/api.js';

/**
 * Sign-in and the signed-in profile (EVT-001..004, auth.events.md).
 * `username`/`password` are typed as `string` but several approved cases
 * (TC-002, TC-003) deliberately send empty strings or boundary lengths —
 * never coerced or validated client-side, so the bad value reaches the
 * route exactly as the test case built it.
 */
export class AuthClient extends BaseClient {
  /** POST /api/authenticate — EVT-003. */
  async authenticate(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return this.post<LoginResponse>('/authenticate', credentials);
  }

  /** GET /api/account — EVT-003's second call; also used by TC-005/TC-014's auth checks. */
  async getAccount(opts?: RequestOptions): Promise<ApiResponse<UserAccount>> {
    return this.get<UserAccount>('/account', opts);
  }
}
