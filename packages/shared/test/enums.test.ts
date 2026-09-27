import { describe, expect, it } from 'vitest';
import {
  OCCASIONS, OCCASION_LABELS_BN, MOTIFS, HEADLINE_FONTS, LAYOUT_KEYS,
  POSTER_WIDTH, POSTER_HEIGHT, RENDER_SCALE, MAX_PHOTOS,
} from '../src/index.js';

describe('enums & limits', () => {
  it('every occasion has a Bangla label', () => {
    for (const o of OCCASIONS) expect(OCCASION_LABELS_BN[o]).toMatch(/\S/);
  });
  it('print output meets minimum 1200x1600', () => {
    expect(POSTER_WIDTH * RENDER_SCALE).toBeGreaterThanOrEqual(1200);
    expect(POSTER_HEIGHT * RENDER_SCALE).toBeGreaterThanOrEqual(1600);
    expect(POSTER_WIDTH / POSTER_HEIGHT).toBeCloseTo(3 / 4);
  });
  it('has non-empty option lists', () => {
    expect(MOTIFS.length).toBeGreaterThan(0);
    expect(HEADLINE_FONTS.length).toBe(3);
    expect(LAYOUT_KEYS).toEqual(['victory', 'tribute', 'campaign']);
    expect(MAX_PHOTOS).toBe(3);
  });
});
