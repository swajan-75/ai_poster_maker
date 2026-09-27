import { describe, expect, it } from 'vitest';
import pino from 'pino';
import { useTestDb } from './setup-db.js';
import { seedPosterFixture } from './fixtures.js';
import { generatePoster, GENERATION_FAILED_MESSAGE, type GenerateDeps } from '../src/jobs/generate-poster.js';
import { recoverJobs } from '../src/jobs/recover.js';
import { MemoryStorage } from '../src/services/storage/memory-storage.js';
import { FakeDesignProvider } from '../src/services/ai/fake-design-provider.js';
import { FakeBackgroundProvider } from '../src/services/ai/fake-background-provider.js';
import { createBackgroundService } from '../src/services/background/background.service.js';
import { FakeRenderer } from '../src/render/fake-renderer.js';
import { PosterModel } from '../src/models/poster.model.js';
import { GenerationLogModel } from '../src/models/generation-log.model.js';

useTestDb();
const logger = pino({ level: 'silent' });

function deps(over: Partial<GenerateDeps> = {}): GenerateDeps & { storage: MemoryStorage; renderer: FakeRenderer } {
  const storage = new MemoryStorage();
  return {
    storage,
    designProvider: new FakeDesignProvider(),
    backgrounds: createBackgroundService({ provider: new FakeBackgroundProvider(), storage, logger }),
    renderer: new FakeRenderer(),
    logger,
    renderTimeoutMs: 5_000,
    ...over,
  } as GenerateDeps & { storage: MemoryStorage; renderer: FakeRenderer };
}

describe('generatePoster', () => {
  it('renders the watermark for watermarked posters only', async () => {
    const d = deps();
    const { poster } = await seedPosterFixture(d.storage);
    await PosterModel.updateOne({ _id: poster.id }, { watermarked: true });
    await generatePoster(poster.id, d);
    expect(d.renderer.calls[0]).toContain('wm-badge');

    const clean = await seedPosterFixture(d.storage);
    await generatePoster(clean.poster.id, d);
    expect(d.renderer.calls[1]).not.toContain('wm-badge');
  });

  it('reuseDesign re-renders with the stored design without calling the AI', async () => {
    const d = deps();
    const { poster } = await seedPosterFixture(d.storage, { photos: 1 });
    const design = { paletteId: 'sunrise-red', motif: 'doves', headlineFont: 'hind-siliguri', headlineScale: 1.2, photoFocus: [{ x: 0.1, y: 0.9 }] };
    await PosterModel.updateOne({ _id: poster.id }, { design, reuseDesign: true });
    await generatePoster(poster.id, d);
    const p = (await PosterModel.findById(poster.id))!;
    expect(p.status).toBe('completed');
    expect(p.reuseDesign).toBe(false);
    expect(p.design).toMatchObject({ paletteId: 'sunrise-red', motif: 'doves', headlineScale: 1.2 });
    expect(await GenerationLogModel.countDocuments({ kind: 'design' })).toBe(0);
  });

  it('happy path: completed with stored image, design and success log', async () => {
    const d = deps();
    const { poster, userId } = await seedPosterFixture(d.storage);
    await generatePoster(poster.id, d);
    const p = (await PosterModel.findById(poster.id))!;
    expect(p.status).toBe('completed');
    expect(p.imagePublicId).toBe(`poster-maker/generated/${userId}/${poster.id}`);
    expect(d.storage.has(p.imagePublicId!)).toBe(true);
    expect(p.design?.photoFocus).toHaveLength(3);
    expect(d.renderer.calls[0]).toContain('মহান বিজয় দিবস');
    expect(await GenerationLogModel.countDocuments({ kind: 'design', success: true })).toBe(1);
  });

  it('design provider failure → still completes with template default design', async () => {
    const d = deps({ designProvider: new FakeDesignProvider('fail') });
    const { poster, template } = await seedPosterFixture(d.storage);
    await generatePoster(poster.id, d);
    const p = (await PosterModel.findById(poster.id))!;
    expect(p.status).toBe('completed');
    expect(p.design?.paletteId).toBe(template.defaultDesign.paletteId);
    expect(await GenerationLogModel.countDocuments({ kind: 'design', success: false })).toBe(1);
  });

  it('garbage design output is sanitized', async () => {
    const d = deps({ designProvider: new FakeDesignProvider(() => ({ paletteId: 'hacked', headlineScale: 99 })) });
    const { poster } = await seedPosterFixture(d.storage);
    await generatePoster(poster.id, d);
    const p = (await PosterModel.findById(poster.id))!;
    expect(p.design?.paletteId).toBe('flag-green');
    expect(p.design?.headlineScale).toBe(1.3);
  });

  it('background failure → gradient fallback, still completes', async () => {
    const storage = new MemoryStorage();
    const d = deps({ storage, backgrounds: createBackgroundService({ provider: new FakeBackgroundProvider('fail'), storage, logger }) });
    const { poster } = await seedPosterFixture(storage);
    await generatePoster(poster.id, d);
    expect((await PosterModel.findById(poster.id))!.status).toBe('completed');
    expect((d.renderer as FakeRenderer).calls[0]).toContain('linear-gradient');
  });

  it('renderer failure → failed with user-safe message', async () => {
    const d = deps({ renderer: new FakeRenderer('fail') });
    const { poster } = await seedPosterFixture(d.storage);
    await generatePoster(poster.id, d);
    const p = (await PosterModel.findById(poster.id))!;
    expect(p.status).toBe('failed');
    expect(p.error).toBe(GENERATION_FAILED_MESSAGE);
  });

  it('renderer hang → times out → failed', async () => {
    const d = deps({ renderer: new FakeRenderer('hang'), renderTimeoutMs: 50 });
    const { poster } = await seedPosterFixture(d.storage);
    await generatePoster(poster.id, d);
    expect((await PosterModel.findById(poster.id))!.status).toBe('failed');
  });

  it('skips posters that are not queued or were deleted', async () => {
    const d = deps();
    const { poster } = await seedPosterFixture(d.storage, { status: 'generating' });
    await generatePoster(poster.id, d);
    expect(d.renderer.calls).toHaveLength(0);
    await PosterModel.deleteOne({ _id: poster.id });
    await expect(generatePoster(poster.id, d)).resolves.toBeUndefined();
  });

  it('missing photo in storage → failed, not crash', async () => {
    const d = deps();
    const { poster } = await seedPosterFixture(d.storage);
    await d.storage.deleteImage(poster.photoIds[0]!);
    await generatePoster(poster.id, d);
    expect((await PosterModel.findById(poster.id))!.status).toBe('failed');
  });
});

describe('recoverJobs', () => {
  it('re-queues queued and stuck generating posters', async () => {
    const storage = new MemoryStorage();
    const a = await seedPosterFixture(storage, { status: 'generating' });
    const b = await seedPosterFixture(storage, { status: 'queued' });
    await seedPosterFixture(storage, { status: 'completed' });
    const enqueued: string[] = [];
    const n = await recoverJobs({ enqueue: (id) => enqueued.push(id) }, logger);
    expect(n).toBe(2);
    expect(enqueued.sort()).toEqual([a.poster.id, b.poster.id].sort());
    expect((await PosterModel.findById(a.poster.id))!.status).toBe('queued');
  });
});
