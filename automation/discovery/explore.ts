import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium, type BrowserContext, type Page } from '@playwright/test';
import { ENV } from '../config/env.js';
import type { ConsoleEntry, NetworkEntry, ScreenDump, Walk, WalkContext } from '../types/discovery.js';
import { NetworkRecorder } from './recorders/network.js';
import { ConsoleRecorder } from './recorders/console.js';
import { ScreenRecorder } from './recorders/screens.js';
import { loadSession } from './session.js';

const here = path.dirname(fileURLToPath(import.meta.url));

interface CreatedRecord {
  kind: string;
  name: string;
  id?: string;
}

interface StepResult {
  step: number;
  screen: string;
  ok: boolean;
  error: string | null;
  network: NetworkEntry[];
}

async function main(): Promise<void> {
  const target = process.argv[2];
  if (!target) throw new Error('Usage: npm run discover -- walks/<name>.walk.ts');

  const walkPath = path.isAbsolute(target) ? target : path.resolve(here, target);
  const module_ = (await import(pathToFileURL(walkPath).href)) as { walk: Walk };
  const walk = module_.walk;

  const walkName = path.basename(walkPath).replace(/\.walk\.ts$/, '');
  const outDir = path.resolve(here, 'artifacts', walkName);
  const screensDir = path.join(outDir, 'screens');
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(screensDir, { recursive: true });

  console.log(`\n${walk.id} - ${walk.title}`);
  console.log(`tenant ${walk.tenant} | login ${walk.login ?? 'session'} | artifacts ${outDir}\n`);

  const browser = await chromium.launch({ headless: !ENV.headed, slowMo: ENV.headed ? 150 : 0 });
  const session = walk.login === 'session' ? await loadSession(browser, walk.tenant) : undefined;
  if (session) console.log(`session reused | token stored in ${session.tokenStorage}`);
  const context: BrowserContext = await browser.newContext({
    baseURL: ENV.baseUrl,
    storageState: session?.statePath,
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });

  const blocked: string[] = [];
  // CLAUDE.md section 5: never leave the test environment. Only off-host URLs are
  // intercepted - routing an allowed request would duplicate it in the recording.
  await context.route(
    (url) => !ENV.allowedHosts.includes(url.host),
    async (route, request) => {
      blocked.push(`${request.method()} ${request.url()}`);
      await route.abort();
    },
  );

  if (session && Object.keys(session.sessionStorage).length > 0) {
    // storageState does not carry sessionStorage; replay it before the first script runs.
    await context.addInitScript({
      content: `(() => { const d = ${JSON.stringify(session.sessionStorage)}; for (const k of Object.keys(d)) sessionStorage.setItem(k, d[k]); })()`,
    });
  }

  const page: Page = await context.newPage();
  const network = new NetworkRecorder(page, ENV.baseUrl);
  const consoleRec = new ConsoleRecorder(page);
  const screens = new ScreenRecorder(page, screensDir);

  const created: CreatedRecord[] = [];
  const ctx: WalkContext = {
    data: {},
    track(kind, name, id) {
      created.push({ kind, name, id });
    },
  };

  const dumps: ScreenDump[] = [];
  const results: StepResult[] = [];

  for (const [index, step] of walk.steps.entries()) {
    const number = index + 1;
    network.mark(number, step.screen);
    consoleRec.mark(number);
    const startedAt = Date.now();
    let error: string | null = null;

    try {
      await step.do(page, ctx);
    } catch (caught) {
      error = (caught as Error).message;
    }

    try {
      await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
      // A page that never goes idle is itself an observation; carry on.
    }

    const elapsed = Date.now() - startedAt;
    const dump = await screens.capture(number, step.screen, step.why ?? null, elapsed);
    dumps.push(dump);
    const slice = network.flush();
    results.push({ step: number, screen: step.screen, ok: error === null, error, network: slice });

    console.log(
      `${error ? 'x' : 'v'} ${number}. ${step.screen} - ${dump.url} (${elapsed} ms, ${slice.length} requests)` +
        (error ? `\n    ERROR: ${error}` : ''),
    );
    if (error) break;
  }

  const consoleEntries: ConsoleEntry[] = consoleRec.everything();

  fs.writeFileSync(path.join(outDir, 'screens.json'), JSON.stringify(dumps, null, 2));
  fs.writeFileSync(path.join(outDir, 'network.json'), JSON.stringify(network.everything(), null, 2));
  fs.writeFileSync(path.join(outDir, 'console.json'), JSON.stringify(consoleEntries, null, 2));
  fs.writeFileSync(
    path.join(outDir, 'walk.json'),
    JSON.stringify(
      { id: walk.id, title: walk.title, tenant: walk.tenant, data: ctx.data, results, created, blocked },
      null,
      2,
    ),
  );

  console.log(`\nconsole/page errors: ${consoleEntries.length}`);
  console.log(`blocked off-host requests: ${blocked.length}`);
  console.log(`qa- records created: ${created.map((c) => `${c.kind}:${c.name}${c.id ? `#${c.id}` : ''}`).join(', ') || 'none'}`);

  await context.close();
  await browser.close();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
