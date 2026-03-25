import { Router } from 'express';
import { z } from 'zod';
import * as templateService from '../services/template.service.js';

const router = Router();

const createTemplateSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-z_]+$/, 'Name must be lowercase letters and underscores only'),
  language: z.string().min(2),
  category: z.enum(['MARKETING', 'UTILITY', 'AUTHENTICATION']),
  components: z
    .array(
      z.object({
        type: z.enum(['HEADER', 'BODY', 'FOOTER', 'BUTTONS']),
        format: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT']).optional(),
        text: z.string().optional(),
        buttons: z
          .array(
            z.object({
              type: z.enum(['QUICK_REPLY', 'URL', 'PHONE_NUMBER']),
              text: z.string(),
              url: z.string().optional(),
              phone_number: z.string().optional(),
            }),
          )
          .optional(),
      }),
    )
    .min(1),
});

// POST /api/templates/sync-all — must come before /:id
router.post('/sync-all', async (_req, res, next) => {
  try {
    const result = await templateService.syncAll();
    res.json({ data: result });
  } catch (err: unknown) {
    next(err);
  }
});

// GET /api/templates
router.get('/', async (req, res, next) => {
  try {
    const page = req.query['page'] !== undefined ? Number(req.query['page']) : undefined;
    const limit = req.query['limit'] !== undefined ? Number(req.query['limit']) : undefined;
    const status = typeof req.query['status'] === 'string' ? req.query['status'] : undefined;
    const search = typeof req.query['search'] === 'string' ? req.query['search'] : undefined;

    const result = await templateService.list({ page, limit, status, search });
    res.json({ data: result.items, meta: result.meta });
  } catch (err: unknown) {
    next(err);
  }
});

// GET /api/templates/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await templateService.getById(req.params['id'] as string);
    res.json({ data: result });
  } catch (err: unknown) {
    next(err);
  }
});

// POST /api/templates
router.post('/', async (req, res, next) => {
  try {
    const body = createTemplateSchema.parse(req.body);
    const result = await templateService.create(body);
    res.status(201).json({ data: result });
  } catch (err: unknown) {
    next(err);
  }
});

// DELETE /api/templates/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await templateService.remove(req.params['id'] as string);
    res.sendStatus(204);
  } catch (err: unknown) {
    next(err);
  }
});

// POST /api/templates/:id/sync
router.post('/:id/sync', async (req, res, next) => {
  try {
    const result = await templateService.syncOne(req.params['id'] as string);
    res.json({ data: result });
  } catch (err: unknown) {
    next(err);
  }
});

export default router;
