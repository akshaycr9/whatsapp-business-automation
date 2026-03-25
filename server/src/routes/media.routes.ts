import { Router } from 'express';
import * as whatsappService from '../services/whatsapp.service.js';
import { logger } from '../lib/logger.js';

const router = Router();

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
