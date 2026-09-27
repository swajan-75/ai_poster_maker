import sharp from 'sharp';
import { isBallotLayout, type PosterDesign, type PosterFormData } from '@poster/shared';
import type { Logger } from '../lib/logger.js';
import { withTimeout } from '../lib/timeout.js';
import { PosterModel } from '../models/poster.model.js';
import { TemplateModel, type TemplateDoc } from '../models/template.model.js';
import { GenerationLogModel } from '../models/generation-log.model.js';
import type { StorageService } from '../services/storage/storage.js';
import { generatedFolder } from '../services/storage/paths.js';
import type { DesignProvider, DesignTemplateInfo } from '../services/ai/design-provider.js';
import { sanitizeDesign } from '../services/ai/sanitize-design.js';
import type { BackgroundService } from '../services/background/background.service.js';
import type { PosterRenderer } from '../render/renderer.js';
import { renderPosterHtml, toDataUri } from '../render/render-html.js';

export interface GenerateDeps {
  storage: StorageService;
  designProvider: DesignProvider;
  backgrounds: BackgroundService;
  renderer: PosterRenderer;
  logger: Logger;
  renderTimeoutMs: number;
}

export const GENERATION_FAILED_MESSAGE = 'Poster generation failed. Please try again.';
const DESIGN_TIMEOUT_MS = 30_000;
const BACKGROUND_TIMEOUT_MS = 60_000;

function templateInfo(t: TemplateDoc): DesignTemplateInfo {
  return { slug: t.slug, title: t.title, occasion: t.occasion, palettes: t.palettes, motifs: t.motifs, defaultDesign: t.defaultDesign as PosterDesign };
}

async function chooseDesign(posterId: string, t: TemplateDoc, form: PosterFormData, photos: Buffer[], deps: GenerateDeps): Promise<PosterDesign> {
  const info = templateInfo(t);
  const small = await Promise.all(photos.map((b) => sharp(b).resize(512, 512, { fit: 'inside' }).jpeg({ quality: 80 }).toBuffer()));
  const started = Date.now();
  try {
    const r = await withTimeout(deps.designProvider.suggestDesign({ template: info, form, photos: small }), DESIGN_TIMEOUT_MS, 'design');
    await GenerationLogModel.create({ kind: 'design', posterId, model: r.model, prompt: r.prompt, promptTokens: r.promptTokens, outputTokens: r.outputTokens, latencyMs: r.latencyMs, success: true });
    return sanitizeDesign(r.raw, info, photos.length);
  } catch (err) {
    deps.logger.warn({ err, posterId }, 'design provider failed; using template default');
    await GenerationLogModel.create({ kind: 'design', posterId, model: 'unknown', prompt: '-', latencyMs: Date.now() - started, success: false, error: String(err) });
    return sanitizeDesign(null, info, photos.length);
  }
}

export async function generatePoster(posterId: string, deps: GenerateDeps): Promise<void> {
  const log = deps.logger.child({ posterId });
  const poster = await PosterModel.findOneAndUpdate(
    { _id: posterId, status: 'queued' },
    { $set: { status: 'generating' }, $unset: { error: 1 } },
    { new: true },
  ).catch(() => null);
  if (!poster) return; // already claimed, finished, or deleted

  try {
    const template = await TemplateModel.findById(poster.templateId);
    if (!template) throw new Error('template missing');
    const form = poster.formData as PosterFormData;
    const photos = await Promise.all(poster.photoIds.map((id) => deps.storage.fetchImage(id)));

    // Removing the watermark must not change the poster, so reuse the design it was rendered with.
    const design = poster.reuseDesign && poster.design
      ? sanitizeDesign(poster.toObject().design, templateInfo(template), photos.length)
      : await chooseDesign(posterId, template, form, photos, deps);
    const palette = template.palettes.find((p) => p.id === design.paletteId) ?? template.palettes[0]!;
    // Ballot layouts draw their own flat print-style background, so skip the AI image entirely.
    const bg = isBallotLayout(template.layoutKey) ? null : await withTimeout(
      deps.backgrounds.getBackground({ id: template._id.toString(), occasion: template.occasion, palettes: template.palettes }, design.paletteId, design.motif, posterId),
      BACKGROUND_TIMEOUT_MS, 'background',
    ).catch(() => null);

    const photoUris = await Promise.all(photos.map(async (b, i) => ({
      dataUri: toDataUri(await sharp(b).resize(900, 900, { fit: 'inside' }).jpeg({ quality: 88 }).toBuffer(), 'image/jpeg'),
      focus: design.photoFocus[i] ?? { x: 0.5, y: 0.3 },
    })));

    const html = renderPosterHtml({
      layoutKey: template.layoutKey, palette, design, form, photos: photoUris,
      backgroundDataUri: bg ? toDataUri(bg, 'image/jpeg') : null,
      watermark: poster.watermarked,
    });
    const png = await withTimeout(deps.renderer.render(html), deps.renderTimeoutMs, 'render');

    const stored = await deps.storage.uploadImage(png, { folder: generatedFolder(poster.userId.toString()), publicId: posterId, overwrite: true });
    await PosterModel.updateOne({ _id: posterId }, { $set: { status: 'completed', design, imagePublicId: stored.publicId, imageUrl: stored.url, reuseDesign: false } });
    log.info('poster generated');
  } catch (err) {
    log.error({ err }, 'poster generation failed');
    await PosterModel.updateOne({ _id: posterId }, { $set: { status: 'failed', error: GENERATION_FAILED_MESSAGE } }).catch(() => undefined);
  }
}
