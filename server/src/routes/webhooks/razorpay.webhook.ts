import { Router } from "express";
import { type Prisma } from "@prisma/client";
import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";
import { normalizePhone } from "../../utils/phone.js";

const router = Router();

// Razorpay does not provide webhook signatures — no HMAC verification.
// Endpoint security relies on the URL not being publicly advertised.
router.post("/", (req, res) => {
  res.sendStatus(200);
  processRazorpayWebhook(req.body as Record<string, unknown>).catch(
    (err: unknown) => {
      logger.error("Razorpay webhook processing error:", err);
    },
  );
});

async function processRazorpayWebhook(
  body: Record<string, unknown>,
): Promise<void> {
  const cartToken = body["cart_token"] as string | undefined;
  const rawPhone = body["phone"] as string | undefined;

  if (!cartToken || !rawPhone) {
    logger.warn("Razorpay webhook: missing cart_token or phone — skipping");
    return;
  }

  const customerPhone = normalizePhone(rawPhone);
  const abandonedAt = new Date();

  logger.info(
    `Razorpay abandoned cart: cartToken=${cartToken}, phone=${customerPhone}`,
  );

  // Pre-compute line_items_summary and bake it into the payload before storing.
  // This way the abandoned-cart cron can resolve it as a plain path ("line_items_summary")
  // without relying on virtual-path magic at execution time.
  const rawItems = body["line_items"];
  if (Array.isArray(rawItems) && rawItems.length > 0) {
    const summary = (rawItems as Array<Record<string, unknown>>)
      .map((item) => {
        // Razorpay uses "name"; Shopify uses "title" — try both.
        const name = String(item["name"] ?? "").trim();
        const variantTitle = String(item["variant_title"] ?? "").trim();
        const qty = item["quantity"];
        return name
          ? qty !== undefined
            ? `${name} - ${variantTitle} (x${qty})`
            : `${name} - ${variantTitle}`
          : "";
      })
      .filter(Boolean)
      .join(", ");

    body["line_items_summary"] = summary;
    logger.info(`Razorpay: line_items_summary="${summary}"`);
  } else {
    logger.warn(
      "Razorpay: line_items missing or empty — line_items_summary will be blank",
    );
    body["line_items_summary"] = "";
  }

  const automations = await prisma.automation.findMany({
    where: {
      triggerType: "SHOPIFY_EVENT",
      shopifyEvent: {
        in: ["ABANDONED_CART_1", "ABANDONED_CART_2", "ABANDONED_CART_3"],
      },
      isActive: true,
    },
  });

  if (automations.length === 0) {
    logger.info(
      "Razorpay webhook: no active abandoned cart automations — nothing queued",
    );
    return;
  }

  for (const automation of automations) {
    const existing = await prisma.abandonedCartQueue.findFirst({
      where: { cartToken, automationId: automation.id },
    });
    if (existing) {
      logger.info(
        `Razorpay: ${cartToken} already queued for automation ${automation.id} — skipping`,
      );
      continue;
    }

    const scheduledAt = new Date(
      abandonedAt.getTime() + automation.delayMinutes * 60 * 1000,
    );

    await prisma.abandonedCartQueue.create({
      data: {
        cartToken,
        customerPhone,
        automationId: automation.id,
        cartData: body as Prisma.InputJsonValue,
        scheduledAt,
        abandonedAt,
      },
    });

    logger.info(
      `Razorpay: queued ${customerPhone} for ${automation.shopifyEvent} at ${scheduledAt.toISOString()}`,
    );
  }
}

export default router;
