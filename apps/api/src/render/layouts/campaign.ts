import type { RenderContext } from '../render-html.js';
import { escapeHtml as e } from '../escape.js';
import { documentShell, photoImg, taglineText } from './shared.js';

export function campaignLayout(ctx: RenderContext): string {
  const p = ctx.palette;
  const css = `
.headline{position:absolute;top:50px;left:50px;width:1100px;height:230px;display:flex;align-items:center;justify-content:center}
.p-main{position:absolute;top:320px;left:80px;width:560px;height:720px;border-radius:24px;border:10px solid ${p.accent};box-shadow:0 16px 40px rgba(0,0,0,.45)}
.p-side{position:absolute;top:360px;right:80px;width:400px;height:400px;border-radius:50%;border:10px solid ${p.accent}}
.tagline{position:absolute;top:800px;right:60px;width:460px;height:240px;text-align:left;display:flex;align-items:center}
.band{position:absolute;top:1080px;left:0;right:0;height:180px;background:${p.secondary};opacity:.9}`;
  const [main, side] = ctx.photos;
  const tag = taglineText(ctx);
  return documentShell(ctx, css, `
  <h1 class="headline" data-fit data-fit-min="48">${e(ctx.form.headline)}</h1>
  ${main ? photoImg(main, 'p-main') : ''}
  ${side ? photoImg(side, 'p-side') : ''}
  ${tag ? `<div class="tagline" data-fit data-fit-min="24">${e(tag)}</div>` : ''}
  <div class="band"></div>`);
}
