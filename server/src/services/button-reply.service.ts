import { type AutomationButtonReply } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import * as whatsappService from './whatsapp.service.js';
import { resolvePath, type VariableMapping } from './automation.service.js';
import { findOrCreateForCustomer } from './conversation.service.js';
import { emitNewMessage, emitConversationUpdated } from '../socket/index.js';

export interface ButtonReplyInput {
  buttonText: string;
  replyTemplateId: string;
  variableMapping: Record<string, string>;
}

interface TemplateComponent {
  type: string;
  text?: string;
  format?: string;
  buttons?: unknown[];
}

export const listForAutomation = async (automationId: string): Promise<AutomationButtonReply[]> => {
  return prisma.automationButtonReply.findMany({
    where: { automationId },
    include: { replyTemplate: true },
    orderBy: { createdAt: 'asc' },
  });
};

export const upsertButtonReplies = async (
  automationId: string,
  inputs: ButtonReplyInput[],
): Promise<void> => {
  // Verify automation exists
  const automation = await prisma.automation.findUnique({ where: { id: automationId } });
  if (!automation) {
    logger.warn(`upsertButtonReplies: automation ${automationId} not found`);
    return;
  }

  // Validate all reply templates exist
  if (inputs.length > 0) {
    const templateIds = [...new Set(inputs.map((i) => i.replyTemplateId))];
    const found = await prisma.template.findMany({
      where: { id: { in: templateIds } },
      select: { id: true },
    });
    if (found.length !== templateIds.length) {
      throw new Error('One or more reply templates not found');
    }
  }

  // Replace all rules atomically
  await prisma.$transaction([
    prisma.automationButtonReply.deleteMany({ where: { automationId } }),
    ...(inputs.length > 0
      ? [
          prisma.automationButtonReply.createMany({
            data: inputs.map((input) => ({
              automationId,
              buttonText: input.buttonText,
              replyTemplateId: input.replyTemplateId,
              variableMapping: input.variableMapping,
            })),
          }),
        ]
      : []),
  ]);

  logger.info(`upsertButtonReplies: ${inputs.length} rule(s) saved for automation ${automationId}`);
};

export const processButtonReply = async (
  fromPhone: string,
  buttonTitle: string,
): Promise<void> => {
  // Find all button reply rules matching this button text
  const matchingRules = await prisma.automationButtonReply.findMany({
    where: { buttonText: buttonTitle },
    include: { replyTemplate: true },
    take: 20,
  });

  if (matchingRules.length === 0) {
    logger.debug(`processButtonReply: no rules for button "${buttonTitle}"`);
    return;
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  for (const rule of matchingRules) {
    try {
      // Find the most recent AutomationLog for this automation + customer within 7 days
      const recentLog = await prisma.automationLog.findFirst({
        where: {
          automationId: rule.automationId,
          customerPhone: fromPhone,
          status: 'SENT',
          createdAt: { gte: sevenDaysAgo },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!recentLog) {
        logger.debug(
          `processButtonReply: no recent log for automation ${rule.automationId} + phone ${fromPhone} — skipping rule`,
        );
        continue;
      }

      if (rule.replyTemplate.status !== 'APPROVED') {
        logger.warn(
          `processButtonReply: reply template ${rule.replyTemplateId} is not APPROVED — skipping`,
        );
        continue;
      }

      const shopifyData = (recentLog.shopifyData ?? {}) as Record<string, unknown>;
      const variableMapping = rule.variableMapping as VariableMapping;

      // Resolve template variables from original shopifyData
      const resolvedVars: Record<string, string> = {};
      for (const [position, path] of Object.entries(variableMapping)) {
        resolvedVars[position] = resolvePath(shopifyData, path);
      }

      const sortedPositions = Object.keys(resolvedVars).sort((a, b) => Number(a) - Number(b));
      const bodyParameters = sortedPositions.map((pos) => ({
        type: 'text' as const,
        text: resolvedVars[pos] ?? '',
      }));

      const templateComponents = rule.replyTemplate.components as unknown as TemplateComponent[];
      const hasBody = templateComponents.some((c) => c.type === 'BODY');
      const components: whatsappService.TemplateComponent[] = [];

      if (hasBody && bodyParameters.length > 0) {
        components.push({ type: 'body', parameters: bodyParameters });
      }

      const result = await whatsappService.sendTemplateMessage(fromPhone, {
        type: 'template',
        templateName: rule.replyTemplate.name,
        languageCode: rule.replyTemplate.language,
        components,
      });

      // Log the follow-up automation execution
      await prisma.automationLog.create({
        data: {
          automationId: rule.automationId,
          customerPhone: fromPhone,
          shopifyData: shopifyData as import('@prisma/client').Prisma.InputJsonValue,
          status: 'SENT',
          waMessageId: result.messageId,
        },
      });

      logger.info(
        `processButtonReply: follow-up sent for button "${buttonTitle}" → ${fromPhone} (waMessageId: ${result.messageId})`,
      );

      // Save the outbound follow-up message to the conversation
      try {
        const { conversationId } = await findOrCreateForCustomer(fromPhone);

        const bodyComp = templateComponents.find((c) => c.type === 'BODY');
        let resolvedBody = rule.replyTemplate.name;
        if (bodyComp?.text) {
          let text = bodyComp.text;
          for (const [pos, value] of Object.entries(resolvedVars)) {
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
            metadata: { templateName: rule.replyTemplate.name, triggeredByButtonReply: buttonTitle },
          },
        });

        const updatedConversation = await prisma.conversation.update({
          where: { id: conversationId },
          data: { lastMessageAt: now, lastMessageText: resolvedBody },
          include: { customer: true },
        });

        emitNewMessage(conversationId, message);
        emitConversationUpdated(updatedConversation);
      } catch (postSendErr) {
        logger.error(
          `processButtonReply: post-send message creation failed for ${fromPhone}:`,
          postSendErr,
        );
      }
    } catch (ruleErr) {
      logger.error(
        `processButtonReply: error processing rule ${rule.id} for button "${buttonTitle}":`,
        ruleErr,
      );
    }
  }
};
