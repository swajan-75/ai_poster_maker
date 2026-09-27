import sharp from 'sharp';
import { DEFAULT_POSTER_SIZE, outputPixels, type PosterSize } from '@poster/shared';
import type { PdfOptions, PosterRenderer } from './renderer.js';

export class FakeRenderer implements PosterRenderer {
  calls: string[] = [];
  sizes: PosterSize[] = [];
  pdfCalls: PdfOptions[] = [];
  constructor(private readonly behavior: 'ok' | 'fail' | 'hang' = 'ok') {}
  async render(html: string, size: PosterSize = DEFAULT_POSTER_SIZE): Promise<Buffer> {
    this.calls.push(html);
    this.sizes.push(size);
    if (this.behavior === 'fail') throw new Error('render failed');
    if (this.behavior === 'hang') return new Promise<Buffer>(() => undefined);
    const { width, height } = outputPixels(size);
    return sharp({ create: { width, height, channels: 3, background: '#006A4E' } }).png().toBuffer();
  }
  async renderPdf(html: string, opts: PdfOptions): Promise<Buffer> {
    this.calls.push(html);
    this.pdfCalls.push(opts);
    if (this.behavior === 'fail') throw new Error('render failed');
    return Buffer.from('%PDF-1.4\n% fake\n%%EOF\n');
  }
  async close(): Promise<void> {}
}
