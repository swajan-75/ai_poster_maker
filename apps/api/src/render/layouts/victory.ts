import type { RenderContext } from '../render-html.js';
import { escapeHtml as e } from '../escape.js';
import { documentShell, photoImg, taglineText } from './shared.js';

export function victoryLayout(ctx: RenderContext): string {
  const a = ctx.palette.accent;
  const css = `
.photos{position:absolute;top:60px;left:0;right:0;display:flex;justify-content:center;align-items:flex-end;gap:36px}
.arch{border:8px solid ${a};border-radius:200px 200px 16px 16px;box-shadow:0 12px 30px rgba(0,0,0,.4)}
.p-side{width:300px;height:390px}.p-main{width:360px;height:470px}
.headline{position:absolute;top:600px;left:50px;width:1100px;height:300px;display:flex;align-items:center;justify-content:center}
.tagline{position:absolute;top:930px;left:100px;width:1000px;height:130px}
.ribbon{position:absolute;top:1100px;left:200px;right:200px;height:12px;background:${ctx.palette.secondary};border-radius:6px}`;
  const [p1, p2, p3] = ctx.photos;
  const photos = ctx.photos.length >= 3 && p1 && p2 && p3
    ? `${photoImg(p2, 'arch p-side')}${photoImg(p1, 'arch p-main')}${photoImg(p3, 'arch p-side')}`
    : ctx.photos.map((p) => photoImg(p, 'arch p-main')).join('');
  const tag = taglineText(ctx);
  return documentShell(ctx, css, `
  <div class="photos">${photos}</div>
  <h1 class="headline" data-fit data-fit-min="48">${e(ctx.form.headline)}</h1>
  ${tag ? `<div class="tagline" data-fit data-fit-min="24">${e(tag)}</div>` : ''}
  <div class="ribbon"></div>`);
}
