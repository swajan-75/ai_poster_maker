/** Output sizes a poster can be generated in. One size per poster. */
export const POSTER_SIZES = ['portrait', 'square', 'story', 'landscape'] as const;
export type PosterSize = (typeof POSTER_SIZES)[number];

export interface SizeSpec {
  /** CSS canvas size the layouts are drawn on. */
  width: number;
  height: number;
  /** deviceScaleFactor → output pixels = width/height × scale. */
  scale: number;
  /** Aspect ratio name, also what the image model is asked for. */
  aspect: '3:4' | '1:1' | '9:16' | '16:9';
  orientation: 'portrait' | 'landscape';
}

export const SIZE_SPECS: Record<PosterSize, SizeSpec> = {
  portrait: { width: 1200, height: 1600, scale: 1.5, aspect: '3:4', orientation: 'portrait' }, // 1800×2400 print poster
  square: { width: 1200, height: 1200, scale: 1.5, aspect: '1:1', orientation: 'portrait' }, // 1800×1800 social post
  story: { width: 1080, height: 1920, scale: 1.5, aspect: '9:16', orientation: 'portrait' }, // 1620×2880 story
  landscape: { width: 1600, height: 900, scale: 1.5, aspect: '16:9', orientation: 'landscape' }, // 2400×1350 cover/banner
};

export const DEFAULT_POSTER_SIZE: PosterSize = 'portrait';

export const outputPixels = (s: PosterSize) => ({
  width: Math.round(SIZE_SPECS[s].width * SIZE_SPECS[s].scale),
  height: Math.round(SIZE_SPECS[s].height * SIZE_SPECS[s].scale),
});

export const PDF_PAPERS = ['a4', 'a3'] as const;
export type PdfPaper = (typeof PDF_PAPERS)[number];
