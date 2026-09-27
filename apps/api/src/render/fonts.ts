import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { HeadlineFont } from '@poster/shared';

// src/render → ../../assets and dist/render → ../../assets both resolve to apps/api/assets
const FONT_DIR = fileURLToPath(new URL('../../assets/fonts/', import.meta.url));

export const FONT_FAMILY: Record<HeadlineFont, string> = {
  'noto-serif-bengali': "'Noto Serif Bengali'",
  'hind-siliguri': "'Hind Siliguri'",
  'noto-sans-bengali': "'Noto Sans Bengali'",
};

const FACES: { family: string; file: string; weight: string }[] = [
  { family: 'Hind Siliguri', file: 'HindSiliguri-Regular.ttf', weight: '400' },
  { family: 'Hind Siliguri', file: 'HindSiliguri-Bold.ttf', weight: '700' },
  { family: 'Noto Sans Bengali', file: 'NotoSansBengali.ttf', weight: '100 900' },
  { family: 'Noto Serif Bengali', file: 'NotoSerifBengali.ttf', weight: '100 900' },
];

let cached: string | null = null;
export function getFontFaceCss(): string {
  if (cached) return cached;
  cached = FACES.map(({ family, file, weight }) => {
    const b64 = readFileSync(FONT_DIR + file).toString('base64');
    return `@font-face{font-family:'${family}';src:url(data:font/ttf;base64,${b64}) format('truetype');font-weight:${weight};font-display:block;}`;
  }).join('\n');
  return cached;
}
