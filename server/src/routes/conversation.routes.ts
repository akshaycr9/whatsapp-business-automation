import { Router } from 'express';
import { z } from 'zod';
import * as conversationService from '../services/conversation.service.js';
import * as messageService from '../services/message.service.js';

const router = Router();

const sendTemplateSchema = z.object({
  templateId: z.string().min(1),
  variables: z.record(z.string(), z.string()).optional().default({}),
});

const sendMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('TEXT'),
    text: z.string().min(1),
  }),
  z.object({
    type: z.literal('IMAGE'),
    mediaId: z.string().min(1),
    mimeType: z.string().optional(),
    caption: z.string().optional(),
  }),
  z.object({
    type: z.literal('VIDEO'),
    mediaId: z.string().min(1),
    mimeType: z.string().optional(),
    caption: z.string().optional(),
  }),
  z.object({
    type: z.literal('AUDIO'),
    mediaId: z.string().min(1),
    mimeType: z.string().optional(),
  }),
  z.object({
    type: z.literal('DOCUMENT'),
    mediaId: z.string().min(1),
    mimeType: z.string().optional(),
    filename: z.string().optional(),
    caption: z.string().optional(),
  }),
]);

// GET /api/conversations
router.get('/', async (req, res, next) => {
  try {
    const page = req.query['page'] !== undefined ? Number(req.query['page']) : undefined;
    const limit = req.query['limit'] !== undefined ? Number(req.query['limit']) : undefined;
    const search = typeof req.query['search'] === 'string' ? req.query['search'] : undefined;
    const category = typeof req.query['category'] === 'string' ? req.query['category'] : undefined;

    let result;
    if (category === 'requesting' || category === 'intervened' || category === 'chats') {
      result = await conversationService.listByCategory(category, { page, limit, search });
    } else {
      result = await conversationService.listCategorized({ page, limit, search });
    }

    res.json({ data: result.items, meta: result.meta });
  } catch (err: unknown) {
    next(err);
  }
});

// GET /api/conversations/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await conversationService.getById(req.params['id'] as string);

    // Calculate window status and include in response
    const isOpen = await conversationService.isWithin24HourWindow(result.id);

    res.json({
      data: {
        ...result,
        isWithin24HourWindow: isOpen,
      }
    });
  } catch (err: unknown) {
    next(err);
  }
});

// GET /api/conversations/:id/messages
router.get('/:id/messages', async (req, res, next) => {
  try {
    const conversationId = req.params['id'] as string;
    const cursor = typeof req.query['cursor'] === 'string' ? req.query['cursor'] : undefined;
    const limit =
      req.query['limit'] !== undefined ? Number(req.query['limit']) : 50;

    const result = await conversationService.getMessages(conversationId, { cursor, limit });

    // Calculate window status and include in response meta
    const isWithin24HourWindow = await conversationService.isWithin24HourWindow(conversationId);

    res.json({
      data: result.items,
      meta: {
        ...result.meta,
        isWithin24HourWindow,
      }
    });
  } catch (err: unknown) {
    next(err);
  }
});

// POST /api/conversations/:id/messages — send text or media reply
router.post('/:id/messages', async (req, res, next) => {
  try {
    const conversationId = req.params['id'] as string;
    const payload = sendMessageSchema.parse(req.body);

    let message;
    switch (payload.type) {
      case 'TEXT':
        message = await messageService.sendTextReply(conversationId, payload.text);
        break;
      case 'IMAGE':
        message = await messageService.sendImageMessage(conversationId, payload.mediaId, payload.caption, payload.mimeType);
        break;
      case 'VIDEO':
        message = await messageService.sendVideoMessage(conversationId, payload.mediaId, payload.caption, payload.mimeType);
        break;
      case 'AUDIO':
        message = await messageService.sendAudioMessage(conversationId, payload.mediaId, payload.mimeType);
        break;
      case 'DOCUMENT':
        message = await messageService.sendDocumentMessage(
          conversationId,
          payload.mediaId,
          payload.filename,
          payload.caption,
          payload.mimeType
        );
        break;
    }

    res.status(201).json({ data: message });
  } catch (err: unknown) {
    next(err);
  }
});

// POST /api/conversations/:id/messages/template — send template message
router.post('/:id/messages/template', async (req, res, next) => {
  try {
    const conversationId = req.params['id'] as string;
    const { templateId, variables } = sendTemplateSchema.parse(req.body);
    const message = await messageService.sendTemplateReply(conversationId, templateId, variables);
    res.status(201).json({ data: message });
  } catch (err: unknown) {
    next(err);
  }
});

// PATCH /api/conversations/:id/read — mark as read
router.patch('/:id/read', async (req, res, next) => {
  try {
    await conversationService.markRead(req.params['id'] as string);
    res.json({ data: { success: true } });
  } catch (err: unknown) {
    next(err);
  }
});

// GET /api/conversations/:id/window — check 24h window
router.get('/:id/window', async (req, res, next) => {
  try {
    const isOpen = await conversationService.isWithin24HourWindow(req.params['id'] as string);
    res.json({ data: { isOpen } });
  } catch (err: unknown) {
    next(err);
  }
});

export default router;
