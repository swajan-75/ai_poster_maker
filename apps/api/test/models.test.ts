import { describe, expect, it } from 'vitest';
import { Types } from 'mongoose';
import { useTestDb } from './setup-db.js';
import { UserModel } from '../src/models/user.model.js';
import { PosterModel } from '../src/models/poster.model.js';
import { TemplateModel } from '../src/models/template.model.js';
import { BackgroundCacheModel } from '../src/models/background-cache.model.js';

useTestDb();

const form = { name: 'করিম', designation: 'সভাপতি', organization: 'কমিটি', union: '', thana: '', district: 'ঢাকা', headline: 'বিজয় দিবস', tagline: '' };

describe('models', () => {
  it('User email is unique and lowercased', async () => {
    await UserModel.create({ name: 'A', email: 'A@x.com', passwordHash: 'h' });
    await expect(UserModel.create({ name: 'B', email: 'a@x.com', passwordHash: 'h' })).rejects.toThrow(/duplicate key/);
  });

  it('User role defaults to user', async () => {
    const u = await UserModel.create({ name: 'A', email: 'b@x.com', passwordHash: 'h' });
    expect(u.role).toBe('user');
  });

  it('Poster defaults: queued, 0 regenerations', async () => {
    const p = await PosterModel.create({
      userId: new Types.ObjectId(), templateId: new Types.ObjectId(), formData: form, photoIds: ['p1'],
    });
    expect(p.status).toBe('queued');
    expect(p.regenerateCount).toBe(0);
  });

  it('Template rejects invalid palette hex and bad photoSlots', async () => {
    await expect(TemplateModel.create({
      slug: 't', title: 'T', occasion: 'victory_day', layoutKey: 'victory', photoSlots: 5,
      thumbnailUrl: '/x.png', defaultHeadline: 'H',
      palettes: [{ id: 'p', name: 'P', primary: 'red', secondary: '#000000', accent: '#000000', text: '#000000', footerBg: '#000000' }],
      motifs: ['doves'],
      defaultDesign: { paletteId: 'p', motif: 'doves', headlineFont: 'hind-siliguri', headlineScale: 1, photoFocus: [] },
    })).rejects.toThrow(/validation failed/i);
  });

  it('BackgroundCache key is unique', async () => {
    const doc = { key: 'k', templateId: new Types.ObjectId(), paletteId: 'p', motif: 'doves', publicId: 'x' };
    await BackgroundCacheModel.create(doc);
    await expect(BackgroundCacheModel.create(doc)).rejects.toThrow(/duplicate key/);
  });
});
