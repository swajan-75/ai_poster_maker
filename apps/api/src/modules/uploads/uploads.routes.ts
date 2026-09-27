import { Router } from 'express';
import multer from 'multer';
import { MAX_UPLOAD_BYTES, type UploadedPhotoDTO } from '@poster/shared';
import type { AppDeps } from '../../runtime-types.js';
import { requireAuth } from '../../http/middleware/auth.js';
import { uploadLimiter } from '../../http/middleware/rate-limit.js';
import { badRequest } from '../../lib/errors.js';
import { uploadFolder } from '../../services/storage/paths.js';
import { normalizePhoto } from './normalize-photo.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } });

export function uploadsRouter({ env, storage }: AppDeps): Router {
  const r = Router();
  r.post('/', requireAuth(env), uploadLimiter(), upload.single('photo'), async (req, res) => {
    if (!req.file) throw badRequest('VALIDATION_ERROR', 'Field "photo" is required');
    const photo = await normalizePhoto(req.file.buffer);
    const stored = await storage.uploadImage(photo.buffer, { folder: uploadFolder(req.user!.id) });
    const dto: UploadedPhotoDTO = {
      publicId: stored.publicId, url: storage.getUrl(stored.publicId, { width: 600 }),
      width: photo.width, height: photo.height,
    };
    res.status(201).json(dto);
  });
  return r;
}
