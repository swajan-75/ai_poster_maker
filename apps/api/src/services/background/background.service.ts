import sharp from 'sharp';
import { DEFAULT_POSTER_SIZE, SIZE_SPECS, type Motif, type Occasion, type Palette, type PosterSize } from '@poster/shared';
import type { Logger } from '../../lib/logger.js';
import type { StorageService } from '../storage/storage.js';
import { BACKGROUND_FOLDER } from '../storage/paths.js';
import type { BackgroundProvider } from '../ai/background-provider.js';
import { buildBackgroundPrompt } from '../ai/background-prompt.js';
import { BackgroundCacheModel } from '../../models/background-cache.model.js';
import { GenerationLogModel } from '../../models/generation-log.model.js';

export interface BackgroundTemplateInfo { id: string; occasion: Occasion; palettes: Palette[] }
export interface BackgroundService {
  getBackground(t: BackgroundTemplateInfo, paletteId: string, motif: Motif, posterId?: string, size?: PosterSize): Promise<Buffer | null>;
}
// Portrait keeps the original key so backgrounds cached before sizes existed are still reused.
export const backgroundKey = (templateId: string, paletteId: string, motif: Motif, size: PosterSize = DEFAULT_POSTER_SIZE) =>
  size === DEFAULT_POSTER_SIZE ? `${templateId}:${paletteId}:${motif}` : `${templateId}:${paletteId}:${motif}:${size}`;

export function createBackgroundService(deps: { provider: BackgroundProvider; storage: StorageService; logger: Logger }): BackgroundService {
  const inflight = new Map<string, Promise<Buffer | null>>();

  async function fromCache(key: string): Promise<Buffer | null> {
    const hit = await BackgroundCacheModel.findOne({ key });
    if (!hit) return null;
    try { return await deps.storage.fetchImage(hit.publicId); }
    catch { await BackgroundCacheModel.deleteOne({ key }); return null; }
  }

  async function generate(t: BackgroundTemplateInfo, palette: Palette, motif: Motif, key: string, size: PosterSize, posterId?: string): Promise<Buffer | null> {
    const prompt = buildBackgroundPrompt(t.occasion, motif, palette);
    const started = Date.now();
    try {
      const spec = SIZE_SPECS[size];
      const r = await deps.provider.generate(prompt, spec.aspect);
      const image = await sharp(r.image).resize(spec.width, spec.height, { fit: 'cover' }).jpeg({ quality: 88 }).toBuffer();
      const stored = await deps.storage.uploadImage(image, { folder: BACKGROUND_FOLDER, publicId: key.replace(/:/g, '_'), overwrite: true });
      await BackgroundCacheModel.updateOne({ key }, { $set: { templateId: t.id, paletteId: palette.id, motif, publicId: stored.publicId } }, { upsert: true });
      await GenerationLogModel.create({ kind: 'background', posterId, model: r.model, prompt, latencyMs: r.latencyMs, success: true });
      return image;
    } catch (err) {
      deps.logger.warn({ err, key }, 'background generation failed; using gradient fallback');
      await GenerationLogModel.create({ kind: 'background', posterId, model: 'unknown', prompt, latencyMs: Date.now() - started, success: false, error: String(err) });
      return null;
    }
  }

  return {
    async getBackground(t, paletteId, motif, posterId, size = DEFAULT_POSTER_SIZE) {
      const palette = t.palettes.find((p) => p.id === paletteId);
      if (!palette) return null;
      const key = backgroundKey(t.id, paletteId, motif, size);
      const cached = await fromCache(key);
      if (cached) return cached;
      const existing = inflight.get(key);
      if (existing) return existing;
      const p = generate(t, palette, motif, key, size, posterId).finally(() => inflight.delete(key));
      inflight.set(key, p);
      return p;
    },
  };
}
