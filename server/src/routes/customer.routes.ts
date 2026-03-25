import { Router } from 'express';
import { z } from 'zod';
import * as customerService from '../services/customer.service.js';

const router = Router();

const createSchema = z.object({
  phone: z.string().min(1),
  name: z.string().optional(),
  email: z.string().email().optional(),
  city: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const updateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  city: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// POST /api/customers/sync-shopify — must come before /:id
router.post('/sync-shopify', async (_req, res, next) => {
  try {
    const result = await customerService.syncFromShopify();
    res.json({ data: result });
  } catch (err: unknown) {
    next(err);
  }
});

// GET /api/customers
router.get('/', async (req, res, next) => {
  try {
    const page = req.query['page'] !== undefined ? Number(req.query['page']) : undefined;
    const limit = req.query['limit'] !== undefined ? Number(req.query['limit']) : undefined;
    const search = typeof req.query['search'] === 'string' ? req.query['search'] : undefined;

    const result = await customerService.list({ page, limit, search });
    res.json({ data: result.items, meta: result.meta });
  } catch (err: unknown) {
    next(err);
  }
});

// GET /api/customers/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await customerService.getById(req.params['id'] as string);
    res.json({ data: result });
  } catch (err: unknown) {
    next(err);
  }
});

// POST /api/customers
router.post('/', async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const result = await customerService.create(body);
    res.status(201).json({ data: result });
  } catch (err: unknown) {
    next(err);
  }
});

// PUT /api/customers/:id
router.put('/:id', async (req, res, next) => {
  try {
    const body = updateSchema.parse(req.body);
    const result = await customerService.update(req.params['id'] as string, body);
    res.json({ data: result });
  } catch (err: unknown) {
    next(err);
  }
});

// DELETE /api/customers/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await customerService.remove(req.params['id'] as string);
    res.sendStatus(204);
  } catch (err: unknown) {
    next(err);
  }
});

export default router;
