import type { FocusPoint, LayoutKey, Palette, PosterDesign, PosterFormData } from '@poster/shared';
import { victoryLayout } from './layouts/victory.js';
import { tributeLayout } from './layouts/tribute.js';
import { campaignLayout } from './layouts/campaign.js';

export interface RenderPhoto { dataUri: string; focus: FocusPoint }
export interface RenderContext {
  layoutKey: LayoutKey;
  palette: Palette;
  design: PosterDesign;
  form: PosterFormData;
  photos: RenderPhoto[];
  backgroundDataUri: string | null;
  /** Free-plan posters carry a tiled watermark across the whole canvas. */
  watermark?: boolean;
}

const LAYOUTS: Record<LayoutKey, (ctx: RenderContext) => string> = {
  victory: victoryLayout,
  tribute: tributeLayout,
  campaign: campaignLayout,
};

export function renderPosterHtml(ctx: RenderContext): string {
  return LAYOUTS[ctx.layoutKey](ctx);
}

export const toDataUri = (buf: Buffer, mime: 'image/jpeg' | 'image/png') => `data:${mime};base64,${buf.toString('base64')}`;
