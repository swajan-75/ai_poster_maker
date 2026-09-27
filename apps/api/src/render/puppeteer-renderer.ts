import puppeteer, { type Browser, type Page } from 'puppeteer';
import { POSTER_HEIGHT, POSTER_WIDTH, RENDER_SCALE } from '@poster/shared';
import type { PosterRenderer } from './renderer.js';

export class PuppeteerRenderer implements PosterRenderer {
  private browser: Promise<Browser> | null = null;
  constructor(private readonly opts: { executablePath?: string } = {}) {}

  private getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = puppeteer
        .launch({
          headless: true,
          executablePath: this.opts.executablePath,
          args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none', '--disable-gpu'],
        })
        .then((b) => {
          b.on('disconnected', () => { this.browser = null; }); // auto-relaunch after crash
          return b;
        })
        .catch((err) => { this.browser = null; throw err; });
    }
    return this.browser;
  }

  private async withPage<T>(html: string, fn: (page: Page) => Promise<T>): Promise<T> {
    const page = await (await this.getBrowser()).newPage();
    try {
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const url = req.url();
        if (url.startsWith('data:') || url === 'about:blank') void req.continue();
        else void req.abort('blockedbyclient');
      });
      await page.setViewport({ width: POSTER_WIDTH, height: POSTER_HEIGHT, deviceScaleFactor: RENDER_SCALE });
      await page.setContent(html, { waitUntil: 'load', timeout: 30_000 });
      await page.waitForFunction('window.__fitDone === true', { timeout: 15_000 });
      return await fn(page);
    } finally {
      await page.close().catch(() => undefined);
    }
  }

  render(html: string): Promise<Buffer> {
    return this.withPage(html, async (page) => Buffer.from(await page.screenshot({ type: 'png', omitBackground: false })));
  }

  /** Test/diagnostic helper: evaluate an expression after layout + fit. */
  evaluate<T>(html: string, expression: string): Promise<T> {
    return this.withPage(html, (page) => page.evaluate(expression) as Promise<T>);
  }

  /** Test/diagnostic helper: report every [data-fit] box and whether it still overflows. */
  measureOverflow(html: string): Promise<{ selector: string; overflow: boolean }[]> {
    return this.evaluate(html, `[...document.querySelectorAll('[data-fit]')].map(el => ({
      selector: el.className,
      overflow: el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1,
    }))`);
  }

  async close(): Promise<void> {
    const b = this.browser;
    this.browser = null;
    if (b) await (await b).close().catch(() => undefined);
  }
}
