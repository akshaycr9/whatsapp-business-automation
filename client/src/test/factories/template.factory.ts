import { Template, TemplateStatus, TemplateCategory, TemplateComponentType } from '@/types/templates';

interface TemplateFactoryOverrides extends Partial<Template> {}

export const templateFactory = {
  create(overrides?: TemplateFactoryOverrides): Template {
    const now = new Date().toISOString();

    return {
      id: `temp-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Test Template',
      language: 'en',
      category: TemplateCategory.UTILITY,
      status: TemplateStatus.PENDING,
      components: [
        {
          type: TemplateComponentType.BODY,
          text: 'Hello {{1}}, your order is {{2}}',
        },
      ],
      rejectedReason: null,
      metaTemplateId: null,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  },

  createApproved(overrides?: TemplateFactoryOverrides): Template {
    return this.create({
      status: TemplateStatus.APPROVED,
      metaTemplateId: 'meta-' + Math.random().toString(36).substr(2, 9),
      ...overrides,
    });
  },

  createPending(overrides?: TemplateFactoryOverrides): Template {
    return this.create({
      status: TemplateStatus.PENDING,
      ...overrides,
    });
  },

  createRejected(overrides?: TemplateFactoryOverrides): Template {
    return this.create({
      status: TemplateStatus.REJECTED,
      rejectedReason: 'Template content violates policy',
      ...overrides,
    });
  },

  createMultiple(count: number, overrides?: TemplateFactoryOverrides): Template[] {
    const templates: Template[] = [];
    const statuses: TemplateStatus[] = [
      TemplateStatus.APPROVED,
      TemplateStatus.PENDING,
      TemplateStatus.REJECTED,
    ];

    for (let i = 0; i < count; i++) {
      templates.push(
        this.create({
          id: `temp-${i + 1}`,
          name: `Template ${i + 1}`,
          status: statuses[i % statuses.length],
          ...overrides,
        })
      );
    }

    return templates;
  },

  createFormData(): any {
    return {
      name: 'Order Confirmed',
      language: 'en',
      category: TemplateCategory.UTILITY,
      headerFormat: 'TEXT',
      headerText: 'Order Confirmation',
      bodyText: 'Hi {{1}}, your order {{2}} has been confirmed',
      footerText: 'Thank you for shopping with us',
      buttonGroup: 'QUICK_REPLY',
      buttons: [
        { type: 'QUICK_REPLY', text: 'View Order' },
        { type: 'QUICK_REPLY', text: 'Track Shipment' },
      ],
    };
  },
};
