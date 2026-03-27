import { Router } from 'express';
import { z } from 'zod';
import * as automationService from '../services/automation.service.js';
import * as buttonReplyService from '../services/button-reply.service.js';

const router = Router();

const automationSchema = z.object({
  name: z.string().min(1),
  shopifyEvent: z.enum([
    'PREPAID_ORDER_CONFIRMED',
    'COD_ORDER_CONFIRMED',
    'ORDER_FULFILLED',
    'ABANDONED_CART',
  ]),
  templateId: z.string().cuid(),
  variableMapping: z.record(z.string()),
  isActive: z.boolean().default(true),
  delayMinutes: z.number().int().min(0).default(0),
});

// GET /api/automations
router.get('/', async (req, res, next) => {
  try {
    const page = req.query['page'] !== undefined ? Number(req.query['page']) : undefined;
    const limit = req.query['limit'] !== undefined ? Number(req.query['limit']) : undefined;

    const result = await automationService.list({ page, limit });
    res.json({ data: result.items, meta: result.meta });
  } catch (err: unknown) {
    next(err);
  }
});

// GET /api/automations/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await automationService.getById(req.params['id'] as string);
    res.json({ data: result });
  } catch (err: unknown) {
    next(err);
  }
});

// POST /api/automations
router.post('/', async (req, res, next) => {
  try {
    const body = automationSchema.parse(req.body);
    const result = await automationService.create(body);
    res.status(201).json({ data: result });
  } catch (err: unknown) {
    next(err);
  }
});

// PUT /api/automations/:id
router.put('/:id', async (req, res, next) => {
  try {
    const body = automationSchema.partial().parse(req.body);
    const result = await automationService.update(req.params['id'] as string, body);
    res.json({ data: result });
  } catch (err: unknown) {
    next(err);
  }
});

// DELETE /api/automations/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await automationService.remove(req.params['id'] as string);
    res.sendStatus(204);
  } catch (err: unknown) {
    next(err);
  }
});

// PATCH /api/automations/:id/toggle
router.patch('/:id/toggle', async (req, res, next) => {
  try {
    const result = await automationService.toggle(req.params['id'] as string);
    res.json({ data: result });
  } catch (err: unknown) {
    next(err);
  }
});

// GET /api/automations/:id/logs
router.get('/:id/logs', async (req, res, next) => {
  try {
    const page = req.query['page'] !== undefined ? Number(req.query['page']) : undefined;
    const limit = req.query['limit'] !== undefined ? Number(req.query['limit']) : undefined;

    const result = await automationService.getLogs(req.params['id'] as string, { page, limit });
    res.json({ data: result.items, meta: result.meta });
  } catch (err: unknown) {
    next(err);
  }
});

const buttonReplyItemSchema = z.object({
  buttonText: z.string().min(1).max(20),
  replyTemplateId: z.string().cuid(),
  variableMapping: z.record(z.string()),
});

const buttonRepliesSchema = z.array(buttonReplyItemSchema);

// GET /api/automations/:id/button-replies
router.get('/:id/button-replies', async (req, res, next) => {
  try {
    const result = await buttonReplyService.listForAutomation(req.params['id'] as string);
    res.json({ data: result });
  } catch (err: unknown) {
    next(err);
  }
});

// PUT /api/automations/:id/button-replies
router.put('/:id/button-replies', async (req, res, next) => {
  try {
    const inputs = buttonRepliesSchema.parse(req.body);
    await buttonReplyService.upsertButtonReplies(req.params['id'] as string, inputs);
    const result = await buttonReplyService.listForAutomation(req.params['id'] as string);
    res.json({ data: result });
  } catch (err: unknown) {
    next(err);
  }
});

export default router;
