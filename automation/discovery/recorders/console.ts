import type { Page } from '@playwright/test';
import type { ConsoleEntry } from '../../types/discovery.js';
import { maskSecrets } from './network.js';

export class ConsoleRecorder {
  private readonly entries: ConsoleEntry[] = [];
  private step = 0;

  constructor(page: Page) {
    page.on('console', (message) => {
      const level = message.type();
      if (level !== 'error' && level !== 'warning') return;
      const location = message.location();
      this.entries.push({
        step: this.step,
        kind: 'console',
        level,
        text: maskSecrets(message.text()) ?? '',
        location: location.url ? `${location.url}:${location.lineNumber}` : null,
      });
    });

    page.on('pageerror', (error) => {
      this.entries.push({
        step: this.step,
        kind: 'pageerror',
        level: 'error',
        text: maskSecrets(error.message) ?? '',
        location: null,
      });
    });

    page.on('requestfailed', (request) => {
      this.entries.push({
        step: this.step,
        kind: 'requestfailed',
        level: 'error',
        text: `${request.method()} ${request.url()} - ${request.failure()?.errorText ?? 'failed'}`,
        location: null,
      });
    });
  }

  mark(step: number): void {
    this.step = step;
  }

  everything(): ConsoleEntry[] {
    return this.entries;
  }
}
