import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { executeAutomation } from './automation.service.js';

/**
 * Called when a customer taps a WhatsApp quick reply button.
 * Finds all active BUTTON_REPLY automations matching the button text,
 * retrieves recent shopifyData from the most recent AutomationLog for
 * this customer, and executes the automation via the shared executeAutomation
 * function.
 */
export const processButtonReply = async (
  fromPhone: string,
  buttonTitle: string,
): Promise<void> => {
  // Find all active BUTTON_REPLY automations matching this button text
  const matchingAutomations = await prisma.automation.findMany({
    where: {
      triggerType: 'BUTTON_REPLY',
      buttonTriggerText: buttonTitle,
      isActive: true,
    },
    take: 20,
  });

  if (matchingAutomations.length === 0) {
    logger.debug(`processButtonReply: no active automations for button "${buttonTitle}"`);
    return;
  }

  logger.info(
    `processButtonReply: ${matchingAutomations.length} automation(s) for button "${buttonTitle}" → ${fromPhone}`,
  );

  // Find the most recent AutomationLog for this phone (within 7 days) to get shopifyData.
  // The log comes from the Shopify-event automation that originally sent the template
  // containing the tapped button.
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentLog = await prisma.automationLog.findFirst({
    where: {
      customerPhone: fromPhone,
      status: 'SENT',
      createdAt: { gte: sevenDaysAgo },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fall back to empty object if no recent log found — templates with no variables
  // will still render correctly.
  const shopifyData = (recentLog?.shopifyData ?? {}) as Record<string, unknown>;

  if (!recentLog) {
    logger.warn(
      `processButtonReply: no recent AutomationLog found for ${fromPhone} — executing with empty shopifyData`,
    );
  }

  const results = await Promise.allSettled(
    matchingAutomations.map((automation) =>
      executeAutomation(automation.id, shopifyData, fromPhone),
    ),
  );

  for (const [i, result] of results.entries()) {
    if (result.status === 'rejected') {
      logger.error(
        `processButtonReply: automation ${matchingAutomations[i]?.id} failed:`,
        result.reason,
      );
    }
  }
};
