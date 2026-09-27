import { HEADLINE_FONTS, type FocusPoint, type HeadlineFont, type Motif, type PosterDesign } from '@poster/shared';
import { findBlockedTerm } from '../../lib/moderation.js';
import type { DesignTemplateInfo } from './design-provider.js';

export const DEFAULT_FOCUS: FocusPoint = { x: 0.5, y: 0.3 };
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const isNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const isPoint = (p: unknown): p is FocusPoint =>
  typeof p === 'object' && p !== null && isNum((p as FocusPoint).x) && isNum((p as FocusPoint).y);

export function sanitizeDesign(raw: unknown, t: DesignTemplateInfo, photoCount: number): PosterDesign {
  const d = t.defaultDesign;
  const r = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};

  const paletteId = typeof r.paletteId === 'string' && t.palettes.some((p) => p.id === r.paletteId) ? r.paletteId : d.paletteId;
  const motif = typeof r.motif === 'string' && (t.motifs as string[]).includes(r.motif) ? (r.motif as Motif) : d.motif;
  const headlineFont = (HEADLINE_FONTS as readonly string[]).includes(r.headlineFont as string)
    ? (r.headlineFont as HeadlineFont) : d.headlineFont;
  const headlineScale = isNum(r.headlineScale) ? clamp(r.headlineScale, 0.8, 1.3) : d.headlineScale;

  const rawFocus = Array.isArray(r.photoFocus) ? r.photoFocus : [];
  const photoFocus = Array.from({ length: photoCount }, (_, i) => {
    const f = rawFocus[i];
    return isPoint(f) ? { x: clamp(f.x, 0, 1), y: clamp(f.y, 0, 1) } : DEFAULT_FOCUS;
  });

  const tag = typeof r.tagline === 'string' ? r.tagline.trim().normalize('NFC') : '';
  const tagline = tag && tag.length <= 80 && !findBlockedTerm(tag) ? tag : undefined;

  return { paletteId, motif, headlineFont, headlineScale, photoFocus, ...(tagline ? { tagline } : {}) };
}
