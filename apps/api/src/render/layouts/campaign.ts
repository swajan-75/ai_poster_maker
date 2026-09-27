import type { RenderContext } from '../render-html.js';
import { escapeHtml as e } from '../escape.js';
import { documentShell, geometry, photoImg, px, taglineText } from './shared.js';

export function campaignLayout(ctx: RenderContext): string {
  const g = geometry(ctx);
  const p = ctx.palette;
  const { sx, sy, u } = g;
  const b = (10 * u).toFixed(1);

  // Portrait design coordinates (1200 wide, 1260 above the footer), scaled by sx/sy. Landscape: photos
  // on the left, headline and tagline stacked on the right.
  const css = g.landscape ? `
.headline{position:absolute;top:${px(40)};right:${px(50)};width:${px(g.W * 0.44)};height:${px(g.C * 0.5)};display:flex;align-items:center;justify-content:center}
.p-main{position:absolute;top:${px(40)};left:${px(50)};width:${px(g.W * 0.27)};height:${px(g.C - 80)};border-radius:${px(24 * u)};border:${b}px solid ${p.accent};box-shadow:0 16px 40px rgba(0,0,0,.45)}
.p-side{position:absolute;top:${px(g.C * 0.3)};left:${px(g.W * 0.27 + 80)};width:${px(g.C * 0.42)};height:${px(g.C * 0.42)};border-radius:50%;border:${b}px solid ${p.accent}}
.tagline{position:absolute;top:${px(g.C * 0.5 + 60)};right:${px(50)};width:${px(g.W * 0.44)};height:${px(g.C * 0.5 - 100)};display:flex;align-items:center;justify-content:center}
.band{position:absolute;top:${px(g.C - 120)};left:0;right:0;height:${px(120)};background:${p.secondary};opacity:.9}` : `
.headline{position:absolute;top:${px(50 * sy)};left:${px(50 * sx)};width:${px(1100 * sx)};height:${px(230 * sy)};display:flex;align-items:center;justify-content:center}
.p-main{position:absolute;top:${px(320 * sy)};left:${px(80 * sx)};width:${px(560 * sx)};height:${px(720 * sy)};border-radius:${px(24 * u)};border:${b}px solid ${p.accent};box-shadow:0 16px 40px rgba(0,0,0,.45)}
.p-side{position:absolute;top:${px(360 * sy)};right:${px(80 * sx)};width:${px(400 * Math.min(sx, sy))};height:${px(400 * Math.min(sx, sy))};border-radius:50%;border:${b}px solid ${p.accent}}
.tagline{position:absolute;top:${px(800 * sy)};right:${px(60 * sx)};width:${px(460 * sx)};height:${px(240 * sy)};text-align:left;display:flex;align-items:center}
.band{position:absolute;top:${px(1080 * sy)};left:0;right:0;height:${px(180 * sy)};background:${p.secondary};opacity:.9}`;

  const [main, side] = ctx.photos;
  const tag = taglineText(ctx);
  return documentShell(ctx, css, `
  <div class="band"></div>
  <h1 class="headline" data-fit data-fit-min="${Math.round(48 * u)}">${e(ctx.form.headline)}</h1>
  ${main ? photoImg(main, 'p-main') : ''}
  ${side ? photoImg(side, 'p-side') : ''}
  ${tag ? `<div class="tagline" data-fit data-fit-min="${Math.round(24 * u)}">${e(tag)}</div>` : ''}`);
}
