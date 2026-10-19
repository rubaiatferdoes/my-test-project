import { BaseClient } from './BaseClient.js';
import type { RequestOptions } from './BaseClient.js';
import type { ApiResponse, UserSummary } from '../../types/api.js';

/** `/api/users` — used by the create form's owner dropdown (EVT-006) and
 * TC-014's cross-tenant read check. */
export class UsersClient extends BaseClient {
  /** GET /api/users — EVT-006. */
  async list(opts?: RequestOptions): Promise<ApiResponse<UserSummary[]>> {
    return this.get<UserSummary[]>('/users', opts);
  }
}
