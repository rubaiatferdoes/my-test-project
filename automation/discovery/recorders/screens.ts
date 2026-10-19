import path from 'node:path';
import type { Page } from '@playwright/test';
import type { ControlDump, FieldDump, ScreenDump } from '../../types/discovery.js';

interface RawDump {
  headings: string[];
  fields: FieldDump[];
  controls: ControlDump[];
  alerts: string[];
}

/**
 * The page-side reader, kept as a string so the TypeScript loader cannot inject
 * build helpers (__name) into the browser context.
 */
const READ_SCREEN = `(() => {
  const text = (el) => (el.textContent || '').replace(/[ \\t\\n\\r\\f\\v]+/g, ' ').trim();

  const labelFor = (el) => {
    const id = el.getAttribute('id');
    if (id) {
      const label = document.querySelector('label[for="' + CSS.escape(id) + '"]');
      if (label) return text(label);
    }
    const wrapper = el.closest('label');
    return wrapper ? text(wrapper) : null;
  };

  const visible = (el) => {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && (rect.width > 0 || rect.height > 0);
  };

  const fields = Array.from(document.querySelectorAll('input, select, textarea'))
    .filter(visible)
    .map((el) => ({
      tag: el.tagName.toLowerCase(),
      type: el.getAttribute('type'),
      name: el.getAttribute('name'),
      id: el.getAttribute('id'),
      testId: el.getAttribute('data-cy') || el.getAttribute('data-testid'),
      label: labelFor(el),
      placeholder: el.getAttribute('placeholder'),
      required: el.hasAttribute('required') || el.getAttribute('aria-required') === 'true',
      maxLength: el.getAttribute('maxlength'),
      minLength: el.getAttribute('minlength'),
      min: el.getAttribute('min'),
      max: el.getAttribute('max'),
      pattern: el.getAttribute('pattern'),
      value: el.getAttribute('type') === 'password' ? '***' : (el.value === undefined ? null : el.value),
      disabled: el.disabled === true,
      options: el.tagName.toLowerCase() === 'select' ? Array.from(el.options).map((o) => o.text.trim()) : [],
      classes: el.className || ''
    }));

  const controls = Array.from(document.querySelectorAll('button, a[href], [role="button"], input[type="submit"]'))
    .filter(visible)
    .map((el) => ({
      role: el.tagName.toLowerCase() === 'a' ? 'link' : 'button',
      text: text(el) || el.getAttribute('aria-label') || el.getAttribute('value') || '',
      id: el.getAttribute('id'),
      testId: el.getAttribute('data-cy') || el.getAttribute('data-testid'),
      href: el.getAttribute('href'),
      disabled: el.disabled === true
    }))
    .filter((c) => c.text.length > 0 || c.testId !== null);

  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'))
    .filter(visible)
    .map(text)
    .filter((t) => t.length > 0);

  const alerts = Array.from(document.querySelectorAll('.alert, [role="alert"], .invalid-feedback, .text-danger, .error, .form-text'))
    .filter(visible)
    .map(text)
    .filter((t) => t.length > 0);

  return { headings, fields, controls, alerts };
})()`;

/**
 * Reads one screen the way the skill asks: headings, every form field with its
 * DOM attributes, every button/link, and any alert text on the page.
 */
export class ScreenRecorder {
  constructor(private readonly page: Page, private readonly screensDir: string) {}

  async capture(step: number, screen: string, why: string | null, elapsedMs: number): Promise<ScreenDump> {
    const fileName = `${String(step).padStart(2, '0')}-${screen}.png`;
    await this.page.screenshot({ path: path.join(this.screensDir, fileName), fullPage: true });

    const raw = (await this.page.evaluate(READ_SCREEN)) as RawDump;

    return {
      step,
      screen,
      url: this.page.url(),
      title: await this.page.title(),
      headings: raw.headings,
      fields: raw.fields,
      controls: raw.controls,
      alerts: Array.from(new Set(raw.alerts)),
      screenshot: fileName,
      why,
      elapsedMs,
    };
  }
}
