import { describe, expect, it } from 'vitest';
import { sanitizeDesign, DEFAULT_FOCUS } from '../src/services/ai/sanitize-design.js';
import type { DesignTemplateInfo } from '../src/services/ai/design-provider.js';

const t: DesignTemplateInfo = {
  slug: 'v', title: 'বিজয়', occasion: 'victory_day',
  palettes: [
    { id: 'a', name: 'a', primary: '#000000', secondary: '#000000', accent: '#000000', text: '#ffffff', footerBg: '#000000' },
    { id: 'b', name: 'b', primary: '#000000', secondary: '#000000', accent: '#000000', text: '#ffffff', footerBg: '#000000' },
  ],
  motifs: ['doves', 'sunrise'],
  defaultDesign: { paletteId: 'a', motif: 'doves', headlineFont: 'hind-siliguri', headlineScale: 1, photoFocus: [] },
};

describe('sanitizeDesign', () => {
  it('keeps valid values', () => {
    const d = sanitizeDesign({ paletteId: 'b', motif: 'sunrise', headlineFont: 'noto-sans-bengali', headlineScale: 1.2, photoFocus: [{ x: 0.4, y: 0.2 }], tagline: 'জয় হোক' }, t, 1);
    expect(d).toEqual({ paletteId: 'b', motif: 'sunrise', headlineFont: 'noto-sans-bengali', headlineScale: 1.2, photoFocus: [{ x: 0.4, y: 0.2 }], tagline: 'জয় হোক' });
  });
  it('falls back per-field for unknown palette/motif/font', () => {
    const d = sanitizeDesign({ paletteId: 'zzz', motif: 'boat_river', headlineFont: 'comic-sans', headlineScale: 1 }, t, 0);
    expect(d).toMatchObject({ paletteId: 'a', motif: 'doves', headlineFont: 'hind-siliguri' });
  });
  it('clamps scale and focus; pads/truncates focus to photo count', () => {
    const d = sanitizeDesign({ paletteId: 'a', motif: 'doves', headlineFont: 'hind-siliguri', headlineScale: 9, photoFocus: [{ x: -1, y: 2 }, 'junk', { x: 0.1, y: 0.1 }, { x: 0.9, y: 0.9 }] }, t, 3);
    expect(d.headlineScale).toBe(1.3);
    expect(d.photoFocus).toEqual([{ x: 0, y: 1 }, DEFAULT_FOCUS, { x: 0.1, y: 0.1 }]);
  });
  it('handles total garbage (null, string, NaN)', () => {
    for (const raw of [null, 'text', 42, { headlineScale: Number.NaN }]) {
      const d = sanitizeDesign(raw, t, 2);
      expect(d.paletteId).toBe('a');
      expect(d.headlineScale).toBe(1);
      expect(d.photoFocus).toEqual([DEFAULT_FOCUS, DEFAULT_FOCUS]);
    }
  });
  it('drops tagline if too long or blocked', () => {
    expect(sanitizeDesign({ tagline: 'ক'.repeat(81) }, t, 0).tagline).toBeUndefined();
    expect(sanitizeDesign({ tagline: 'kill them' }, t, 0).tagline).toBeUndefined();
  });
});
