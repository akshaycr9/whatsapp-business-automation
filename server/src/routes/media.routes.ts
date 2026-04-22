import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import * as whatsappService from '../services/whatsapp.service.js';
import { logger } from '../lib/logger.js';
import { AppError } from '../lib/app-error.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

// Supported MIME types for each media type
const SUPPORTED_MIME_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png'],
  video: ['video/mp4'],
  audio: ['audio/aac', 'audio/mpeg', 'audio/ogg', 'audio/wav'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

// POST /api/media/upload
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError(400, 'No file provided', 'MISSING_FILE');
    }

    const querySchema = z.object({
      mediaType: z.enum(['image', 'video', 'audio', 'document']),
    });

    const { mediaType } = querySchema.parse(req.query);
    const supportedTypes = SUPPORTED_MIME_TYPES[mediaType] ?? [];

    if (!supportedTypes.includes(req.file.mimetype)) {
      throw new AppError(
        400,
        `Unsupported media type. Supported types for ${mediaType}: ${supportedTypes.join(', ')}`,
        'UNSUPPORTED_MIME_TYPE'
      );
    }

    const result = await whatsappService.uploadMedia({
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
    });

    res.status(201).json({ data: result });
  } catch (error) {
    logger.error('Media upload error:', error);
    next(error);
  }
});

// GET /api/media/:mediaId
router.get('/:mediaId', async (req, res, next) => {
  try {
    const { mediaId } = req.params as { mediaId: string };
    const info = await whatsappService.getMediaInfo(mediaId);
    const buffer = await whatsappService.downloadMedia(info.url);
    res.setHeader('Content-Type', info.mime_type);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.send(buffer);
  } catch (error) {
    logger.error('Media proxy error:', error);
    next(error);
  }
});

export default router;
