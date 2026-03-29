import { Router } from 'express';
import crypto from 'crypto';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import {
  processInboundMessage,
  processInteractiveMessage,
  processReaction,
  updateMessageStatus,
  type MetaMessagePayload,
} from '../../services/message.service.js';

const router = Router();

// GET — Meta webhook verification challenge
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === env.META_VERIFY_TOKEN) {
    logger.info('Meta webhook: verification challenge accepted');
    res.status(200).send(challenge);
  } else {
    logger.warn('Meta webhook: verification challenge rejected');
    res.sendStatus(403);
  }
});

// POST — receive messages and status updates
router.post('/', (req, res) => {
  // Respond immediately before any processing
  res.sendStatus(200);

  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  const rawBody = req.rawBody;

  if (!signature || !rawBody) {
    logger.warn('Meta webhook: missing signature or raw body');
    return;
  }

  const expected =
    'sha256=' +
    crypto.createHmac('sha256', env.META_APP_SECRET).update(rawBody).digest('hex');

  try {
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      logger.warn('Meta webhook: invalid signature');
      return;
    }
  } catch {
    logger.warn('Meta webhook: signature comparison failed');
    return;
  }

  processWebhookPayload(req.body).catch((err: unknown) => {
    logger.error('Meta webhook processing error:', err);
  });
});

async function processWebhookPayload(body: unknown): Promise<void> {
  const payload = body as Record<string, unknown>;
  const entries = payload['entry'] as unknown[] | undefined;
  if (!entries?.length) return;

  for (const entry of entries) {
    const changes = (entry as Record<string, unknown>)['changes'] as unknown[] | undefined;
    if (!changes?.length) continue;

    for (const change of changes) {
      const value = (change as Record<string, unknown>)['value'] as
        | Record<string, unknown>
        | undefined;
      if (!value) continue;

      const phoneNumberId = (value['phone_number_id'] as string | undefined) ?? '';
      const messages = value['messages'] as MetaMessagePayload[] | undefined;
      const statuses = value['statuses'] as Array<{ id: string; status: string }> | undefined;

      if (messages) {
        for (const message of messages) {
          // "interactive" = customer tapped a button on an interactive message
          // "button"      = customer tapped a quick-reply button on a template message
          // "reaction"    = customer reacted to a message with an emoji
          if (message.type === 'interactive' || message.type === 'button') {
            await processInteractiveMessage(message, phoneNumberId).catch((err: unknown) =>
              logger.error('Failed to process interactive/button message:', err),
            );
          } else if (message.type === 'reaction') {
            await processReaction(message).catch((err: unknown) =>
              logger.error('Failed to process reaction:', err),
            );
          } else {
            await processInboundMessage(message, phoneNumberId).catch((err: unknown) =>
              logger.error('Failed to process inbound message:', err),
            );
          }
        }
      }

      if (statuses) {
        for (const status of statuses) {
          const newStatus = mapMetaStatus(status.status);
          if (newStatus) {
            await updateMessageStatus(status.id, newStatus).catch((err: unknown) =>
              logger.error('Failed to update message status:', err),
            );
          }
        }
      }
    }
  }
}

function mapMetaStatus(status: string): 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | null {
  switch (status) {
    case 'sent':
      return 'SENT';
    case 'delivered':
      return 'DELIVERED';
    case 'read':
      return 'READ';
    case 'failed':
      return 'FAILED';
    default:
      return null;
  }
}

export default router;
