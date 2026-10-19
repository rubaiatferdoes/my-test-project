import type { Page, Request, Response } from '@playwright/test';
import type { NetworkEntry } from '../../types/discovery.js';

const BODY_LIMIT = 4000;
const SECRET_KEYS = /("(?:password|id_token|access_token|token|authorization)"\s*:\s*")([^"]*)(")/gi;

/** JWTs and passwords are secrets (CLAUDE.md section 4): keep head and tail only. */
export function maskSecrets(text: string | null): string | null {
  if (text === null) return null;
  return text
    .replace(SECRET_KEYS, (_m, k: string, v: string, q: string) => `${k}${maskValue(v)}${q}`)
    .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, (t) => maskValue(t));
}

function maskValue(value: string): string {
  if (value.length <= 8) return '***';
  return `${value.slice(0, 3)}...${value.slice(-4)}`;
}

export class NetworkRecorder {
  private buffer: NetworkEntry[] = [];
  private readonly all: NetworkEntry[] = [];
  private readonly started = new Map<Request, number>();
  /** One entry per Request: a request can fire both 'response' and a late 'requestfailed'. */
  private readonly seen = new Map<Request, NetworkEntry>();
  private step = 0;
  private screen = 'before-first-step';

  constructor(private readonly page: Page, private readonly baseUrl: string) {
    this.page.on('request', (request) => this.started.set(request, Date.now()));
    this.page.on('response', (response) => void this.onResponse(response));
    this.page.on('requestfailed', (request) => this.onFailed(request));
  }

  mark(step: number, screen: string): void {
    this.step = step;
    this.screen = screen;
  }

  private route(url: string): string {
    return url.startsWith(this.baseUrl) ? url.slice(this.baseUrl.length) : url;
  }

  private async onResponse(response: Response): Promise<void> {
    const request = response.request();
    const start = this.started.get(request);
    // Register the entry synchronously: a late 'requestfailed' for the same
    // request must find it, otherwise one call is recorded twice.
    const entry: NetworkEntry = {
      step: this.step,
      screen: this.screen,
      method: request.method(),
      url: request.url(),
      route: this.route(request.url()),
      requestBody: maskSecrets(request.postData()),
      status: response.status(),
      statusText: response.statusText(),
      responseBody: null,
      durationMs: start ? Date.now() - start : null,
      failure: null,
    };
    this.push(request, entry);

    const contentType = response.headers()['content-type'] ?? '';
    if (!/json|text|html|xml/.test(contentType)) return;
    try {
      entry.responseBody = maskSecrets((await response.text()).slice(0, BODY_LIMIT));
    } catch (error) {
      entry.responseBody = null;
      entry.bodyUnavailable = (error as Error).message.split(String.fromCharCode(10))[0];
    }
  }

  private onFailed(request: Request): void {
    const existing = this.seen.get(request);
    if (existing) {
      // The response was already recorded; the abort only hit the body read.
      existing.failure = request.failure()?.errorText ?? 'request failed';
      return;
    }
    this.push(request, {
      step: this.step,
      screen: this.screen,
      method: request.method(),
      url: request.url(),
      route: this.route(request.url()),
      requestBody: maskSecrets(request.postData()),
      status: null,
      statusText: '',
      responseBody: null,
      durationMs: null,
      failure: request.failure()?.errorText ?? 'request failed',
    });
  }

  private push(request: Request, entry: NetworkEntry): void {
    this.seen.set(request, entry);
    this.buffer.push(entry);
    this.all.push(entry);
  }

  /** Everything seen since the previous flush - the slice belonging to one step. */
  flush(): NetworkEntry[] {
    const slice = this.buffer;
    this.buffer = [];
    return slice;
  }

  everything(): NetworkEntry[] {
    return this.all;
  }
}
