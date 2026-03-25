import { type Express } from 'express';
import customerRoutes from './customer.routes.js';
import conversationRoutes from './conversation.routes.js';
import mediaRoutes from './media.routes.js';
import templateRoutes from './template.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import automationRoutes from './automation.routes.js';
import metaWebhookRoutes from './webhooks/meta.webhook.js';
import shopifyWebhookRoutes from './webhooks/shopify.webhook.js';
import { logger } from '../lib/logger.js';
import { startAbandonedCartJob } from '../jobs/abandoned-cart.job.js';

export const registerRoutes = (app: Express): void => {
  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Webhooks (no auth, raw body already captured by captureRawBody middleware)
  app.use('/api/webhooks/meta', metaWebhookRoutes);
  app.use('/api/webhooks/shopify', shopifyWebhookRoutes);

  // API routes
  app.use('/api/customers', customerRoutes);
  app.use('/api/conversations', conversationRoutes);
  app.use('/api/media', mediaRoutes);
  app.use('/api/templates', templateRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/automations', automationRoutes);

  // Start background jobs
  startAbandonedCartJob();

  logger.info('Routes registered');
};
