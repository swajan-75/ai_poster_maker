import { afterAll, describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { PuppeteerRenderer } from '../src/render/puppeteer-renderer.js';
import { renderPosterHtml, toDataUri, type RenderContext } from '../src/render/render-html.js';
import { makeJpeg } from './fixtures.js';

const renderer = new PuppeteerRenderer();
afterAll(() => renderer.close());

async function ctx(over: Partial<RenderContext> = {}): Promise<RenderContext> {
  const photo = toDataUri(await makeJpeg(600, 800), 'image/jpeg');
  return {
    layoutKey: 'victory',
    palette: { id: 'g', name: 'g', primary: '#006A4E', secondary: '#F42A41', accent: '#FFD700', text: '#FFFFFF', footerBg: '#004D38' },
    design: { paletteId: 'g', motif: 'flag_waves', headlineFont: 'noto-serif-bengali', headlineScale: 1.3, photoFocus: [] },
    form: { name: 'মোঃ আব্দুল করিম', designation: 'সভাপতি', organization: 'ওয়ার্ড কমিটি', union: '', thana: 'সাভার', district: 'ঢাকা', headline: 'মহান বিজয় দিবস', tagline: '' },
    photos: [1, 2, 3].map(() => ({ dataUri: photo, focus: { x: 0.5, y: 0.3 } })),
    backgroundDataUri: null,
    ...over,
  };
}

describe('PuppeteerRenderer', () => {
  it('renders a 1800x2400 PNG', async () => {
    const png = await renderer.render(renderPosterHtml(await ctx()));
    const meta = await sharp(png).metadata();
    expect(meta).toMatchObject({ format: 'png', width: 1800, height: 2400 });
  }, 60_000);

  it('loads the embedded Bangla fonts', async () => {
    const ok = await renderer.evaluate(renderPosterHtml(await ctx()),
      `document.fonts.check("700 64px 'Hind Siliguri'", "বিজয়") && document.fonts.check("700 64px 'Noto Serif Bengali'", "বিজয়")`);
    expect(ok).toBe(true);
  }, 60_000);

  it.each(['victory', 'tribute', 'campaign'] as const)('%s: max-length Bangla text never overflows its box', async (layoutKey) => {
    const long = 'ক্ষ্ম র\u200D্যাব '.repeat(8).slice(0, 60);
    const c = await ctx({
      layoutKey,
      form: { name: long, designation: long, organization: 'ক'.repeat(100), union: 'ক'.repeat(60), thana: 'খ'.repeat(60), district: 'গ'.repeat(40), headline: long, tagline: 'ঘ '.repeat(40).slice(0, 80) },
    });
    const boxes = await renderer.measureOverflow(renderPosterHtml(c));
    expect(boxes.length).toBeGreaterThan(3);
    expect(boxes.filter((b) => b.overflow)).toEqual([]);
  }, 60_000);

  it('blocks network requests from the page', async () => {
    const html = renderPosterHtml(await ctx({ backgroundDataUri: null })).replace('</body>', '<img id="ext" src="https://example.com/x.png"></body>');
    const loaded = await renderer.evaluate(html, `(() => { const i = document.getElementById('ext'); return i.complete && i.naturalWidth > 0; })()`);
    expect(loaded).toBe(false);
  }, 60_000);
});
