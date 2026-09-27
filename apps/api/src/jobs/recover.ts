import type { Logger } from '../lib/logger.js';
import { PosterModel } from '../models/poster.model.js';
import type { PosterQueue } from './job-queue.js';

export async function recoverJobs(queue: PosterQueue, logger: Logger): Promise<number> {
  await PosterModel.updateMany({ status: 'generating' }, { $set: { status: 'queued' } });
  const ids = await PosterModel.find({ status: 'queued' }).sort({ createdAt: 1 }).select('_id').lean();
  ids.forEach(({ _id }) => queue.enqueue(_id.toString()));
  if (ids.length) logger.info({ count: ids.length }, 'recovered pending poster jobs');
  return ids.length;
}
