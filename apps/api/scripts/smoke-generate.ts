import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { Types } from 'mongoose';
import { loadEnv } from '../src/config/env.js';
import { createLogger } from '../src/lib/logger.js';
import { connectDb, disconnectDb } from '../src/db/connect.js';
import { buildRuntime } from '../src/runtime.js';
import { seedTemplates } from './seed-data.js';
import { TemplateModel } from '../src/models/template.model.js';
import { PosterModel } from '../src/models/poster.model.js';
import { normalizePhoto } from '../src/modules/uploads/normalize-photo.js';
import { uploadFolder } from '../src/services/storage/paths.js';

const [slug = 'victory-day-classic', ...photoPaths] = process.argv.slice(2);
const env = loadEnv();
const logger = createLogger(env);
await connectDb(env.MONGODB_URI);
await seedTemplates();
const rt = buildRuntime(env, logger);
const t = await TemplateModel.findOne({ slug });
if (!t) throw new Error(`unknown template ${slug}`);
const userId = new Types.ObjectId().toString();
const photoIds: string[] = [];
for (const p of photoPaths.slice(0, t.photoSlots)) {
  const n = await normalizePhoto(await readFile(p));
  photoIds.push((await rt.storage.uploadImage(n.buffer, { folder: uploadFolder(userId) })).publicId);
}
const poster = await PosterModel.create({
  userId, templateId: t._id, photoIds,
  formData: { name: 'মোঃ আব্দুল করিম', designation: 'সভাপতি', organization: '৩নং ওয়ার্ড উন্নয়ন কমিটি', union: 'আশুলিয়া', thana: 'সাভার', district: 'ঢাকা', headline: t.defaultHeadline, tagline: '' },
});
rt.queue.enqueue(poster.id);
await rt.jobQueue.onIdle();
const done = await PosterModel.findById(poster.id);
if (done?.status !== 'completed') throw new Error(`generation ${done?.status}: ${done?.error}`);
await mkdir('out', { recursive: true });
await writeFile(`out/${slug}.png`, await rt.storage.fetchImage(done.imagePublicId!));
console.log(`wrote out/${slug}.png`, done.design);
await rt.renderer.close();
await disconnectDb();
