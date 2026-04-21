import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAutomationCategories() {
  console.log('📂 Seeding automation categories...');

  const categories = [
    { name: 'Order Flow' },
    { name: 'COD Order Flow' },
    { name: 'Abandoned Cart Flow' },
  ];

  for (const category of categories) {
    await prisma.automationCategory.upsert({
      where: { name: category.name },
      create: { name: category.name },
      update: {},
    });
  }

  console.log('✅ Automation categories seeded');
}

async function seedAutomations() {
  console.log('🤖 Seeding automations...');

  // Get category IDs
  const orderFlowCat = await prisma.automationCategory.findUnique({ where: { name: 'Order Flow' } });
  const codFlowCat = await prisma.automationCategory.findUnique({ where: { name: 'COD Order Flow' } });
  const cartFlowCat = await prisma.automationCategory.findUnique({ where: { name: 'Abandoned Cart Flow' } });

  if (!orderFlowCat || !codFlowCat || !cartFlowCat) {
    throw new Error('Automation categories not found');
  }

  const automations = [
    // Order Flow (Shopify events)
    {
      name: 'Prepaid Order Confirmed',
      triggerType: 'SHOPIFY_EVENT' as const,
      shopifyEvent: 'PREPAID_ORDER_CONFIRMED' as const,
      buttonTriggerText: null,
      categoryId: orderFlowCat.id,
    },
    {
      name: 'Order Fulfilled',
      triggerType: 'SHOPIFY_EVENT' as const,
      shopifyEvent: 'ORDER_FULFILLED' as const,
      buttonTriggerText: null,
      categoryId: orderFlowCat.id,
    },
    {
      name: 'Order Cancelled',
      triggerType: 'SHOPIFY_EVENT' as const,
      shopifyEvent: 'ORDER_CANCELLED' as const,
      buttonTriggerText: null,
      categoryId: orderFlowCat.id,
    },
    // COD Order Flow (Shopify events)
    {
      name: 'COD Order Confirmation',
      triggerType: 'SHOPIFY_EVENT' as const,
      shopifyEvent: 'COD_ORDER_CONFIRMATION' as const,
      buttonTriggerText: null,
      categoryId: codFlowCat.id,
    },
    {
      name: 'COD Order Follow-up',
      triggerType: 'SHOPIFY_EVENT' as const,
      shopifyEvent: 'COD_ORDER_FOLLOW_UP' as const,
      buttonTriggerText: null,
      categoryId: codFlowCat.id,
      delayMinutes: 30,
    },
    // COD Order Flow (Button replies)
    {
      name: 'COD Order Confirmed',
      triggerType: 'BUTTON_REPLY' as const,
      shopifyEvent: null,
      buttonTriggerText: 'Confirm My Order',
      categoryId: codFlowCat.id,
    },
    {
      name: 'COD Order Cancelled',
      triggerType: 'BUTTON_REPLY' as const,
      shopifyEvent: null,
      buttonTriggerText: 'Cancel My Order',
      categoryId: codFlowCat.id,
    },
    // Abandoned Cart Flow (Shopify events)
    {
      name: 'Abandoned Cart - First Reminder',
      triggerType: 'SHOPIFY_EVENT' as const,
      shopifyEvent: 'ABANDONED_CART_1' as const,
      buttonTriggerText: null,
      categoryId: cartFlowCat.id,
      delayMinutes: 60,
    },
    {
      name: 'Abandoned Cart - Second Reminder',
      triggerType: 'SHOPIFY_EVENT' as const,
      shopifyEvent: 'ABANDONED_CART_2' as const,
      buttonTriggerText: null,
      categoryId: cartFlowCat.id,
      delayMinutes: 180,
    },
    {
      name: 'Abandoned Cart - Third Reminder',
      triggerType: 'SHOPIFY_EVENT' as const,
      shopifyEvent: 'ABANDONED_CART_3' as const,
      buttonTriggerText: null,
      categoryId: cartFlowCat.id,
      delayMinutes: 360,
    },
  ];

  for (const automation of automations) {
    try {
      await prisma.automation.create({
        data: {
          ...automation,
          templateId: undefined,
          variableMapping: {},
          isActive: false,
        },
      });
    } catch (e: any) {
      // Skip if automation already exists
      if (e.code !== 'P2002') throw e;
    }
  }

  console.log('✅ Automations seeded');
}

async function main() {
  console.log('🌱 Seeding database...');

  const customerCount = await prisma.customer.count();
  console.log(`Database connected. Customers: ${customerCount}`);

  await seedAutomationCategories();
  await seedAutomations();

  const automationCount = await prisma.automation.count();
  console.log(`\n✅ Seed complete! Total automations: ${automationCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
