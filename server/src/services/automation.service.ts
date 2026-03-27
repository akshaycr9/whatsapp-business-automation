import { type Automation, type AutomationLog, type AutomationTrigger, type ShopifyEvent } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { notFound } from '../lib/app-error.js';
import { logger } from '../lib/logger.js';
import * as whatsappService from './whatsapp.service.js';
import { findOrCreateForCustomer } from './conversation.service.js';
import { emitNewMessage, emitConversationUpdated } from '../socket/index.js';

export interface VariableMapping {
  [variablePosition: string]: string;
}

export interface CreateAutomationInput {
  name: string;
  triggerType: 'SHOPIFY_EVENT' | 'BUTTON_REPLY';
  shopifyEvent?: 'PREPAID_ORDER_CONFIRMED' | 'COD_ORDER_CONFIRMED' | 'ORDER_FULFILLED' | 'ABANDONED_CART';
  buttonTriggerText?: string;
  templateId: string;
  variableMapping: VariableMapping;
  isActive: boolean;
  delayMinutes: number;
}

interface ListParams {
  page?: number;
  limit?: number;
}

interface ListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface TemplateShape {
  id: string;
  name: string;
  language: string;
  category: string;
  status: string;
  components: unknown;
  rejectedReason: string | null;
  metaTemplateId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type AutomationWithTemplate = Automation & {
  template: TemplateShape;
};

interface TemplateComponent {
  type: string;
  text?: string;
  format?: string;
  buttons?: unknown[];
}

export function resolvePath(data: Record<string, unknown>, path: string): string {
  const parts = path.split('.');
  let current: unknown = data;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return '';
    }
    current = (current as Record<string, unknown>)[part];
  }

  if (current === null || current === undefined) return '';
  return String(current);
}

export const list = async (
  params: ListParams,
): Promise<{ items: AutomationWithTemplate[]; meta: ListMeta }> => {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.automation.findMany({
      include: { template: true },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.automation.count(),
  ]);

  return {
    items,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getById = async (id: string): Promise<AutomationWithTemplate> => {
  const automation = await prisma.automation.findUnique({
    where: { id },
    include: { template: true },
  });
  if (!automation) throw notFound('Automation');
  return automation;
};

export const create = async (input: CreateAutomationInput): Promise<Automation> => {
  const template = await prisma.template.findUnique({ where: { id: input.templateId } });
  if (!template) throw notFound('Template');

  const automation = await prisma.automation.create({
    data: {
      name: input.name,
      triggerType: input.triggerType,
      shopifyEvent: input.triggerType === 'SHOPIFY_EVENT' ? (input.shopifyEvent ?? null) : null,
      buttonTriggerText: input.triggerType === 'BUTTON_REPLY' ? (input.buttonTriggerText ?? null) : null,
      templateId: input.templateId,
      variableMapping: input.variableMapping,
      isActive: input.isActive,
      delayMinutes: input.delayMinutes,
    },
  });

  logger.info(`Automation created: ${automation.id} (${automation.triggerType})`);
  return automation;
};

export const update = async (
  id: string,
  input: Partial<CreateAutomationInput>,
): Promise<Automation> => {
  const existing = await prisma.automation.findUnique({ where: { id } });
  if (!existing) throw notFound('Automation');

  if (input.templateId !== undefined) {
    const template = await prisma.template.findUnique({ where: { id: input.templateId } });
    if (!template) throw notFound('Template');
  }

  // Determine effective triggerType for field nulling logic
  const effectiveTriggerType = input.triggerType ?? existing.triggerType;

  const automation = await prisma.automation.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.triggerType !== undefined && { triggerType: input.triggerType }),
      // When triggerType changes or shopifyEvent is explicitly set, update accordingly
      shopifyEvent:
        effectiveTriggerType === 'SHOPIFY_EVENT'
          ? (input.shopifyEvent !== undefined ? input.shopifyEvent : existing.shopifyEvent)
          : null,
      buttonTriggerText:
        effectiveTriggerType === 'BUTTON_REPLY'
          ? (input.buttonTriggerText !== undefined ? input.buttonTriggerText : existing.buttonTriggerText)
          : null,
      ...(input.templateId !== undefined && { templateId: input.templateId }),
      ...(input.variableMapping !== undefined && { variableMapping: input.variableMapping }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.delayMinutes !== undefined && { delayMinutes: input.delayMinutes }),
    },
  });

  logger.info(`Automation updated: ${id}`);
  return automation;
};

