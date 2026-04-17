import cron from "node-cron";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { executeAutomation } from "../services/automation.service.js";
import { env } from "../config/env.js";

const SCHEDULE = env.NODE_ENV === "production" ? "*/15 * * * *" : "* * * * *";
const SCHEDULE_LABEL = env.NODE_ENV === "production" ? "every 15 minutes" : "every minute";

export function startCodFollowUpJob(): void {
  cron.schedule(SCHEDULE, () => {
    void runCodFollowUpCheck();
  });

  logger.info(`COD follow-up job started (${SCHEDULE_LABEL})`);
}

async function runCodFollowUpCheck(): Promise<void> {
  const now = new Date();

  const dueRows = await prisma.codFollowUpQueue.findMany({
    where: {
      status: "PENDING",
      scheduledAt: { lte: now },
    },
    take: 50,
    orderBy: { scheduledAt: "asc" },
  });

  if (dueRows.length === 0) {
    logger.debug("COD follow-up job: nothing due");
    return;
  }

  logger.info(`COD follow-up job: ${dueRows.length} due row(s)`);

  for (const row of dueRows) {
    try {
      // Check if customer replied after the COD confirmation was sent.
      // Query Message directly — more reliable than lastInboundMessageAt.
      const conversation = await prisma.conversation.findFirst({
        where: { customer: { phone: row.customerPhone } },
        select: { id: true },
      });

      if (conversation) {
        const replied = await prisma.message.findFirst({
          where: {
            conversationId: conversation.id,
            direction: "INBOUND",
            createdAt: { gt: row.confirmedAt },
          },
        });

        if (replied) {
          await prisma.codFollowUpQueue.update({
            where: { id: row.id },
            data: { status: "SKIPPED" },
          });
          logger.info(
            `COD follow-up SKIPPED for ${row.customerPhone} — customer replied at ${replied.createdAt.toISOString()}`,
          );
          continue;
        }
      }

      const automation = await prisma.automation.findUnique({
        where: { id: row.automationId },
      });

      if (!automation?.isActive) {
        await prisma.codFollowUpQueue.update({
          where: { id: row.id },
          data: { status: "CANCELLED" },
        });
        logger.info(
          `COD follow-up CANCELLED for ${row.customerPhone} — automation ${row.automationId} is inactive`,
        );
        continue;
      }

      await executeAutomation(
        row.automationId,
        row.shopifyData as Record<string, unknown>,
        row.customerPhone,
      );

      await prisma.codFollowUpQueue.update({
        where: { id: row.id },
        data: { status: "SENT" },
      });

      logger.info(`COD follow-up SENT to ${row.customerPhone}`);
    } catch (err: unknown) {
      logger.error(`COD follow-up job: failed for row ${row.id}:`, err);
      // Row stays PENDING — retried on next cron tick
    }
  }
}
