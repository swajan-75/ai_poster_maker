import sharp from 'sharp';
import { Types } from 'mongoose';
import type { PosterStatus } from '@poster/shared';
import type { StorageService } from '../src/services/storage/storage.js';
import { uploadFolder } from '../src/services/storage/paths.js';
import { PosterModel } from '../src/models/poster.model.js';
import { TemplateModel } from '../src/models/template.model.js';
import { seedTemplates } from '../scripts/seed-data.js';
const solid = (w: number, h: number) =>
  sharp({ create: { width: w, height: h, channels: 3, background: { r: 200, g: 50, b: 50 } } });
export const makeJpeg = (w: number, h: number, opts: { orientation?: number } = {}) =>
  solid(w, h).jpeg().withMetadata(opts.orientation ? { orientation: opts.orientation } : {}).toBuffer();
export const makePng = (w: number, h: number) =>
  sharp({ create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0.5 } } }).png().toBuffer();
export const makeAvif = (w: number, h: number) => solid(w, h).avif().toBuffer();

export const sampleForm = {
  name: 'মোঃ আব্দুল করিম', designation: 'সভাপতি', organization: '৩নং ওয়ার্ড কমিটি',
  union: '', thana: 'সাভার', district: 'ঢাকা', headline: 'মহান বিজয় দিবস', tagline: '',
};

export async function seedPosterFixture(storage: StorageService, opts: { photos?: number; status?: PosterStatus; userId?: string } = {}) {
  await seedTemplates();
  const template = (await TemplateModel.findOne({ slug: 'victory-day-classic' }))!;
  const userId = opts.userId ?? new Types.ObjectId().toString();
  const photoIds: string[] = [];
  for (let i = 0; i < (opts.photos ?? 3); i++) {
    photoIds.push((await storage.uploadImage(await makeJpeg(600, 800), { folder: uploadFolder(userId) })).publicId);
  }
  const poster = await PosterModel.create({ userId, templateId: template._id, formData: sampleForm, photoIds, status: opts.status ?? 'queued' });
  return { poster, template, userId };
}
