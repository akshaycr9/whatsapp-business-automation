import { type Message, type MessageType, type MessageStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { notFound, badRequest } from '../lib/app-error.js';
import { logger } from '../lib/logger.js';
import * as whatsappService from './whatsapp.service.js';
import { findOrCreateForCustomer } from './conversation.service.js';
import { triggerForButtonReply } from './automation.service.js';
import {
  emitNewMessage,
  emitConversationUpdated,
  emitMessageStatusUpdate,
} from '../socket/index.js';

export interface MetaMessagePayload {
  id: string;
  from: string;
  type: string;
  timestamp: string;
  text?: { body: string };
  image?: { id: string; mime_type: string; caption?: string };
  video?: { id: string; mime_type: string; caption?: string };
  audio?: { id: string; mime_type: string };
  document?: { id: string; mime_type: string; filename?: string; caption?: string };
  button?: { text: string; payload?: string };
  interactive?: { type: string; button_reply?: { id: string; title: string }; list_reply?: { id: string; title: string } };
}

const STATUS_RANK: Record<MessageStatus, number> = {
  PENDING: 0,
  SENT: 1,
  DELIVERED: 2,
  READ: 3,
  FAILED: 4,
};

function resolveMessageType(payloadType: string): MessageType {
  switch (payloadType) {
    case 'image':
      return 'IMAGE';
    case 'video':
      return 'VIDEO';
    case 'audio':
      return 'AUDIO';
    case 'document':
      return 'DOCUMENT';
    case 'interactive':
      return 'INTERACTIVE';
    default:
      // 'text', 'button' (quick-reply taps), and anything unknown → TEXT
      return 'TEXT';
  }
}

export const sendTextReply = async (conversationId: string, text: string): Promise<Message> => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { customer: true },
  });
  if (!conversation) throw notFound('Conversation');

  const result = await whatsappService.sendTextMessage(conversation.customer.phone, text);

  const now = new Date();
  const message = await prisma.message.create({
    data: {
      conversationId,
      direction: 'OUTBOUND',
      type: 'TEXT',
      body: text,
      status: 'SENT',
      waMessageId: result.messageId,
    },
  });

  const updatedConversation = await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: now, lastMessageText: text },
    include: { customer: true },
  });

  emitNewMessage(conversationId, message);
  emitConversationUpdated(updatedConversation);

  return message;
};

interface TemplateComponent {
  type: string;
  text?: string;
}

export const sendTemplateReply = async (
  conversationId: string,
  templateId: string,
  variables: Record<string, string>,
): Promise<Message> => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { customer: true },
  });
  if (!conversation) throw notFound('Conversation');

  const template = await prisma.template.findUnique({ where: { id: templateId } });
  if (!template) throw notFound('Template');
  if (template.status !== 'APPROVED') throw badRequest('Template is not approved');

  const templateComponents = template.components as unknown as TemplateComponent[];

  // Build body parameters in position order
  const sortedPositions = Object.keys(variables).sort((a, b) => Number(a) - Number(b));
  const bodyParameters = sortedPositions.map((pos) => ({
    type: 'text' as const,
    text: variables[pos] ?? '',
  }));

  const hasBody = templateComponents.some((c) => c.type === 'BODY');
  const components: whatsappService.TemplateComponent[] = [];
  if (hasBody && bodyParameters.length > 0) {
    components.push({ type: 'body', parameters: bodyParameters });
  }

  const result = await whatsappService.sendTemplateMessage(conversation.customer.phone, {
    type: 'template',
    templateName: template.name,
    languageCode: template.language,
    components,
  });

  // Build resolved body for display (replace {{N}} with actual values)
  const bodyComp = templateComponents.find((c) => c.type === 'BODY');
  let resolvedBody = template.name;
  if (bodyComp?.text) {
    let text = bodyComp.text;
    for (const [pos, value] of Object.entries(variables)) {
      text = text.split(`{{${pos}}}`).join(value);
    }
    resolvedBody = text;
  }

  const now = new Date();
  const message = await prisma.message.create({
    data: {
      conversationId,
      waMessageId: result.messageId,
      direction: 'OUTBOUND',
      type: 'TEMPLATE',
      body: resolvedBody,
      status: 'SENT',
      metadata: { templateName: template.name },
    },
  });

  const updatedConversation = await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: now, lastMessageText: resolvedBody },
    include: { customer: true },
  });

  emitNewMessage(conversationId, message);
  emitConversationUpdated(updatedConversation);

  logger.info(`Template reply sent: conversation=${conversationId} template=${templateId}`);
  return message;
};

