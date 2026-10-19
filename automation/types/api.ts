/**
 * Shapes confirmed by calling the real routes while building the clients
 * (ts-pom-standards "Clients first") — the event definitions recorded most
 * of these as UNKNOWN because the browser's SPA navigation aborted the
 * body read (Q-003, Q-013, Q-014). Calling the route directly resolved
 * them; see the generator's report for what changed.
 */

export interface ApiResponse<T> {
  readonly status: number;
  readonly ok: boolean;
  readonly headers: Record<string, string>;
  readonly body: T;
  /** Raw text, kept alongside `body` for responses that aren't valid JSON. */
  readonly rawText: string;
}

/** POST /api/authenticate request body. Loosely typed on purpose — several
 * negative cases (TC-002, TC-003) send empty strings or boundary lengths,
 * never a wrong JS type. */
export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

/** Confirmed by calling POST /api/authenticate directly — resolves Q-003. */
export interface LoginResponse {
  id_token: string;
}

/** GET /api/account — the signed-in user's own profile (EVT-003). */
export interface UserAccount {
  activated: boolean;
  authorities: string[];
  createdBy: string | null;
  createdDate: string | null;
  email: string;
  firstName: string;
  id: number;
  imageUrl: string;
  langKey: string;
  lastModifiedBy: string | null;
  lastModifiedDate: string | null;
  lastName: string;
  login: string;
}

/** GET /api/users — confirmed shape: just id + login (TC-014). */
export interface UserSummary {
  id: number;
  login: string;
}

/** The nested owner object the list/detail/create routes embed when a
 * bank account has an owner (EVT-005 finding: full profile, not just an id). */
export interface BankAccountOwner {
  id: number;
  login: string;
  [key: string]: unknown;
}

/**
 * Create/update payload. Loosely typed on purpose: several approved cases
 * are built to send the WRONG shape on purpose (string balances, a forged
 * id, a forged owner) — CLAUDE.md's VAL- `client`/`none` cases must reach
 * the route unmodified, so the client must not coerce or reject them.
 */
export interface BankAccountPayload {
  id?: number | string | null;
  name?: string | null;
  balance?: number | string | null;
  user?: { id: number; login?: string } | null;
}

/** GET/POST response shape for a bank account. */
export interface BankAccount {
  id: number;
  name: string;
  balance: number | string | null;
  operations: unknown[] | null;
  user: BankAccountOwner | null;
}

/** One field-level validation failure, from the JHipster "constraint
 * violation" problem type. */
export interface FieldError {
  objectName: string;
  field: string;
  message: string;
}

/**
 * The app's error envelope (RFC 7807 problem+json, JHipster's
 * ExceptionTranslator). `fieldErrors` is only present on 400 validation
 * failures; `detail` carries 500 leak content on today's unfixed bugs
 * (TC-015) — never assert on a 500's `detail` as a passing expectation.
 */
export interface ErrorResponse {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  message?: string;
  path?: string;
  fieldErrors?: FieldError[];
}
