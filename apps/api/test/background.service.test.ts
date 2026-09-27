import { describe, expect, it } from 'vitest';
import pino from 'pino';
import { Types } from 'mongoose';
import { useTestDb } from './setup-db.js';
import { createBackgroundService, backgroundKey } from '../src/services/background/background.service.js';
import { FakeBackgroundProvider } from '../src/services/ai/fake-background-provider.js';
import { MemoryStorage } from '../src/services/storage/memory-storage.js';
import { BackgroundCacheModel } from '../src/models/background-cache.model.js';
import { GenerationLogModel } from '../src/models/generation-log.model.js';

useTestDb();
const logger = pino({ level: 'silent' });
const palette = { id: 'g', name: 'g', primary: '#006A4E', secondary: '#F42A41', accent: '#FFD700', text: '#FFFFFF', footerBg: '#004D38' };
const tpl = () => ({ id: new Types.ObjectId().toString(), occasion: 'victory_day' as const, palettes: [palette] });

describe('BackgroundService', () => {
  it('generates once, then serves from cache', async () => {
    const provider = new FakeBackgroundProvider();
    const svc = createBackgroundService({ provider, storage: new MemoryStorage(), logger });
    const t = tpl();
    const a = await svc.getBackground(t, 'g', 'doves');
    const b = await svc.getBackground(t, 'g', 'doves');
    expect(a).not.toBeNull();
    expect(b!.equals(a!)).toBe(true);
    expect(provider.calls).toHaveLength(1);
    expect(await BackgroundCacheModel.countDocuments({ key: backgroundKey(t.id, 'g', 'doves') })).toBe(1);
    expect(await GenerationLogModel.countDocuments({ kind: 'background', success: true })).toBe(1);
  });

  it('dedupes concurrent misses for the same key', async () => {
    const provider = new FakeBackgroundProvider();
    const svc = createBackgroundService({ provider, storage: new MemoryStorage(), logger });
    const t = tpl();
    await Promise.all([svc.getBackground(t, 'g', 'doves'), svc.getBackground(t, 'g', 'doves'), svc.getBackground(t, 'g', 'doves')]);
    expect(provider.calls).toHaveLength(1);
  });

  it('returns null (gradient fallback) when the provider fails, and logs failure', async () => {
    const svc = createBackgroundService({ provider: new FakeBackgroundProvider('fail'), storage: new MemoryStorage(), logger });
    expect(await svc.getBackground(tpl(), 'g', 'doves')).toBeNull();
    expect(await GenerationLogModel.countDocuments({ kind: 'background', success: false })).toBe(1);
  });

  it('returns null for an unknown palette without calling the provider', async () => {
    const provider = new FakeBackgroundProvider();
    const svc = createBackgroundService({ provider, storage: new MemoryStorage(), logger });
    expect(await svc.getBackground(tpl(), 'nope', 'doves')).toBeNull();
    expect(provider.calls).toHaveLength(0);
  });

  it('regenerates if the cached file vanished from storage', async () => {
    const provider = new FakeBackgroundProvider();
    const storage = new MemoryStorage();
    const svc = createBackgroundService({ provider, storage, logger });
    const t = tpl();
    await svc.getBackground(t, 'g', 'doves');
    const cached = await BackgroundCacheModel.findOne();
    await storage.deleteImage(cached!.publicId);
    expect(await svc.getBackground(t, 'g', 'doves')).not.toBeNull();
    expect(provider.calls).toHaveLength(2);
  });
});