export const updateMessageStatus = async (
  waMessageId: string,
  newStatus: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED',
): Promise<void> => {
  const message = await prisma.message.findUnique({ where: { waMessageId } });

  if (!message) {
    logger.warn(`updateMessageStatus: message not found for waMessageId=${waMessageId}`);
    return;
  }

  const currentRank = STATUS_RANK[message.status];
  const newRank = STATUS_RANK[newStatus];

  if (newRank <= currentRank) {
    logger.debug(
      `updateMessageStatus: skipping downgrade ${message.status} → ${newStatus} for ${waMessageId}`,
    );
    return;
  }

  // Persist a timestamp for DELIVERED and READ into metadata so the UI can
  // display per-status timestamps in the message tooltip.
  const now = new Date();
  const tsKey = newStatus === 'DELIVERED' ? 'deliveredAt' : newStatus === 'READ' ? 'readAt' : null;
  const existingMeta = (message.metadata as Record<string, unknown>) ?? {};
  const newMetadata = tsKey
    ? ({ ...existingMeta, [tsKey]: now.toISOString() } as import('@prisma/client').Prisma.InputJsonValue)
    : undefined;

  await prisma.message.update({
    where: { id: message.id },
    data: {
      status: newStatus,
      statusUpdatedAt: now,
      ...(newMetadata !== undefined && { metadata: newMetadata }),
    },
  });

  // Include timestamps in the socket event so the frontend can update
  // the tooltip display in real-time without re-fetching.
  const timestamps = tsKey ? { [tsKey]: now.toISOString() } : undefined;
  emitMessageStatusUpdate(message.id, newStatus, timestamps);
};

export const processInboundMessage = async (
  messagePayload: MetaMessagePayload,
  _phoneNumberId: string,
): Promise<void> => {
  // Upsert customer by phone
  const customer = await prisma.customer.upsert({
    where: { phone: messagePayload.from },
    create: { phone: messagePayload.from, source: 'SHOPIFY' },
    update: {},
  });

  const { conversationId } = await findOrCreateForCustomer(customer.phone);

  const type = resolveMessageType(messagePayload.type);

  let body: string | undefined;
  let mediaId: string | undefined;
  let mediaMimeType: string | undefined;
  let caption: string | undefined;

  switch (messagePayload.type) {
    case 'text':
      body = messagePayload.text?.body;
      break;
    case 'button':
      // Quick-reply button tap (legacy template button)
      body = messagePayload.button?.text;
      break;
    case 'interactive':
      // Interactive button/list reply
      body =
        messagePayload.interactive?.button_reply?.title ??
        messagePayload.interactive?.list_reply?.title;
      break;
    case 'image':
      mediaId = messagePayload.image?.id;
      mediaMimeType = messagePayload.image?.mime_type;
      caption = messagePayload.image?.caption;
      break;
    case 'video':
      mediaId = messagePayload.video?.id;
      mediaMimeType = messagePayload.video?.mime_type;
      caption = messagePayload.video?.caption;
      break;
    case 'audio':
      mediaId = messagePayload.audio?.id;
      mediaMimeType = messagePayload.audio?.mime_type;
      break;
    case 'document':
      mediaId = messagePayload.document?.id;
      mediaMimeType = messagePayload.document?.mime_type;
      caption = messagePayload.document?.caption ?? messagePayload.document?.filename;
      break;
  }

  const lastMessageText = body ?? '[Media]';
  const now = new Date();

  const message = await prisma.message.create({
    data: {
      conversationId,
      waMessageId: messagePayload.id,
      direction: 'INBOUND',
      type,
      body,
      mediaId,
      mediaMimeType,
      caption,
      status: 'DELIVERED',
    },
  });

  const updatedConversation = await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      lastMessageAt: now,
      lastMessageText,
      unreadCount: { increment: 1 },
    },
    include: { customer: true },
  });

  // Emit conversation_updated BEFORE new_message so that clients which use
  // the conversation_updated event to build a customer-name lookup (e.g. the
  // global notification hook) have the name available when new_message fires.
  emitConversationUpdated(updatedConversation);
  emitNewMessage(conversationId, message);

  // Fire button-reply automations if this is a button/interactive reply.
  // Runs async after the response is already emitted — failures are logged only.
  if (
    (messagePayload.type === 'button' || messagePayload.type === 'interactive') &&
    body
  ) {
    triggerForButtonReply(messagePayload.from, body).catch((err: unknown) => {
      logger.error('triggerForButtonReply failed:', err);
    });
  }
};