export const toggle = async (id: string): Promise<Automation> => {
  const existing = await prisma.automation.findUnique({ where: { id } });
  if (!existing) throw notFound('Automation');

  const automation = await prisma.automation.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  logger.info(`Automation toggled: ${id} — isActive: ${automation.isActive}`);
  return automation;
};

export const remove = async (id: string): Promise<void> => {
  const existing = await prisma.automation.findUnique({ where: { id } });
  if (!existing) throw notFound('Automation');

  await prisma.automation.delete({ where: { id } });
  logger.info(`Automation deleted: ${id}`);
};

export const getLogs = async (
  automationId: string,
  params: ListParams,
): Promise<{ items: AutomationLog[]; meta: ListMeta }> => {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.automationLog.findMany({
      where: { automationId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.automationLog.count({ where: { automationId } }),
  ]);

  return {
    items,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const executeAutomation = async (
  automationId: string,
  shopifyData: Record<string, unknown>,
  customerPhone: string,
): Promise<void> => {
  const automation = await prisma.automation.findUnique({
    where: { id: automationId },
    include: { template: true },
  });

  if (!automation) {
    logger.warn(`executeAutomation: automation ${automationId} not found`);
    return;
  }

  if (!automation.isActive) {
    logger.warn(`executeAutomation: automation ${automationId} is inactive — skipping`);
    return;
  }

  if (automation.template.status !== 'APPROVED') {
    logger.warn(
      `executeAutomation: template ${automation.templateId} is not APPROVED (status: ${automation.template.status}) — skipping`,
    );
    return;
  }

  try {
    const variableMapping = automation.variableMapping as VariableMapping;

    // Resolve template variables from shopifyData
    const resolvedVars: Record<string, string> = {};
    for (const [position, path] of Object.entries(variableMapping)) {
      resolvedVars[position] = resolvePath(shopifyData, path);
    }

    // Get sorted positions (1, 2, 3, ...)
    const sortedPositions = Object.keys(resolvedVars).sort(
      (a, b) => Number(a) - Number(b),
    );

    const bodyParameters = sortedPositions.map((pos) => ({
      type: 'text' as const,
      text: resolvedVars[pos] ?? '',
    }));

    // Find the BODY component in the template
    const templateComponents = automation.template.components as unknown as TemplateComponent[];
    const hasBody = templateComponents.some((c) => c.type === 'BODY');

    const components: whatsappService.TemplateComponent[] = [];

    if (hasBody && bodyParameters.length > 0) {
      components.push({
        type: 'body',
        parameters: bodyParameters,
      });
    }

    const result = await whatsappService.sendTemplateMessage(customerPhone, {
      type: 'template',
      templateName: automation.template.name,
      languageCode: automation.template.language,
      components,
    });

    await prisma.automationLog.create({
      data: {
        automationId,
        customerPhone,
        shopifyData: shopifyData as import('@prisma/client').Prisma.InputJsonValue,
        status: 'SENT',
        waMessageId: result.messageId,
      },
    });

    logger.info(
      `Automation executed: ${automationId} → ${customerPhone} (waMessageId: ${result.messageId})`,
    );

    // Create/update customer, conversation, and message records so the send
    // is visible in the chat UI immediately. Isolated in its own try/catch so
    // any failure here does NOT retroactively mark the automation as FAILED.
    try {
      // 1. Upsert customer from Shopify order data
      const shopifyCustomer = shopifyData.customer as Record<string, unknown> | undefined;
      const shippingAddress = shopifyData.shipping_address as Record<string, unknown> | undefined;
      const firstName = shopifyCustomer?.first_name ? String(shopifyCustomer.first_name) : undefined;
      const lastName  = shopifyCustomer?.last_name  ? String(shopifyCustomer.last_name)  : undefined;
      const fullName  = [firstName, lastName].filter(Boolean).join(' ').trim() || undefined;
      const email     = shopifyCustomer?.email ? String(shopifyCustomer.email) : undefined;
      const city      = shippingAddress?.city  ? String(shippingAddress.city)  : undefined;
      const shopifyId = shopifyCustomer?.id    ? String(shopifyCustomer.id)    : undefined;

      await prisma.customer.upsert({
        where: { phone: customerPhone },
        create: { phone: customerPhone, name: fullName, email, city, shopifyId, source: 'SHOPIFY' },
        update: {
          ...(fullName  && { name: fullName }),
          ...(email     && { email }),
          ...(city      && { city }),
          ...(shopifyId && { shopifyId }),
          source: 'SHOPIFY',
        },
      });

      // 2. Find or create conversation (customer now guaranteed to exist)
      const { conversationId } = await findOrCreateForCustomer(customerPhone);

      // 3. Build resolved body text: replace {{N}} with actual values for display
      const bodyComp = templateComponents.find((c) => c.type === 'BODY');
      let resolvedBody = automation.template.name;
      if (bodyComp?.text) {
        let text = bodyComp.text;
        for (const [pos, value] of Object.entries(resolvedVars)) {
          text = text.split(`{{${pos}}}`).join(value);
        }
        resolvedBody = text;
      }

      // 4. Save the outbound template message to the conversation
      const message = await prisma.message.create({
        data: {
          conversationId,
          waMessageId: result.messageId,
          direction: 'OUTBOUND',
          type: 'TEMPLATE',
          body: resolvedBody,
          status: 'SENT',
          metadata: { templateName: automation.template.name },
        },
      });

      // 5. Update conversation preview fields
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: message.createdAt, lastMessageText: resolvedBody },
      });

      // 6. Emit real-time events so the frontend updates immediately
      const updatedConversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { customer: true },
      });
      emitNewMessage(conversationId, message);
      emitConversationUpdated(updatedConversation);

      logger.info(`Post-send: customer/conversation/message created for ${customerPhone}`);
    } catch (postSendErr) {
      logger.error(
        `Post-send customer/conversation/message creation failed for ${customerPhone}:`,
        postSendErr,
      );
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logger.error(`executeAutomation failed for ${automationId} → ${customerPhone}:`, err);

    await prisma.automationLog.create({
      data: {
        automationId,
        customerPhone,
        shopifyData: shopifyData as import('@prisma/client').Prisma.InputJsonValue,
        status: 'FAILED',
        errorMessage,
      },
    });
  }
};

export const triggerForEvent = async (
  event: ShopifyEvent,
  shopifyData: Record<string, unknown>,
  customerPhone: string,
): Promise<void> => {
  const automations = await prisma.automation.findMany({
    where: { triggerType: 'SHOPIFY_EVENT', shopifyEvent: event, isActive: true },
  });

  if (automations.length === 0) {
    logger.debug(`triggerForEvent: no active automations for event ${event}`);
    return;
  }

  logger.info(
    `triggerForEvent: ${automations.length} automation(s) for ${event} → ${customerPhone}`,
  );

  const results = await Promise.allSettled(
    automations.map((a) => executeAutomation(a.id, shopifyData, customerPhone)),
  );

  for (const [i, result] of results.entries()) {
    if (result.status === 'rejected') {
      logger.error(
        `triggerForEvent: automation ${automations[i]?.id} failed:`,
        result.reason,
      );
    }
  }
};

// Unused import kept for type safety — AutomationTrigger is used by Prisma generated types
export type { AutomationTrigger };
