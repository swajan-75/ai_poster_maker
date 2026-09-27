import type { RenderContext } from '../render-html.js';
import { escapeHtml as e } from '../escape.js';
import { documentShell, photoImg, taglineText } from './shared.js';

export function tributeLayout(ctx: RenderContext): string {
  const p = ctx.palette;
  const css = `
.headline{position:absolute;top:60px;left:50px;width:1100px;height:240px;display:flex;align-items:center;justify-content:center}
.frame{position:absolute;top:330px;left:50%;transform:translateX(-50%);width:640px;height:640px;border-radius:50%;
  padding:14px;background:conic-gradient(${p.accent},${p.secondary},${p.accent});box-shadow:0 0 60px rgba(0,0,0,.6)}
.p-main{width:100%;height:100%;border-radius:50%;filter:grayscale(.15)}
.tagline{position:absolute;top:1010px;left:100px;width:1000px;height:220px}`;
  const [first] = ctx.photos;
  const tag = taglineText(ctx);
  return documentShell(ctx, css, `
  <h1 class="headline" data-fit data-fit-min="48">${e(ctx.form.headline)}</h1>
  <div class="frame">${first ? photoImg(first, 'p-main') : ''}</div>
  ${tag ? `<div class="tagline" data-fit data-fit-min="24">${e(tag)}</div>` : ''}`);
}
