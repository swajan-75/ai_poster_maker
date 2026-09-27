import sharp from 'sharp';
import type { PosterRenderer } from './renderer.js';

export class FakeRenderer implements PosterRenderer {
  calls: string[] = [];
  constructor(private readonly behavior: 'ok' | 'fail' | 'hang' = 'ok') {}
  async render(html: string): Promise<Buffer> {
    this.calls.push(html);
    if (this.behavior === 'fail') throw new Error('render failed');
    if (this.behavior === 'hang') return new Promise<Buffer>(() => undefined);
    return sharp({ create: { width: 1800, height: 2400, channels: 3, background: '#006A4E' } }).png().toBuffer();
  }
  async close(): Promise<void> {}
}
