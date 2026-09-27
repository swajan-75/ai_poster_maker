import type { RenderContext } from '../render-html.js';
import { escapeHtml as e } from '../escape.js';
import { documentShell, geometry, photoImg, px, taglineText } from './shared.js';

export function tributeLayout(ctx: RenderContext): string {
  const g = geometry(ctx);
  const p = ctx.palette;
  // Portrait design: 640px circle, 240px headline, 220px tagline.
  const circle = g.landscape
    ? Math.min(g.C - 80, g.W * 0.42)
    : Math.min(640 * Math.min(g.sx, g.sy * 1.1), g.W - 160);
  const text = g.landscape
    ? { w: g.W * 0.5 - 60, headH: g.C * 0.42, tagH: g.C * 0.3 }
    : { w: g.W - 100 * g.sx, headH: 240 * Math.min(g.sy, 1.2), tagH: 220 * Math.min(g.sy, 1.1) };

  const css = `
.stage{position:absolute;left:0;right:0;top:0;height:${px(g.C)};display:flex;
  ${g.landscape ? 'flex-direction:row;align-items:center;justify-content:space-evenly;padding:0 30px' : 'flex-direction:column;align-items:center;justify-content:space-evenly;padding:20px 0'}}
.col{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${px(24 * g.u)}}
.headline{width:${px(text.w)};height:${px(text.headH)};display:flex;align-items:center;justify-content:center;flex-shrink:0}
.frame{width:${px(circle)};height:${px(circle)};flex-shrink:0;border-radius:50%;padding:${px(14 * g.u)};
  background:conic-gradient(${p.accent},${p.secondary},${p.accent});box-shadow:0 0 60px rgba(0,0,0,.6)}
.p-main{width:100%;height:100%;border-radius:50%;filter:grayscale(.15)}
.tagline{width:${px(text.w - 100 * g.sx)};height:${px(text.tagH)};flex-shrink:0}`;

  const [first] = ctx.photos;
  const tag = taglineText(ctx);
  const headline = `<h1 class="headline" data-fit data-fit-min="${Math.round(48 * g.u)}">${e(ctx.form.headline)}</h1>`;
  const tagline = tag ? `<div class="tagline" data-fit data-fit-min="${Math.round(24 * g.u)}">${e(tag)}</div>` : '';
  const frame = `<div class="frame">${first ? photoImg(first, 'p-main') : ''}</div>`;
  return documentShell(ctx, css, g.landscape
    ? `<div class="stage">${frame}<div class="col">${headline}${tagline}</div></div>`
    : `<div class="stage">${headline}${frame}${tagline}</div>`);
}
