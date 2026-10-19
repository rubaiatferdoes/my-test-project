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
    let body: string | null = null;
    const contentType = response.headers()['content-type'] ?? '';
    if (/json|text|html|xml/.test(contentType)) {
      try {
        body = (await response.text()).slice(0, BODY_LIMIT);
      } catch {
        body = null;
      }
    }
    this.push({
      step: this.step,
      screen: this.screen,
      method: request.method(),
      url: request.url(),
      route: this.route(request.url()),
      requestBody: maskSecrets(request.postData()),
      status: response.status(),
      statusText: response.statusText(),
      responseBody: maskSecrets(body),
      durationMs: start ? Date.now() - start : null,
      failure: null,
    });
  }

  private onFailed(request: Request): void {
    this.push({
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

  private push(entry: NetworkEntry): void {
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
