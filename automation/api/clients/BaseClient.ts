import type { APIRequestContext } from '@playwright/test';
import type { ApiResponse } from '../../types/api.js';

/**
 * Per-call auth control. `token` is the common case (becomes
 * `Authorization: Bearer <token>`). `authorizationHeader` lets a test send
 * the EXACT header value TC-005 needs (empty, malformed, wrong place) —
 * set it to `null` to omit the header entirely. If both are omitted, no
 * Authorization header is sent.
 */
export interface AuthOverride {
  readonly token?: string;
  readonly authorizationHeader?: string | null;
}

export interface RequestOptions extends AuthOverride {
  readonly query?: Record<string, string>;
  readonly headers?: Record<string, string>;
}

/**
 * WHERE/HOW every API call goes out: headers, auth, JSON parsing, and a
 * typed envelope. No assertions here — that is the tests' job
 * (ts-pom-standards layer rule).
 */
export class BaseClient {
  constructor(
    protected readonly request: APIRequestContext,
    protected readonly baseUrl: string,
  ) {}

  private buildUrl(path: string, query?: Record<string, string>): string {
    const url = new URL(path.replace(/^\//, ''), `${this.baseUrl.replace(/\/$/, '')}/`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        url.searchParams.set(key, value);
      }
    }
    return url.toString();
  }

  private buildHeaders(opts?: RequestOptions): Record<string, string> {
    const headers: Record<string, string> = { ...opts?.headers };
    if (opts?.authorizationHeader !== undefined) {
      if (opts.authorizationHeader !== null) {
        headers.Authorization = opts.authorizationHeader;
      }
    } else if (opts?.token !== undefined) {
      headers.Authorization = `Bearer ${opts.token}`;
    }
    return headers;
  }

  private async toApiResponse<T>(response: {
    status(): number;
    ok(): boolean;
    headers(): Record<string, string>;
    text(): Promise<string>;
  }): Promise<ApiResponse<T>> {
    const rawText = await response.text();
    let body: T;
    try {
      body = rawText.length > 0 ? (JSON.parse(rawText) as T) : (undefined as T);
    } catch {
      body = (rawText as unknown) as T;
    }
    return {
      status: response.status(),
      ok: response.ok(),
      headers: response.headers(),
      body,
      rawText,
    };
  }

  protected async get<T>(path: string, opts?: RequestOptions): Promise<ApiResponse<T>> {
    const response = await this.request.get(this.buildUrl(path, opts?.query), {
      headers: this.buildHeaders(opts),
    });
    return this.toApiResponse<T>(response);
  }

  protected async post<T>(path: string, data?: unknown, opts?: RequestOptions): Promise<ApiResponse<T>> {
    const response = await this.request.post(this.buildUrl(path, opts?.query), {
      headers: { 'Content-Type': 'application/json', ...this.buildHeaders(opts) },
      data,
    });
    return this.toApiResponse<T>(response);
  }

  protected async put<T>(path: string, data?: unknown, opts?: RequestOptions): Promise<ApiResponse<T>> {
    const response = await this.request.put(this.buildUrl(path, opts?.query), {
      headers: { 'Content-Type': 'application/json', ...this.buildHeaders(opts) },
      data,
    });
    return this.toApiResponse<T>(response);
  }

  protected async delete<T>(path: string, opts?: RequestOptions): Promise<ApiResponse<T>> {
    const response = await this.request.delete(this.buildUrl(path, opts?.query), {
      headers: this.buildHeaders(opts),
    });
    return this.toApiResponse<T>(response);
  }
}
