import { type Express, type Request, type Response } from 'express';
import customerRoutes from './customer.routes.js';
import conversationRoutes from './conversation.routes.js';
import mediaRoutes from './media.routes.js';
import templateRoutes from './template.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import automationRoutes from './automation.routes.js';
import metaWebhookRoutes from './webhooks/meta.webhook.js';
import shopifyWebhookRoutes from './webhooks/shopify.webhook.js';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';
import { startAbandonedCartJob } from '../jobs/abandoned-cart.job.js';

export const registerRoutes = (app: Express): void => {
  // ── Health check ──────────────────────────────────────────────────────────
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── Webhook debug info ────────────────────────────────────────────────────
  // GET /api/debug/webhooks — returns the exact URLs to configure in Shopify
  // Admin and the Meta App dashboard. Set PUBLIC_URL in .env to your ngrok URL.
  app.get('/api/debug/webhooks', (_req, res) => {
    const base = env.PUBLIC_URL ?? `http://localhost:${env.PORT}`;
    res.json({
      note: 'Configure these exact URLs in Shopify Admin and Meta App dashboard.',
      ngrok_tip: 'Run: ngrok http 3000 — use the https:// URL as PUBLIC_URL in .env',
      shopify: {
        url: `${base}/api/webhooks/shopify`,
        topics: ['orders/create', 'orders/updated', 'fulfillments/create', 'checkouts/create'],
        format: 'JSON',
      },
      meta: {
        callback_url: `${base}/api/webhooks/meta`,
        verify_token: '(value of META_VERIFY_TOKEN in your .env)',
      },
    });
  });

  // ── Webhooks ──────────────────────────────────────────────────────────────
  // Registered at both /api/webhooks/* and /webhooks/* so the endpoint works
  // regardless of whether the URL was configured with or without the /api/ prefix.
  app.use('/api/webhooks/meta',    metaWebhookRoutes);
  app.use('/webhooks/meta',        metaWebhookRoutes);
  app.use('/api/webhooks/shopify', shopifyWebhookRoutes);
  app.use('/webhooks/shopify',     shopifyWebhookRoutes);

  // ── API routes ────────────────────────────────────────────────────────────
  app.use('/api/customers', customerRoutes);
  app.use('/api/conversations', conversationRoutes);
  app.use('/api/media', mediaRoutes);
  app.use('/api/templates', templateRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/automations', automationRoutes);

  // ── 404 catch-all ─────────────────────────────────────────────────────────
  // Logs the unmatched path so it's easy to diagnose misconfigured webhook URLs.
  app.use((req: Request, res: Response) => {
    logger.warn(`404 Not Found: ${req.method} ${req.path} — check webhook URL configuration`);
    res.status(404).json({
      error: {
        message: `Route not found: ${req.method} ${req.path}`,
        hint: 'If this is a webhook, visit GET /api/debug/webhooks to see the correct URLs.',
        statusCode: 404,
      },
    });
  });

  // Start background jobs
  startAbandonedCartJob();

  // ── Startup webhook URL hints ─────────────────────────────────────────────
  const base = env.PUBLIC_URL ?? `http://localhost:${env.PORT}`;
  logger.info('─────────────────────────────────────────────────────');
  logger.info('📬 Webhook URLs to configure:');
  logger.info(`   Shopify  → ${base}/api/webhooks/shopify`);
  logger.info(`   Meta     → ${base}/api/webhooks/meta`);
  if (!env.PUBLIC_URL) {
    logger.info('   💡 Set PUBLIC_URL=https://xxx.ngrok-free.dev in .env for live URLs');
  }
  logger.info('─────────────────────────────────────────────────────');
  logger.info('Routes registered');
};
