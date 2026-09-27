import { describe, expect, it } from 'vitest';
import { renderPosterHtml, type RenderContext } from '../src/render/render-html.js';
import { escapeHtml } from '../src/render/escape.js';
import { getFontFaceCss } from '../src/render/fonts.js';

const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const baseCtx = (over: Partial<RenderContext> = {}): RenderContext => ({
  layoutKey: 'victory',
  palette: { id: 'flag-green', name: 'g', primary: '#006A4E', secondary: '#F42A41', accent: '#FFD700', text: '#FFFFFF', footerBg: '#004D38' },
  design: { paletteId: 'flag-green', motif: 'flag_waves', headlineFont: 'noto-serif-bengali', headlineScale: 1, photoFocus: [] },
  form: { name: 'মোঃ আব্দুল করিম', designation: 'সভাপতি', organization: '৩নং ওয়ার্ড কমিটি', union: 'আশুলিয়া', thana: 'সাভার', district: 'ঢাকা', headline: 'মহান বিজয় দিবস', tagline: '' },
  photos: [{ dataUri: PIXEL, focus: { x: 0.5, y: 0.3 } }, { dataUri: PIXEL, focus: { x: 0.5, y: 0.3 } }, { dataUri: PIXEL, focus: { x: 0.5, y: 0.3 } }],
  backgroundDataUri: null,
  ...over,
});

describe('escapeHtml', () => {
  it('escapes all HTML-significant chars', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
  });
});

describe('getFontFaceCss', () => {
  it('embeds all three families as base64', () => {
    const css = getFontFaceCss();
    for (const f of ['Hind Siliguri', 'Noto Sans Bengali', 'Noto Serif Bengali']) expect(css).toContain(`font-family:'${f}'`);
    expect(css).toMatch(/data:font\/ttf;base64,/);
  });
});

describe('renderPosterHtml', () => {
  it.each(['victory', 'tribute', 'campaign'] as const)('%s layout contains all user text and the credit line', (layoutKey) => {
    const html = renderPosterHtml(baseCtx({ layoutKey }));
    for (const s of ['মহান বিজয় দিবস', 'মোঃ আব্দুল করিম', 'সভাপতি', '৩নং ওয়ার্ড কমিটি', 'আশুলিয়া, সাভার, ঢাকা', 'প্রচারে'])
      expect(html).toContain(s);
    expect(html).toContain('window.__fitDone');
  });

  it('adds the tiled watermark only when asked', () => {
    expect(renderPosterHtml(baseCtx())).not.toContain('class="wm"');
    const html = renderPosterHtml(baseCtx({ watermark: true }));
    expect(html).toContain('class="wm"');
    expect(html).toContain('wm-badge');
  });

  it('renders exactly one <img> per photo slot used', () => {
    const html = renderPosterHtml(baseCtx({ photos: baseCtx().photos.slice(0, 2), layoutKey: 'campaign' }));
    expect(html.match(/class="photo/g)?.length).toBe(2);
  });

  it('never injects user HTML', () => {
    const evil = '</div><script>alert(1)</script><img src=x onerror=alert(2)>';
    const html = renderPosterHtml(baseCtx({ form: { ...baseCtx().form, name: evil, headline: `"${evil}` } }));
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('uses user tagline over AI tagline, AI tagline when user left it empty', () => {
    const ai = baseCtx({ design: { ...baseCtx().design, tagline: 'এআই স্লোগান' } });
    expect(renderPosterHtml(ai)).toContain('এআই স্লোগান');
    const user = baseCtx({ form: { ...baseCtx().form, tagline: 'আমার স্লোগান' }, design: { ...baseCtx().design, tagline: 'এআই স্লোগান' } });
    const html = renderPosterHtml(user);
    expect(html).toContain('আমার স্লোগান');
    expect(html).not.toContain('এআই স্লোগান');
  });

  it('uses background image when present, gradient otherwise', () => {
    expect(renderPosterHtml(baseCtx())).toContain('linear-gradient');
    expect(renderPosterHtml(baseCtx({ backgroundDataUri: PIXEL }))).toContain(`url('${PIXEL}')`);
  });

  it('applies focus point as object-position', () => {
    const html = renderPosterHtml(baseCtx({ photos: [{ dataUri: PIXEL, focus: { x: 0.25, y: 0.1 } }], layoutKey: 'tribute' }));
    expect(html).toContain('object-position:25% 10%');
  });
});

