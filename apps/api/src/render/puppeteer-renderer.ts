import puppeteer, { type Browser, type Page } from 'puppeteer';
import { DEFAULT_POSTER_SIZE, SIZE_SPECS, type PosterSize } from '@poster/shared';
import type { PdfOptions, PosterRenderer } from './renderer.js';

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

  private async withPage<T>(html: string, fn: (page: Page) => Promise<T>, size: PosterSize = DEFAULT_POSTER_SIZE): Promise<T> {
    const page = await (await this.getBrowser()).newPage();
    try {
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const url = req.url();
        if (url.startsWith('data:') || url === 'about:blank') void req.continue();
        else void req.abort('blockedbyclient');
      });
      const spec = SIZE_SPECS[size];
      await page.setViewport({ width: spec.width, height: spec.height, deviceScaleFactor: spec.scale });
      await page.setContent(html, { waitUntil: 'load', timeout: 30_000 });
      await page.waitForFunction('window.__fitDone === true', { timeout: 15_000 });
      return await fn(page);
    } finally {
      await page.close().catch(() => undefined);
    }
  }

  render(html: string, size: PosterSize = DEFAULT_POSTER_SIZE): Promise<Buffer> {
    return this.withPage(html, async (page) => Buffer.from(await page.screenshot({ type: 'png', omitBackground: false })), size);
  }

  /** The page's HTML must set window.__fitDone like a poster does (the PDF wrapper sets it immediately). */
  renderPdf(html: string, opts: PdfOptions): Promise<Buffer> {
    return this.withPage(html, async (page) => Buffer.from(await page.pdf({
      format: opts.paper === 'a3' ? 'A3' : 'A4', landscape: opts.landscape, printBackground: true, preferCSSPageSize: false,
    })));
  }

  /** Test/diagnostic helper: evaluate an expression after layout + fit. */
  evaluate<T>(html: string, expression: string, size?: PosterSize): Promise<T> {
    return this.withPage(html, (page) => page.evaluate(expression) as Promise<T>, size);
  }

  /** Test/diagnostic helper: report every [data-fit] box and whether it still overflows. */
  measureOverflow(html: string, size?: PosterSize): Promise<{ selector: string; overflow: boolean }[]> {
    return this.evaluate(html, `[...document.querySelectorAll('[data-fit]')].map(el => ({
      selector: el.className,
      overflow: el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1,
    }))`, size);
  }

  async close(): Promise<void> {
    const b = this.browser;
    this.browser = null;
    if (b) await (await b).close().catch(() => undefined);
  }
}
