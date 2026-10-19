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
 * Reads one screen the way the skill asks: headings, every form field with its
 * DOM attributes, every button/link, and any alert text on the page.
 */
export class ScreenRecorder {
  constructor(private readonly page: Page, private readonly screensDir: string) {}

  async capture(step: number, screen: string, why: string | null, elapsedMs: number): Promise<ScreenDump> {
    const fileName = `${String(step).padStart(2, '0')}-${screen}.png`;
    await this.page.screenshot({ path: path.join(this.screensDir, fileName), fullPage: true });

    const raw = await this.page.evaluate<RawDump>(() => {
      const text = (element: Element): string => (element.textContent ?? '').replace(/\s+/g, ' ').trim();

      const labelFor = (element: Element): string | null => {
        const id = element.getAttribute('id');
        if (id) {
          const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
          if (label) return text(label);
        }
        const wrapper = element.closest('label');
        return wrapper ? text(wrapper) : null;
      };

      const visible = (element: Element): boolean => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && (rect.width > 0 || rect.height > 0);
      };

      const fields = Array.from(document.querySelectorAll('input, select, textarea'))
        .filter(visible)
        .map((element) => {
          const input = element as HTMLInputElement;
          return {
            tag: element.tagName.toLowerCase(),
            type: element.getAttribute('type'),
            name: element.getAttribute('name'),
            id: element.getAttribute('id'),
            testId: element.getAttribute('data-cy') ?? element.getAttribute('data-testid'),
            label: labelFor(element),
            placeholder: element.getAttribute('placeholder'),
            required: element.hasAttribute('required') || element.getAttribute('aria-required') === 'true',
            maxLength: element.getAttribute('maxlength'),
            minLength: element.getAttribute('minlength'),
            min: element.getAttribute('min'),
            max: element.getAttribute('max'),
            pattern: element.getAttribute('pattern'),
            value: input.type === 'password' ? '***' : input.value ?? null,
            disabled: input.disabled === true,
            options:
              element.tagName.toLowerCase() === 'select'
                ? Array.from((element as HTMLSelectElement).options).map((o) => o.text.trim())
                : [],
          };
        });

      const controls = Array.from(document.querySelectorAll('button, a[href], [role="button"], input[type="submit"]'))
        .filter(visible)
        .map((element) => ({
          role: element.tagName.toLowerCase() === 'a' ? 'link' : 'button',
          text: text(element) || element.getAttribute('aria-label') || element.getAttribute('value') || '',
          id: element.getAttribute('id'),
          testId: element.getAttribute('data-cy') ?? element.getAttribute('data-testid'),
          href: element.getAttribute('href'),
          disabled: (element as HTMLButtonElement).disabled === true,
        }))
        .filter((c) => c.text.length > 0 || c.testId !== null);

      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'))
        .filter(visible)
        .map(text)
        .filter((t) => t.length > 0);

      const alerts = Array.from(
        document.querySelectorAll('.alert, [role="alert"], .invalid-feedback, .text-danger, .error, .ng-invalid ~ .invalid-feedback'),
      )
        .filter(visible)
        .map(text)
        .filter((t) => t.length > 0);

      return { headings, fields, controls, alerts };
    });

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
