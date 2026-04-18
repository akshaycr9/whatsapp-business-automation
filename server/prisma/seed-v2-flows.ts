/**
 * seed-v2-flows.ts
 *
 * Idempotent seed for the 9 fixed v2 automation flows.
 * Run once (and re-run safely at any time):
 *   cd server && npx tsx prisma/seed-v2-flows.ts
 *
 * Rules:
 * - If a flow row already exists (matched by shopifyEvent or buttonTriggerText),
 *   it is left completely unchanged — user config is never overwritten.
 * - Only missing rows are created.
 * - A placeholder template (the first one found) is used as the FK at creation
 *   time. Users assign the real template via the v2 UI configure modal.
 */

import { PrismaClient, type ShopifyEvent } from '@prisma/client';

const prisma = new PrismaClient();

interface ShopifyFlowDef {
  triggerType: 'SHOPIFY_EVENT';
  name: string;
  shopifyEvent: ShopifyEvent;
  delayMinutes: number;
}

interface ButtonFlowDef {
  triggerType: 'BUTTON_REPLY';
  name: string;
  buttonTriggerText: string;
}

type FlowDef = ShopifyFlowDef | ButtonFlowDef;

const FLOWS: FlowDef[] = [
  // ── Order Flow ─────────────────────────────────────────────────────────────
  { triggerType: 'SHOPIFY_EVENT', name: 'Order Confirmed',       shopifyEvent: 'PREPAID_ORDER_CONFIRMED',  delayMinutes: 0    },
  { triggerType: 'SHOPIFY_EVENT', name: 'Order Cancelled',       shopifyEvent: 'ORDER_CANCELLED',          delayMinutes: 0    },
  { triggerType: 'SHOPIFY_EVENT', name: 'Order Fulfilled',       shopifyEvent: 'ORDER_FULFILLED',          delayMinutes: 0    },

  // ── COD Flow ───────────────────────────────────────────────────────────────
  { triggerType: 'SHOPIFY_EVENT', name: 'COD Order Confirmation', shopifyEvent: 'COD_ORDER_CONFIRMED',     delayMinutes: 0    },
  { triggerType: 'SHOPIFY_EVENT', name: 'COD Order Follow Up',    shopifyEvent: 'COD_ORDER_FOLLOW_UP',     delayMinutes: 30   },
  { triggerType: 'BUTTON_REPLY',  name: 'COD Order Confirm',      buttonTriggerText: 'Confirm My Order'                      },
  { triggerType: 'BUTTON_REPLY',  name: 'COD Order Cancel',       buttonTriggerText: 'Cancel My Order'                       },

  // ── Abandoned Cart ──────────────────────────────────────────────────────────
  { triggerType: 'SHOPIFY_EVENT', name: 'Abandoned Cart 1', shopifyEvent: 'ABANDONED_CART_1', delayMinutes: 60   },
  { triggerType: 'SHOPIFY_EVENT', name: 'Abandoned Cart 2', shopifyEvent: 'ABANDONED_CART_2', delayMinutes: 360  },
  { triggerType: 'SHOPIFY_EVENT', name: 'Abandoned Cart 3', shopifyEvent: 'ABANDONED_CART_3', delayMinutes: 1440 },
];

async function main(): Promise<void> {
  console.log('🌱  Seeding v2 automation flows…\n');

  // We need at least one Template record for the required FK.
  const placeholder = await prisma.template.findFirst({ select: { id: true } });
  if (!placeholder) {
    console.error(
      '❌  No Template records found. Create at least one template before running this seed.',
    );
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;

  for (const flow of FLOWS) {
    if (flow.triggerType === 'SHOPIFY_EVENT') {
      const existing = await prisma.automation.findFirst({
        where: { triggerType: 'SHOPIFY_EVENT', shopifyEvent: flow.shopifyEvent },
      });

      if (existing) {
        console.log(`  ⏭  Skipping "${flow.name}" (shopifyEvent=${flow.shopifyEvent}) — already exists (id: ${existing.id})`);
        skipped++;
      } else {
        const created_ = await prisma.automation.create({
          data: {
            name: flow.name,
            triggerType: 'SHOPIFY_EVENT',
            shopifyEvent: flow.shopifyEvent,
            templateId: placeholder.id,
            variableMapping: {},
            isActive: false,       // Off by default — user turns on after configuring template
            delayMinutes: flow.delayMinutes,
          },
        });
        console.log(`  ✅  Created  "${flow.name}" (shopifyEvent=${flow.shopifyEvent}, id: ${created_.id})`);
        created++;
      }
    } else {
      // BUTTON_REPLY
      const existing = await prisma.automation.findFirst({
        where: { triggerType: 'BUTTON_REPLY', buttonTriggerText: flow.buttonTriggerText },
      });

      if (existing) {
        console.log(`  ⏭  Skipping "${flow.name}" (button="${flow.buttonTriggerText}") — already exists (id: ${existing.id})`);
        skipped++;
      } else {
        const created_ = await prisma.automation.create({
          data: {
            name: flow.name,
            triggerType: 'BUTTON_REPLY',
            buttonTriggerText: flow.buttonTriggerText,
            templateId: placeholder.id,
            variableMapping: {},
            isActive: false,
            delayMinutes: 0,
          },
        });
        console.log(`  ✅  Created  "${flow.name}" (button="${flow.buttonTriggerText}", id: ${created_.id})`);
        created++;
      }
    }
  }

  console.log(`\n🎉  Done — ${created} created, ${skipped} skipped.`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
