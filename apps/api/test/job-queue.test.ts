import { describe, expect, it } from 'vitest';
import pino from 'pino';
import { JobQueue } from '../src/jobs/job-queue.js';

const logger = pino({ level: 'silent' });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('JobQueue', () => {
  it('respects concurrency', async () => {
    let active = 0; let peak = 0;
    const q = new JobQueue(async () => { active++; peak = Math.max(peak, active); await sleep(20); active--; }, { concurrency: 2, logger });
    ['a', 'b', 'c', 'd', 'e'].forEach((id) => q.enqueue(id));
    await q.onIdle();
    expect(peak).toBe(2);
  });

  it('dedupes ids already pending or running', async () => {
    const seen: string[] = [];
    const q = new JobQueue(async (id) => { seen.push(id); await sleep(10); }, { concurrency: 1, logger });
    q.enqueue('a'); q.enqueue('a'); q.enqueue('b'); q.enqueue('a');
    await q.onIdle();
    expect(seen).toEqual(['a', 'b']);
  });

  it('keeps processing after a job throws', async () => {
    const seen: string[] = [];
    const q = new JobQueue(async (id) => { if (id === 'bad') throw new Error('x'); seen.push(id); }, { concurrency: 1, logger });
    q.enqueue('bad'); q.enqueue('good');
    await q.onIdle();
    expect(seen).toEqual(['good']);
  });

  it('drain stops accepting new jobs and waits for running ones', async () => {
    const seen: string[] = [];
    const q = new JobQueue(async (id) => { await sleep(30); seen.push(id); }, { concurrency: 1, logger });
    q.enqueue('a');
    const d = q.drain(1000);
    q.enqueue('late');
    await d;
    expect(seen).toEqual(['a']);
  });
});
