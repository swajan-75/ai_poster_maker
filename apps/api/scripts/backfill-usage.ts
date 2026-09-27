/**
 * One-time: creates a PosterUsage row for every existing poster that doesn't have one, dated at the
 * poster's createdAt, so the daily quota and analytics also count posters made before usage tracking.
 * Safe to re-run. Deleted posters from before tracking can't be recovered.
 * Usage: npm run backfill-usage -w @poster/api
 */
import { loadEnv } from '../src/config/env.js';
import { connectDb, disconnectDb } from '../src/db/connect.js';
import { PosterModel } from '../src/models/poster.model.js';
import { PosterUsageModel } from '../src/models/poster-usage.model.js';

const env = loadEnv();
await connectDb(env.MONGODB_URI);
const tracked = new Set((await PosterUsageModel.distinct('posterId')).map(String));
const missing = await PosterModel.find({}, { userId: 1, templateId: 1, createdAt: 1 }).lean();
const rows = missing
  .filter((p) => !tracked.has(String(p._id)))
  .map((p) => ({ userId: p.userId, posterId: p._id, templateId: p.templateId, plan: 'free', createdAt: p.createdAt }));
// Driver-level insert: Mongoose would overwrite createdAt with "now".
if (rows.length) await PosterUsageModel.collection.insertMany(rows);
console.log(`Backfilled ${rows.length} poster usage row(s).`);
await disconnectDb();
