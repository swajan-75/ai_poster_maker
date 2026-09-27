export interface StoredImage { publicId: string; url: string; width: number; height: number }
export interface UrlOptions { format?: 'png' | 'jpg'; download?: boolean; width?: number; version?: number }
export interface StorageService {
  uploadImage(buf: Buffer, opts: { folder: string; publicId?: string; overwrite?: boolean }): Promise<StoredImage>;
  fetchImage(publicId: string): Promise<Buffer>;
  getUrl(publicId: string, opts?: UrlOptions): string;
  deleteImage(publicId: string): Promise<void>;
}
