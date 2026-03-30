import { type Express, type Request, type Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import customerRoutes from './customer.routes.js';
import conversationRoutes from './conversation.routes.js';
import mediaRoutes from './media.routes.js';
import templateRoutes from './template.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import automationRoutes from './automation.routes.js';
import pushRoutes from './push.routes.js';
import metaWebhookRoutes from './webhooks/meta.webhook.js';
import shopifyWebhookRoutes from './webhooks/shopify.webhook.js';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';
import { startAbandonedCartJob } from '../jobs/abandoned-cart.job.js';
import { registerWebhooks } from '../services/shopify.service.js';

export const registerRoutes = (app: Express): void => {
  // ── Health check ──────────────────────────────────────────────────────────
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── Manual webhook registration trigger ──────────────────────────────────
  // POST /api/setup/register-webhooks — re-registers Shopify webhooks on demand.
  // Useful after changing PUBLIC_URL (new ngrok domain).
  app.post('/api/setup/register-webhooks', async (_req, res, next) => {
    try {
      if (!env.PUBLIC_URL) {
        res.status(400).json({ error: { message: 'PUBLIC_URL is not set in .env', statusCode: 400 } });
        return;
      }
      await registerWebhooks(env.PUBLIC_URL);
      res.json({ ok: true, message: 'Shopify webhooks registered successfully' });
    } catch (err) {
      next(err);
    }
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
        topics: ['orders/create', 'orders/paid', 'orders/fulfilled', 'checkouts/create', 'checkouts/update'],
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
  app.use('/api/push', pushRoutes);

  // ── Dev frontend proxy ────────────────────────────────────────────────────
  // In development, proxy all non-API requests to the Vite dev server so the
  // app is accessible at the backend's ngrok HTTPS URL.
  // This is what makes service workers and Web Push work on iOS (requires HTTPS).
  if (env.NODE_ENV === 'development') {
    app.use(
      createProxyMiddleware({
        target: 'http://localhost:5173',
        changeOrigin: true,
        ws: true,
      }),
    );
  }

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

  // ── Shopify webhook auto-registration ─────────────────────────────────────
  // Uses the Shopify Admin API to programmatically register/update all 4 webhook
  // subscriptions. No manual Shopify Admin UI configuration needed.
  const base = env.PUBLIC_URL ?? `http://localhost:${env.PORT}`;
  logger.info('─────────────────────────────────────────────────────');
  logger.info('📬 Webhook endpoints:');
  logger.info(`   Shopify  → ${base}/api/webhooks/shopify`);
  logger.info(`   Meta     → ${base}/api/webhooks/meta`);
  if (env.PUBLIC_URL) {
    logger.info('   🔄 Auto-registering Shopify webhooks via Admin API…');
    registerWebhooks(env.PUBLIC_URL).catch((err: unknown) => {
      logger.error('Shopify webhook auto-registration failed:', err);
      logger.warn('   ⚠️  Manual webhook setup may be required in Shopify Admin');
    });
  } else {
    logger.warn('   ⚠️  PUBLIC_URL not set — Shopify webhooks will NOT be auto-registered');
    logger.warn('   Set PUBLIC_URL=https://xxx.ngrok-free.dev in .env and restart');
  }
  logger.info('─────────────────────────────────────────────────────');
  logger.info('Routes registered');
};
