import { Router } from 'express';
import { z } from 'zod';
import * as conversationService from '../services/conversation.service.js';
import * as messageService from '../services/message.service.js';

const router = Router();

const sendTextSchema = z.object({
  text: z.string().min(1),
});

const sendTemplateSchema = z.object({
  templateId: z.string().min(1),
  variables: z.record(z.string(), z.string()).optional().default({}),
});

// GET /api/conversations
router.get('/', async (req, res, next) => {
  try {
    const page = req.query['page'] !== undefined ? Number(req.query['page']) : undefined;
    const limit = req.query['limit'] !== undefined ? Number(req.query['limit']) : undefined;
    const search = typeof req.query['search'] === 'string' ? req.query['search'] : undefined;

    const result = await conversationService.list({ page, limit, search });
    res.json({ data: result.items, meta: result.meta });
  } catch (err: unknown) {
    next(err);
  }
});

// GET /api/conversations/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await conversationService.getById(req.params['id'] as string);
    res.json({ data: result });
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
    res.json({ data: result.items, meta: result.meta });
  } catch (err: unknown) {
    next(err);
  }
});

// POST /api/conversations/:id/messages — send text reply
router.post('/:id/messages', async (req, res, next) => {
  try {
    const conversationId = req.params['id'] as string;
    const { text } = sendTextSchema.parse(req.body);
    const message = await messageService.sendTextReply(conversationId, text);
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
