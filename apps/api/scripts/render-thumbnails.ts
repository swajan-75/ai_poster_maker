/**
 * Renders the ballot (election) templates with sample Bangla text and placeholder artwork, writing
 * gallery thumbnails to apps/web/public/templates/<slug>.png and full-size previews to out/.
 * Usage: npm run thumbnails -w @poster/api [-- <slug> ...]
 */
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import type { Palette, PosterFormData } from '@poster/shared';
import { SEED_TEMPLATES } from './seed-data.js';
import { PuppeteerRenderer } from '../src/render/puppeteer-renderer.js';
import { renderPosterHtml, toDataUri, type RenderPhoto } from '../src/render/render-html.js';

const THUMB_DIR = new URL('../../web/public/templates/', import.meta.url);

const person = (bg: string, suit: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800">
  <rect width="600" height="800" fill="${bg}"/>
  <circle cx="300" cy="270" r="130" fill="#E2C4A8"/>
  <path d="M60 800 C60 560 160 470 300 470 C440 470 540 560 540 800 Z" fill="${suit}"/>
  <path d="M270 480 L300 620 L330 480 Z" fill="#fff"/><path d="M292 500 L300 600 L308 500 Z" fill="#8B1E2B"/></svg>`;

const boat = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">
  <rect width="600" height="600" fill="#fff"/>
  <path d="M60 330 Q300 470 540 330 L480 400 Q300 480 120 400 Z" fill="#111"/>
  <path d="M170 330 Q300 200 430 330 Z" fill="none" stroke="#111" stroke-width="14"/>
  <path d="M110 150 L250 360" stroke="#111" stroke-width="14"/>
  <path d="M70 450 Q150 420 230 450 T390 450 T550 450" fill="none" stroke="#111" stroke-width="10"/></svg>`;

const svgPhoto = async (svg: string): Promise<RenderPhoto> => ({
  dataUri: toDataUri(await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer(), 'image/jpeg'),
  focus: { x: 0.5, y: 0.3 },
});

const SAMPLE_FORM: PosterFormData = {
  topLine: 'বিসমিল্লাহির রাহমানির রাহিম',
  headline: 'আসন্ন ৫নং গোয়ালাবাজার ইউনিয়ন পরিষদ নির্বাচনে',
  electionDate: '০৫ জানুয়ারি ২০২৭ ইং, রোজঃ মঙ্গলবার',
  designation: 'চেয়ারম্যান পদপ্রার্থী',
  name: 'মোঃ আব্দুল করিম',
  organization: 'সাবেক সফল চেয়ারম্যান',
  tagline: 'সৎ, নির্ভীক, তরুণ সমাজসেবক',
  symbol: 'নৌকা',
  appeal: '',
  campaignBy: '',
  union: '৫নং গোয়ালাবাজার ইউনিয়ন', thana: 'ওসমানীনগর', district: 'সিলেট',
};

const slugs = process.argv.slice(2);
// Named slugs render any template; with no args, only the ballot templates (their thumbnails are code-drawn).
const templates = SEED_TEMPLATES.filter((t) => (slugs.length ? slugs.includes(t.slug) : t.layoutKey.startsWith('ballot_')));
const renderer = new PuppeteerRenderer();
const photos = [await svgPhoto(person('#C9D6DF', '#23303D')), await svgPhoto(boat), await svgPhoto(person('#E6D9C8', '#3A3A3A'))];
// Non-ballot layouts use every slot for people, so no ballot symbol.
const portraits = [photos[0]!, await svgPhoto(person('#D8E4C8', '#2E4A3A')), photos[2]!];
await mkdir('out', { recursive: true });
try {
  for (const t of templates) {
    for (const palette of t.palettes as Palette[]) {
      const html = renderPosterHtml({
        layoutKey: t.layoutKey, palette, design: { ...t.defaultDesign, paletteId: palette.id },
        form: t.layoutKey.startsWith('ballot_') ? SAMPLE_FORM : { ...SAMPLE_FORM, headline: t.defaultHeadline, tagline: '' },
        photos: (t.layoutKey.startsWith('ballot_') ? photos : portraits).slice(0, t.photoSlots), backgroundDataUri: null,
      });
      const png = await renderer.render(html);
      await writeFile(`out/${t.slug}-${palette.id}.png`, png);
      if (palette.id === t.defaultDesign.paletteId)
        await sharp(png).resize(450, 600).png().toFile(new URL(`${t.slug}.png`, THUMB_DIR).pathname);
      console.log(`rendered ${t.slug} / ${palette.id}`);
    }
  }
} finally {
  await renderer.close();
}
