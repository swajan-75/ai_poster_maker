import sharp from 'sharp';
import type { BackgroundProvider, BackgroundResult } from './background-provider.js';

export class FakeBackgroundProvider implements BackgroundProvider {
  calls: string[] = [];
  constructor(private readonly behavior: 'ok' | 'fail' = 'ok') {}
  async generate(prompt: string): Promise<BackgroundResult> {
    this.calls.push(prompt);
    await new Promise((r) => setTimeout(r, 10)); // lets concurrent callers overlap in tests
    if (this.behavior === 'fail') throw new Error('fake background failure');
    const image = await sharp({ create: { width: 768, height: 1024, channels: 3, background: '#1b5e20' } }).png().toBuffer();
    return { image, model: 'fake', latencyMs: 10 };
  }
}
