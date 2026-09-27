import { randomUUID } from 'node:crypto';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import type { StorageService, StoredImage, UrlOptions } from './storage.js';

export class CloudinaryStorage implements StorageService {
  constructor(cfg: { cloudName: string; apiKey: string; apiSecret: string }) {
    cloudinary.config({ cloud_name: cfg.cloudName, api_key: cfg.apiKey, api_secret: cfg.apiSecret, secure: true });
  }

  uploadImage(buf: Buffer, opts: { folder: string; publicId?: string; overwrite?: boolean }): Promise<StoredImage> {
    // Full path in public_id (no `folder` param): identical behaviour in fixed- and dynamic-folder Cloudinary accounts,
    // so publicIds always look like `poster-maker/uploads/<userId>/<id>` (required by isOwnedUpload).
    const id = opts.publicId ?? randomUUID().replace(/-/g, '');
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { public_id: `${opts.folder}/${id}`, overwrite: opts.overwrite ?? false, resource_type: 'image', invalidate: true },
        (err, res?: UploadApiResponse) => {
          if (err || !res) return reject(err ?? new Error('Cloudinary upload failed'));
          resolve({ publicId: res.public_id, url: res.secure_url, width: res.width, height: res.height });
        },
      );
      stream.end(buf);
    });
  }

  async fetchImage(publicId: string): Promise<Buffer> {
    const res = await fetch(this.getUrl(publicId), { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`Cloudinary fetch ${publicId} failed: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }

  getUrl(publicId: string, opts: UrlOptions = {}): string {
    return cloudinary.url(publicId, {
      secure: true,
      format: opts.format,
      version: opts.version,
      transformation: [
        ...(opts.width ? [{ width: opts.width, crop: 'limit' }] : []),
        ...(opts.download ? [{ flags: 'attachment' }] : []),
      ],
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  }
}
