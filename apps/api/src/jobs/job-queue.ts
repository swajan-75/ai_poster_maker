import type { Logger } from '../lib/logger.js';

export interface PosterQueue { enqueue(posterId: string): void }

export class JobQueue implements PosterQueue {
  private queue: string[] = [];
  private active = new Set<string>();
  private idleWaiters: (() => void)[] = [];
  private accepting = true;

  constructor(private readonly processor: (id: string) => Promise<void>, private readonly opts: { concurrency: number; logger: Logger }) {}

  get pending() { return this.queue.length; }
  get running() { return this.active.size; }

  enqueue(id: string): void {
    if (!this.accepting || this.active.has(id) || this.queue.includes(id)) return;
    this.queue.push(id);
    this.pump();
  }

  onIdle(): Promise<void> {
    if (this.queue.length === 0 && this.active.size === 0) return Promise.resolve();
    return new Promise((r) => this.idleWaiters.push(r));
  }

  async drain(timeoutMs: number): Promise<void> {
    this.accepting = false;
    this.queue = []; // left as 'queued' in Mongo → recovered on next boot
    await Promise.race([this.onIdle(), new Promise((r) => setTimeout(r, timeoutMs))]);
  }

  private pump(): void {
    while (this.active.size < this.opts.concurrency && this.queue.length > 0) {
      const id = this.queue.shift()!;
      this.active.add(id);
      this.processor(id)
        .catch((err) => this.opts.logger.error({ err, posterId: id }, 'job crashed'))
        .finally(() => {
          this.active.delete(id);
          if (this.queue.length === 0 && this.active.size === 0) this.idleWaiters.splice(0).forEach((r) => r());
          else this.pump();
        });
    }
  }
}
