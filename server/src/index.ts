// Load the single root-level .env file regardless of working directory.
// import.meta.url is always file:///…/server/src/index.ts, so ../../.env
// resolves to the project root .env reliably — no matter where tsx is invoked from.
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../.env') });
import { env } from './config/env.js';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { initSocket } from './socket/index.js';
import { captureRawBody } from './middleware/raw-body.js';
import { errorHandler } from './middleware/error-handler.js';
import { registerRoutes } from './routes/index.js';
import { logger } from './lib/logger.js';

const app = express();
const httpServer = createServer(app);

// ── Request logger (first middleware — logs every incoming request path) ──────
app.use((req, _res, next) => {
  const topic = req.headers['x-shopify-topic'] ?? req.headers['x-hub-signature-256'] ? '(webhook)' : '';
  logger.debug(`→ ${req.method} ${req.path} ${topic}`.trimEnd());
  next();
});

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL
    : ['http://localhost:5173', 'http://localhost:4173'],
  credentials: true,
}));

// Raw body capture MUST come before express.json()
app.use(express.json({ verify: captureRawBody }));
app.use(express.urlencoded({ extended: true }));

// ── Socket.io ─────────────────────────────────────────────────
initSocket(httpServer);

// ── Routes ────────────────────────────────────────────────────
registerRoutes(app);

// ── Error Handler (must be last) ─────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
httpServer.listen(env.PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${env.PORT}`);
  logger.info(`📡 Socket.io ready`);
  logger.info(`🌍 Environment: ${env.NODE_ENV}`);
});

export { app, httpServer };
