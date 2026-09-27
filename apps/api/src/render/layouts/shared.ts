import { DEFAULT_POSTER_SIZE, SIZE_SPECS, type PosterSize } from '@poster/shared';
import type { RenderContext, RenderPhoto } from '../render-html.js';
import { escapeHtml as e } from '../escape.js';
import { FONT_FAMILY, getFontFaceCss } from '../fonts.js';

export const pct = (n: number) => `${Math.round(n * 100)}%`;

// The layouts were designed on the 1200×1600 portrait canvas with a 340px footer. Other sizes reuse
// that design: x positions scale with the width (sx), y positions with the space above the footer (sy),
// and type with `u`. Landscape gets its own side-by-side arrangement in each layout.
const BASE_W = 1200;
const BASE_CONTENT_H = 1260;
const FOOTER_H: Record<PosterSize, number> = { portrait: 340, square: 250, story: 360, landscape: 210 };
const TYPE_SCALE: Record<PosterSize, number> = { portrait: 1, square: 0.85, story: 0.92, landscape: 0.78 };

export interface Geometry {
  size: PosterSize;
  W: number;
  H: number;
  /** Height available above the footer. */
  C: number;
  footerH: number;
  sx: number;
  sy: number;
  u: number;
  landscape: boolean;
}

export function geometry(ctx: RenderContext): Geometry {
  const size = ctx.size ?? DEFAULT_POSTER_SIZE;
  const { width: W, height: H, orientation } = SIZE_SPECS[size];
  const footerH = FOOTER_H[size];
  const C = H - footerH;
  return { size, W, H, C, footerH, sx: W / BASE_W, sy: C / BASE_CONTENT_H, u: TYPE_SCALE[size], landscape: orientation === 'landscape' };
}

export const px = (n: number) => `${Math.round(n)}px`;

export function photoImg(p: RenderPhoto, cls: string): string {
  return `<img class="photo ${cls}" src="${p.dataUri}" style="object-position:${pct(p.focus.x)} ${pct(p.focus.y)}" alt="">`;
}

export function areaLine(ctx: RenderContext): string {
  return [ctx.form.union, ctx.form.thana, ctx.form.district].map((s) => s.trim()).filter(Boolean).join(', ');
}

export function taglineText(ctx: RenderContext): string {
  return ctx.form.tagline.trim() || ctx.design.tagline?.trim() || '';
}

export function footer(ctx: RenderContext): string {
  return `
  <footer class="footer">
    <div class="credit">প্রচারে</div>
    <div class="f-name" data-fit data-fit-min="28">${e(ctx.form.name)}</div>
    <div class="f-desig" data-fit data-fit-min="18">${e(ctx.form.designation)}, ${e(ctx.form.organization)}</div>
    <div class="f-area" data-fit data-fit-min="16">${e(areaLine(ctx))}</div>
  </footer>`;
}

// Free-plan mark: a single badge in the bottom-right corner.
export function watermarkLayer(ctx: RenderContext): string {
  if (!ctx.watermark) return '';
  return `<div class="wm-badge">by Poster Maker</div>`;
}

const WATERMARK_CSS = `
.wm-badge{position:absolute;right:24px;bottom:24px;z-index:50;padding:8px 18px;border-radius:999px;
  background:rgba(0,0,0,.55);color:#fff;font-family:'Hind Siliguri',sans-serif;font-size:24px;font-weight:600}`;

export const FIT_SCRIPT = `<script>
(async () => {
  await document.fonts.ready;
  for (const el of document.querySelectorAll('[data-fit]')) {
    let size = parseFloat(getComputedStyle(el).fontSize);
    const min = Number(el.dataset.fitMin || 20);
    while ((el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) && size > min) {
      size -= 2; el.style.fontSize = size + 'px';
    }
  }
  window.__fitDone = true;
})();
</script>`;

export function documentShell(ctx: RenderContext, layoutCss: string, body: string): string {
  const p = ctx.palette;
  const bg = ctx.backgroundDataUri
    ? `url('${ctx.backgroundDataUri}') center/cover no-repeat`
    : `linear-gradient(160deg, ${p.primary} 0%, ${p.secondary} 55%, ${p.primary} 100%)`;
  const headlineFont = FONT_FAMILY[ctx.design.headlineFont];
  const { W, H, footerH, u } = geometry(ctx);
  const textW = W - 120;
  return `<!doctype html><html lang="bn"><head><meta charset="utf-8"><style>
${getFontFaceCss()}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${W}px;height:${H}px;overflow:hidden}
body{position:relative;background:${bg};color:${p.text};font-family:'Hind Siliguri',sans-serif;-webkit-font-smoothing:antialiased}
.veil{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.05) 0%,rgba(0,0,0,.0) 40%,rgba(0,0,0,.35) 100%)}
.photo{object-fit:cover;display:block;background:#ddd}
.headline{font-family:${headlineFont};font-weight:800;color:${p.accent};text-align:center;line-height:1.25;overflow:hidden;
  text-shadow:0 4px 0 rgba(0,0,0,.35),0 0 24px rgba(0,0,0,.35);font-size:${px(120 * u * ctx.design.headlineScale)}}
.tagline{text-align:center;font-weight:700;overflow:hidden;line-height:1.3;font-size:${px(44 * u)};text-shadow:0 2px 6px rgba(0,0,0,.5)}
.footer{position:absolute;left:0;right:0;bottom:0;height:${px(footerH)};background:${p.footerBg};border-top:${px(10 * u)} solid ${p.accent};
  padding:${px(16 * u)} 60px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${px(4 * u)}}
.footer>*{flex-shrink:0}
.credit{font-size:${px(28 * u)};opacity:.85;font-weight:400}
.f-name{width:${px(textW)};height:${px(84 * u)};font-size:${px(68 * u)};font-weight:700;color:${p.accent};overflow:hidden;line-height:1.2;white-space:nowrap}
.f-desig{width:${px(textW)};max-height:${px(90 * u)};font-size:${px(40 * u)};font-weight:700;overflow:hidden;line-height:1.65;overflow-wrap:anywhere}
.f-area{width:${px(textW)};max-height:${px(80 * u)};font-size:${px(34 * u)};overflow:hidden;line-height:1.65;overflow-wrap:anywhere}
${layoutCss}
${ctx.watermark ? WATERMARK_CSS : ''}
</style></head><body><div class="veil"></div>${body}${footer(ctx)}${watermarkLayer(ctx)}${FIT_SCRIPT}</body></html>`;
}
