import { MAX_REGENERATIONS, type PosterDTO, type PosterFormData } from '@poster/shared';
import type { PosterDoc } from '../../models/poster.model.js';
import type { StorageService } from '../../services/storage/storage.js';

export function toPosterDTO(p: PosterDoc, storage: StorageService): PosterDTO {
  const done = p.status === 'completed' && p.imagePublicId;
  const version = p.updatedAt ? Math.floor(p.updatedAt.getTime() / 1000) : undefined;
  return {
    id: p.id,
    templateId: p.templateId.toString(),
    formData: p.formData as PosterFormData,
    status: p.status,
    imageUrl: done ? storage.getUrl(p.imagePublicId!, { format: 'jpg', width: 900, version }) : null,
    downloadUrls: done
      ? { png: storage.getUrl(p.imagePublicId!, { format: 'png', download: true, version }),
          jpg: storage.getUrl(p.imagePublicId!, { format: 'jpg', download: true, version }) }
      : null,
    regenerationsLeft: Math.max(0, MAX_REGENERATIONS - p.regenerateCount),
    error: p.error ?? null,
    createdAt: p.createdAt.toISOString(),
  };
}
