import type { RenderContext } from '../render-html.js';
import { escapeHtml as e } from '../escape.js';
import { documentShell, geometry, photoImg, px, taglineText } from './shared.js';

// Base (portrait) sizes: centre arch 360×470, side arches 300×390, 36px gaps.
const ROW_W = 360 + 300 * 2 + 36 * 2;
const ROW_H = 470;

export function victoryLayout(ctx: RenderContext): string {
  const g = geometry(ctx);
  const a = ctx.palette.accent;
  const photoArea = g.landscape
    ? { w: g.W * 0.5 - 60, h: g.C - 80 }
    : { w: g.W - 80, h: ROW_H * g.sy };
  // Largest scale at which the whole arch row fits its area (never above the portrait design).
  const k = Math.min(1, photoArea.w / ROW_W, photoArea.h / ROW_H);
  const text = g.landscape
    ? { w: g.W * 0.5 - 60, headH: g.C * 0.46, tagH: g.C * 0.22 }
    : { w: g.W - 100 * g.sx, headH: 300 * Math.min(g.sy, 1.2), tagH: 130 * Math.min(g.sy, 1.2) };

  const css = `
.stage{position:absolute;left:0;right:0;top:0;height:${px(g.C)};display:flex;
  ${g.landscape ? 'flex-direction:row;align-items:center;justify-content:space-evenly;padding:0 30px' : 'flex-direction:column;align-items:center;justify-content:space-evenly;padding:20px 0'}}
.col{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${px(24 * g.u)}}
.photos{display:flex;justify-content:center;align-items:flex-end;gap:${px(36 * k)}}
.arch{border:${px(8 * k)} solid ${a};border-radius:${px(200 * k)} ${px(200 * k)} ${px(16 * k)} ${px(16 * k)};box-shadow:0 12px 30px rgba(0,0,0,.4)}
.p-side{width:${px(300 * k)};height:${px(390 * k)}}.p-main{width:${px(360 * k)};height:${px(470 * k)}}
.headline{width:${px(text.w)};height:${px(text.headH)};display:flex;align-items:center;justify-content:center;flex-shrink:0}
.tagline{width:${px(text.w - 100 * g.sx)};height:${px(text.tagH)};flex-shrink:0}
.ribbon{width:${px(text.w * 0.75)};height:${px(12 * g.u)};background:${ctx.palette.secondary};border-radius:6px;flex-shrink:0}`;

  const [p1, p2, p3] = ctx.photos;
  const photos = ctx.photos.length >= 3 && p1 && p2 && p3
    ? `${photoImg(p2, 'arch p-side')}${photoImg(p1, 'arch p-main')}${photoImg(p3, 'arch p-side')}`
    : ctx.photos.map((p) => photoImg(p, 'arch p-main')).join('');
  const tag = taglineText(ctx);
  const words = `<h1 class="headline" data-fit data-fit-min="${Math.round(48 * g.u)}">${e(ctx.form.headline)}</h1>
    ${tag ? `<div class="tagline" data-fit data-fit-min="${Math.round(24 * g.u)}">${e(tag)}</div>` : ''}
    <div class="ribbon"></div>`;
  return documentShell(ctx, css, g.landscape
    ? `<div class="stage"><div class="photos">${photos}</div><div class="col">${words}</div></div>`
    : `<div class="stage"><div class="photos">${photos}</div>${words}</div>`);
}
