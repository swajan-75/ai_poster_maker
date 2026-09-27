import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import type { StorageService, StoredImage, UrlOptions } from './storage.js';
import { notFound } from '../../lib/errors.js';

export class MemoryStorage implements StorageService {
  private files = new Map<string, Buffer>();

  /** With `urlBase` (e.g. '/api/files'), URLs point at the files route instead of inlining multi-MB data URIs. */
  constructor(private readonly opts: { urlBase?: string } = {}) {}

  has(publicId: string) { return this.files.has(publicId); }

  async uploadImage(buf: Buffer, opts: { folder: string; publicId?: string; overwrite?: boolean }): Promise<StoredImage> {
    const publicId = `${opts.folder}/${opts.publicId ?? randomUUID().replace(/-/g, '')}`;
    this.files.set(publicId, buf);
    const meta = await sharp(buf).metadata();
    return { publicId, url: this.getUrl(publicId), width: meta.width ?? 0, height: meta.height ?? 0 };
  }

  async fetchImage(publicId: string): Promise<Buffer> {
    const b = this.files.get(publicId);
    if (!b) throw notFound(`Image ${publicId} not found`);
    return b;
  }

  getUrl(publicId: string, opts: UrlOptions = {}): string {
    if (this.opts.urlBase) {
      const q = new URLSearchParams();
      if (opts.format) q.set('format', opts.format);
      if (opts.download) q.set('download', '1');
      if (opts.width) q.set('width', String(opts.width));
      if (opts.version) q.set('v', String(opts.version));
      const qs = q.toString();
      return `${this.opts.urlBase}/${encodeURIComponent(publicId)}${qs ? `?${qs}` : ''}`;
    }
    const b = this.files.get(publicId);
    return b ? `data:image/png;base64,${b.toString('base64')}` : `memory://${publicId}`;
  }

  async deleteImage(publicId: string): Promise<void> { this.files.delete(publicId); }
}
