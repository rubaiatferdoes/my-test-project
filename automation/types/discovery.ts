import type { Page } from '@playwright/test';

export type TenantKey = 'a' | 'b';

/** How a walk gets a session before its first step. */
export type LoginMode = 'ui' | 'session' | 'none';

export interface WalkContext {
  /** Values generated for this walk (qa- names, ids read off the screen). */
  readonly data: Record<string, string>;
  /** Records every qa- row the walk created, so cleanup can report on it. */
  track(kind: string, name: string, id?: string): void;
}

export interface WalkStep {
  /** Short screen name used in the screenshot file name. */
  readonly screen: string;
  /** One line: why this control is the one that advances the workflow. */
  readonly why?: string;
  readonly do: (page: Page, ctx: WalkContext) => Promise<unknown>;
}

export interface Walk {
  readonly id: string;
  readonly title: string;
  readonly tenant: TenantKey;
  readonly login?: LoginMode;
  readonly steps: readonly WalkStep[];
}

export interface NetworkEntry {
  readonly step: number;
  readonly screen: string;
  readonly method: string;
  readonly url: string;
  readonly route: string;
  readonly requestBody: string | null;
  readonly status: number | null;
  readonly statusText: string;
  responseBody: string | null;
  /** Set when the body could not be read (e.g. the SPA aborted the read). */
  bodyUnavailable?: string;
  readonly durationMs: number | null;
  /** Mutable: a late abort can attach to an entry whose response was already recorded. */
  failure: string | null;
}

export interface FieldDump {
  readonly tag: string;
  readonly type: string | null;
  readonly name: string | null;
  readonly id: string | null;
  readonly testId: string | null;
  readonly label: string | null;
  readonly placeholder: string | null;
  readonly required: boolean;
  readonly maxLength: string | null;
  readonly minLength: string | null;
  readonly min: string | null;
  readonly max: string | null;
  readonly pattern: string | null;
  readonly value: string | null;
  readonly disabled: boolean;
  readonly options: string[];
}

export interface ControlDump {
  readonly role: string;
  readonly text: string;
  readonly id: string | null;
  readonly testId: string | null;
  readonly href: string | null;
  readonly disabled: boolean;
}

export interface ScreenDump {
  readonly step: number;
  readonly screen: string;
  readonly url: string;
  readonly title: string;
  readonly headings: string[];
  readonly fields: FieldDump[];
  readonly controls: ControlDump[];
  readonly alerts: string[];
  readonly screenshot: string;
  readonly why: string | null;
  readonly elapsedMs: number;
}

export interface ConsoleEntry {
  readonly step: number;
  readonly kind: 'console' | 'pageerror' | 'requestfailed';
  readonly level: string;
  readonly text: string;
  readonly location: string | null;
}
