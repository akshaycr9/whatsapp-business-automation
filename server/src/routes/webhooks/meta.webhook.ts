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
  logger.info('Meta webhook: POST request received', {
    hasSignature: !!req.headers['x-hub-signature-256'],
    hasRawBody: !!req.rawBody,
    bodyKeys: req.body ? Object.keys(req.body) : [],
  });

  // Respond immediately before any processing
  res.sendStatus(200);

  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  const rawBody = req.rawBody;

  if (!signature) {
    logger.error('Meta webhook: missing signature header (x-hub-signature-256)');
    return;
  }

  if (!rawBody) {
    logger.error('Meta webhook: missing raw body (rawBody middleware not working?)');
    return;
  }

  logger.info('Meta webhook: signature and raw body present, validating...');

  const expected =
    'sha256=' +
    crypto.createHmac('sha256', env.META_APP_SECRET).update(rawBody).digest('hex');

  try {
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);

    logger.debug('Meta webhook: signature validation', {
      providedLength: sigBuf.length,
      expectedLength: expBuf.length,
      providedSignature: signature.substring(0, 20) + '...',
      expectedSignature: expected.substring(0, 20) + '...',
    });

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      logger.error('Meta webhook: signature validation failed - signature mismatch');
      logger.error('Provided signature:', signature);
      logger.error('Expected signature:', expected);
      return;
    }
  } catch (err) {
    logger.error('Meta webhook: signature comparison failed with exception:', err);
    return;
  }

  logger.info('Meta webhook: signature validated, processing payload...');
  processWebhookPayload(req.body).catch((err: unknown) => {
    logger.error('Meta webhook processing error:', err);
  });
});

async function processWebhookPayload(body: unknown): Promise<void> {
  logger.info('Meta webhook: processWebhookPayload called');

  const payload = body as Record<string, unknown>;
  const entries = payload['entry'] as unknown[] | undefined;

  if (!entries?.length) {
    logger.warn('Meta webhook: no entries in payload', { payloadKeys: Object.keys(payload) });
    return;
  }

  logger.info('Meta webhook: processing entries', { entryCount: entries.length });

  for (const entry of entries) {
    const changes = (entry as Record<string, unknown>)['changes'] as unknown[] | undefined;
    if (!changes?.length) {
      logger.warn('Meta webhook: entry has no changes');
      continue;
    }

    logger.info('Meta webhook: processing changes', { changeCount: changes.length });

    for (const change of changes) {
      const value = (change as Record<string, unknown>)['value'] as
        | Record<string, unknown>
        | undefined;
      if (!value) {
        logger.warn('Meta webhook: change has no value');
        continue;
      }

      const phoneNumberId = (value['phone_number_id'] as string | undefined) ?? '';
      const messages = value['messages'] as MetaMessagePayload[] | undefined;
      const statuses = value['statuses'] as Array<{ id: string; status: string }> | undefined;

      logger.info('Meta webhook: processing value', {
        phoneNumberId,
        messageCount: messages?.length ?? 0,
        statusCount: statuses?.length ?? 0,
        valueKeys: Object.keys(value),
      });

      if (messages) {
        logger.info('Meta webhook: processing messages', { count: messages.length });
        for (const message of messages) {
          logger.info('Meta webhook: message details', {
            messageId: message.id,
            type: message.type,
            from: message.from,
          });
          // "interactive" = customer tapped a button on an interactive message
          // "button"      = customer tapped a quick-reply button on a template message
          // "reaction"    = customer reacted to a message with an emoji
          if (message.type === 'interactive' || message.type === 'button') {
            logger.info('Meta webhook: processing interactive/button message');
            await processInteractiveMessage(message, phoneNumberId).catch((err: unknown) =>
              logger.error('Failed to process interactive/button message:', err),
            );
          } else if (message.type === 'reaction') {
            logger.info('Meta webhook: processing reaction');
            await processReaction(message).catch((err: unknown) =>
              logger.error('Failed to process reaction:', err),
            );
          } else {
            logger.info('Meta webhook: processing inbound message');
            await processInboundMessage(message, phoneNumberId).catch((err: unknown) =>
              logger.error('Failed to process inbound message:', err),
            );
          }
        }
      }

      if (statuses) {
        logger.info('Meta webhook: processing statuses', { count: statuses.length });
        for (const status of statuses) {
          const newStatus = mapMetaStatus(status.status);
          if (newStatus) {
            logger.info('Meta webhook: updating message status', {
              waMessageId: status.id,
              status: newStatus,
            });
            await updateMessageStatus(status.id, newStatus).catch((err: unknown) =>
              logger.error('Failed to update message status:', err),
            );
          }
        }
      }
    }
  }

  logger.info('Meta webhook: payload processing complete');
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
