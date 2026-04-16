// V2 hard-coded mock data — design phase only.
// Replace with real Redux/API data when wiring up functionality.

export interface V2Flow {
  id: string;
  name: string;
  active: boolean;
  templateName: string;
  timing: string;
  parameterMapping: V2ParameterMapping[];
  messagePreview: string;
}

export interface V2ParameterMapping {
  label: string;
  shopifyPath: string;
}

export interface V2FlowCategory {
  id: string;
  label: string;
  icon: 'shopping_cart' | 'payments' | 'shopping_basket';
  pageTitle: string;
  description: string;
  flows: V2Flow[];
}

export const FLOW_CATEGORIES: V2FlowCategory[] = [
  {
    id: 'order-flow',
    label: 'Order Flow',
    icon: 'shopping_cart',
    pageTitle: 'Order Flow Management',
    description:
      'Configure and monitor your automated messaging flows for prepaid order updates.',
    flows: [
      {
        id: 'order-confirmed',
        name: 'Order Confirmed',
        active: true,
        templateName: 'Order Confirmation Template',
        timing: 'Immediate',
        parameterMapping: [
          { label: 'Customer Name', shopifyPath: 'Shopify: First Name' },
          { label: 'Order Number', shopifyPath: 'Shopify: Order ID' },
          { label: 'Order Total', shopifyPath: 'Shopify: Total Price' },
        ],
        messagePreview:
          "Hello *{{Customer Name}}*, your order *#{{Order Number}}* has been confirmed! We'll notify you as soon as it ships. Total: *{{Order Total}}*.",
      },
      {
        id: 'order-cancelled',
        name: 'Order Cancelled',
        active: true,
        templateName: 'Order Shipping Update',
        timing: 'Immediate',
        parameterMapping: [
          { label: 'Customer Name', shopifyPath: 'Shopify: First Name' },
          { label: 'Order Number', shopifyPath: 'Shopify: Order ID' },
        ],
        messagePreview:
          "Hello *{{Customer Name}}*, unfortunately your order *#{{Order Number}}* has been cancelled. Please contact us if you have questions.",
      },
      {
        id: 'order-fulfilled',
        name: 'Order Fulfilled',
        active: true,
        templateName: 'Order Shipping Update',
        timing: 'Immediate',
        parameterMapping: [
          { label: 'Customer Name', shopifyPath: 'Shopify: First Name' },
          { label: 'Order Number', shopifyPath: 'Shopify: Order ID' },
          { label: 'Tracking URL', shopifyPath: 'Shopify: Tracking URL' },
        ],
        messagePreview:
          "Great news, *{{Customer Name}}*! Your order *#{{Order Number}}* is on its way. Track it here: {{Tracking URL}}",
      },
    ],
  },
  {
    id: 'cod-flow',
    label: 'COD Flow',
    icon: 'payments',
    pageTitle: 'COD Flow Management',
    description:
      'Configure and monitor your automated messaging flows for cash on delivery order updates.',
    flows: [
      {
        id: 'cod-order-confirmation',
        name: 'COD Order Confirmation',
        active: true,
        templateName: 'COD Verification',
        timing: 'Immediate',
        parameterMapping: [
          { label: 'Customer Name', shopifyPath: 'Shopify: First Name' },
          { label: 'Order Number', shopifyPath: 'Shopify: Order ID' },
          { label: 'Order Total', shopifyPath: 'Shopify: Total Price' },
        ],
        messagePreview:
          "Hello *{{Customer Name}}*, your COD order *#{{Order Number}}* has been placed! Please keep ₹{{Order Total}} ready at the time of delivery.",
      },
      {
        id: 'cod-order-follow-up',
        name: 'COD Order Follow Up',
        active: true,
        templateName: 'COD Verification',
        timing: '30 minutes',
        parameterMapping: [
          { label: 'Customer Name', shopifyPath: 'Shopify: First Name' },
          { label: 'Order Number', shopifyPath: 'Shopify: Order ID' },
        ],
        messagePreview:
          "Hi *{{Customer Name}}*, just a reminder that your COD order *#{{Order Number}}* is being processed. Reply YES to confirm or NO to cancel.",
      },
      {
        id: 'cod-order-cancel',
        name: 'COD Order Cancel',
        active: true,
        templateName: 'Order Shipping Update',
        timing: 'Immediate',
        parameterMapping: [
          { label: 'Customer Name', shopifyPath: 'Shopify: First Name' },
          { label: 'Order Number', shopifyPath: 'Shopify: Order ID' },
        ],
        messagePreview:
          "Hello *{{Customer Name}}*, your COD order *#{{Order Number}}* has been cancelled as requested. Let us know if you need any help.",
      },
      {
        id: 'cod-order-confirm',
        name: 'COD Order Confirm',
        active: true,
        templateName: 'COD Verification',
        timing: 'Immediate',
        parameterMapping: [
          { label: 'Customer Name', shopifyPath: 'Shopify: First Name' },
          { label: 'Order Number', shopifyPath: 'Shopify: Order ID' },
        ],
        messagePreview:
          "Great, *{{Customer Name}}*! Your COD order *#{{Order Number}}* is confirmed. We'll notify you once it ships.",
      },
    ],
  },
  {
    id: 'abandoned-cart',
    label: 'Abandoned Cart',
    icon: 'shopping_basket',
    pageTitle: 'Abandoned Cart Management',
    description:
      'Configure and monitor your automated messaging flows for cart recovery.',
    flows: [
      {
        id: 'cart-reminder',
        name: 'Cart Reminder',
        active: true,
        templateName: 'Abandoned Cart Recovery',
        timing: '1 hour',
        parameterMapping: [
          { label: 'Customer Name', shopifyPath: 'Shopify: First Name' },
          { label: 'Cart URL', shopifyPath: 'Shopify: Cart URL' },
        ],
        messagePreview:
          "Hey *{{Customer Name}}*, you left something behind! 🛒 Complete your purchase here: {{Cart URL}}",
      },
      {
        id: 'recovery-offer',
        name: 'Recovery Offer',
        active: true,
        templateName: 'Abandoned Cart Recovery',
        timing: '6 hours',
        parameterMapping: [
          { label: 'Customer Name', shopifyPath: 'Shopify: First Name' },
          { label: 'Discount Code', shopifyPath: 'Shopify: Discount Code' },
          { label: 'Cart URL', shopifyPath: 'Shopify: Cart URL' },
        ],
        messagePreview:
          "Hi *{{Customer Name}}*, here's an exclusive 10% off for you! Use code *{{Discount Code}}* to complete your order: {{Cart URL}}",
      },
      {
        id: 'win-back-discount',
        name: 'Win-back Discount',
        active: false,
        templateName: 'Abandoned Cart Recovery',
        timing: '1 hour',
        parameterMapping: [
          { label: 'Customer Name', shopifyPath: 'Shopify: First Name' },
          { label: 'Cart URL', shopifyPath: 'Shopify: Cart URL' },
        ],
        messagePreview:
          "We miss you, *{{Customer Name}}*! Your cart is still waiting. Come back and we'll make it worth your while: {{Cart URL}}",
      },
    ],
  },
];

export const TEMPLATE_OPTIONS = [
  'Order Confirmation Template',
  'Order Shipping Update',
  'Feedback Request',
  'COD Verification',
  'Abandoned Cart Recovery',
];

export const TIMING_OPTIONS = ['Immediate', '10 minutes', '30 minutes', '1 hour', '6 hours'];
