import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import {
  getTriggerInfo,
  getDelayDisplay,
  extractHeaderText,
  extractFooterText,
  extractPhoneButtons,
  buildPreviewBodyNodes,
  COD_FOLLOW_UP_DELAY_OPTIONS,
  ABANDONED_CART_DELAY_OPTIONS,
} from '@/utils/automations.utils';
import { TemplateComponentType, TemplateComponentFormat } from '@/types';
import { makeAutomation } from '@/test/factories/automation.factory';

// ── getTriggerInfo ────────────────────────────────────────────────────────────

describe('getTriggerInfo', () => {
  it('maps PREPAID_ORDER_CONFIRMED to package icon and correct label', () => {
    const automation = makeAutomation({ triggerType: 'SHOPIFY_EVENT', shopifyEvent: 'PREPAID_ORDER_CONFIRMED' });
    const info = getTriggerInfo(automation);
    expect(info.icon).toBe('package');
    expect(info.label).toBe('Order placed');
  });

  it('maps ORDER_FULFILLED to truck icon', () => {
    const automation = makeAutomation({ triggerType: 'SHOPIFY_EVENT', shopifyEvent: 'ORDER_FULFILLED' });
    expect(getTriggerInfo(automation).icon).toBe('truck');
  });

  it('maps COD_ORDER_CONFIRMATION to cash icon', () => {
    const automation = makeAutomation({ triggerType: 'SHOPIFY_EVENT', shopifyEvent: 'COD_ORDER_CONFIRMATION' });
    expect(getTriggerInfo(automation).icon).toBe('cash');
  });

  it('maps ABANDONED_CART_1 to cart icon', () => {
    const automation = makeAutomation({ triggerType: 'SHOPIFY_EVENT', shopifyEvent: 'ABANDONED_CART_1' });
    expect(getTriggerInfo(automation).icon).toBe('cart');
  });

  it('falls back to automation name for unknown shopify event', () => {
    const automation = makeAutomation({ triggerType: 'SHOPIFY_EVENT', shopifyEvent: null });
    const info = getTriggerInfo(automation);
    expect(info.label).toBe(automation.name);
    expect(info.icon).toBe('package');
  });

  it('uses buttonTriggerText for BUTTON_REPLY trigger type', () => {
    const automation = makeAutomation({
      triggerType: 'BUTTON_REPLY',
      buttonTriggerText: 'Confirm My Order',
      shopifyEvent: null,
    });
    const info = getTriggerInfo(automation);
    expect(info.label).toBe('Confirm My Order');
    expect(info.icon).toBe('cash');
  });

  it('falls back to "Button reply" when buttonTriggerText is null', () => {
    const automation = makeAutomation({ triggerType: 'BUTTON_REPLY', buttonTriggerText: null, shopifyEvent: null });
    expect(getTriggerInfo(automation).label).toBe('Button reply');
  });
});

// ── getDelayDisplay ───────────────────────────────────────────────────────────

describe('getDelayDisplay', () => {
  it('returns "Immediate" for 0 minutes', () => {
    expect(getDelayDisplay(0)).toBe('Immediate');
  });

  it('returns minutes for values under 60', () => {
    expect(getDelayDisplay(30)).toBe('30m');
    expect(getDelayDisplay(1)).toBe('1m');
  });

  it('returns "1h" for exactly 60 minutes', () => {
    expect(getDelayDisplay(60)).toBe('1h');
  });

  it('returns hours for values between 60 and 1440', () => {
    expect(getDelayDisplay(120)).toBe('2h');
    expect(getDelayDisplay(360)).toBe('6h');
  });

  it('returns days for values >= 1440', () => {
    expect(getDelayDisplay(1440)).toBe('1d');
    expect(getDelayDisplay(2880)).toBe('2d');
  });
});

// ── extractHeaderText ─────────────────────────────────────────────────────────

describe('extractHeaderText', () => {
  it('returns text from a TEXT header component', () => {
    const components = [
      { type: TemplateComponentType.HEADER, format: TemplateComponentFormat.TEXT, text: 'Welcome!' },
      { type: TemplateComponentType.BODY, text: 'Hello {{1}}' },
    ];
    expect(extractHeaderText(components)).toBe('Welcome!');
  });

  it('returns empty string when header has IMAGE format', () => {
    const components = [
      { type: TemplateComponentType.HEADER, format: TemplateComponentFormat.IMAGE },
    ];
    expect(extractHeaderText(components)).toBe('');
  });

  it('returns empty string when no header exists', () => {
    const components = [{ type: TemplateComponentType.BODY, text: 'Hello' }];
    expect(extractHeaderText(components)).toBe('');
  });

  it('returns empty string for non-array input', () => {
    expect(extractHeaderText(null)).toBe('');
    expect(extractHeaderText('not an array')).toBe('');
  });
});

// ── extractFooterText ─────────────────────────────────────────────────────────

describe('extractFooterText', () => {
  it('returns text from the FOOTER component', () => {
    const components = [
      { type: TemplateComponentType.BODY, text: 'body' },
      { type: TemplateComponentType.FOOTER, text: 'Powered by Qwertees' },
    ];
    expect(extractFooterText(components)).toBe('Powered by Qwertees');
  });

  it('returns empty string when no footer exists', () => {
    expect(extractFooterText([{ type: TemplateComponentType.BODY, text: 'only body' }])).toBe('');
  });

  it('returns empty string for non-array input', () => {
    expect(extractFooterText(undefined)).toBe('');
  });
});

// ── extractPhoneButtons ───────────────────────────────────────────────────────

describe('extractPhoneButtons', () => {
  it('maps BUTTONS component to PhoneButton array', () => {
    const components = [
      {
        type: TemplateComponentType.BUTTONS,
        buttons: [
          { type: 'QUICK_REPLY', text: 'Yes' },
          { type: 'QUICK_REPLY', text: 'No' },
        ],
      },
    ];
    const result = extractPhoneButtons(components);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ type: 'QUICK_REPLY', text: 'Yes' });
  });

  it('filters out buttons with empty text', () => {
    const components = [
      {
        type: TemplateComponentType.BUTTONS,
        buttons: [
          { type: 'QUICK_REPLY', text: '' },
          { type: 'QUICK_REPLY', text: 'Track Order' },
        ],
      },
    ];
    expect(extractPhoneButtons(components)).toHaveLength(1);
  });

  it('returns empty array when no BUTTONS component', () => {
    expect(extractPhoneButtons([{ type: TemplateComponentType.BODY, text: 'hello' }])).toHaveLength(0);
  });

  it('returns empty array for non-array input', () => {
    expect(extractPhoneButtons(null)).toHaveLength(0);
  });
});

// ── buildPreviewBodyNodes ─────────────────────────────────────────────────────

describe('buildPreviewBodyNodes', () => {
  it('returns placeholder text when body is empty', () => {
    const node = buildPreviewBodyNodes('', {}, () => '');
    const { getByText } = render(React.createElement(React.Fragment, null, node));
    expect(getByText('Your message preview will appear here.')).toBeInTheDocument();
  });

  it('renders plain text parts unchanged', () => {
    const node = buildPreviewBodyNodes('Hello world', {}, () => '');
    const { getByText } = render(React.createElement(React.Fragment, null, node));
    expect(getByText('Hello world')).toBeInTheDocument();
  });

  it('renders a mapped variable as a bold label', () => {
    const node = buildPreviewBodyNodes(
      'Hello {{1}}',
      { '1': 'customer.first_name' },
      (path) => (path === 'customer.first_name' ? 'First Name' : path),
    );
    const { getByText } = render(React.createElement(React.Fragment, null, node));
    expect(getByText('[First Name]')).toBeInTheDocument();
  });

  it('renders an unmapped variable as an italic placeholder', () => {
    const node = buildPreviewBodyNodes('Order: {{1}}', {}, () => '');
    const { getByText } = render(React.createElement(React.Fragment, null, node));
    expect(getByText('{{1}}')).toBeInTheDocument();
  });
});

// ── Delay option constants ────────────────────────────────────────────────────

describe('COD_FOLLOW_UP_DELAY_OPTIONS', () => {
  it('includes a 1-hour option', () => {
    expect(COD_FOLLOW_UP_DELAY_OPTIONS.some((o) => o.value === 60)).toBe(true);
  });

  it('every option has a numeric value and non-empty label', () => {
    COD_FOLLOW_UP_DELAY_OPTIONS.forEach((opt) => {
      expect(typeof opt.value).toBe('number');
      expect(opt.label.length).toBeGreaterThan(0);
    });
  });
});

describe('ABANDONED_CART_DELAY_OPTIONS', () => {
  it('includes 30, 60, 180, 360, 720, 1440 minutes', () => {
    const values = ABANDONED_CART_DELAY_OPTIONS.map((o) => o.value);
    [30, 60, 180, 360, 720, 1440].forEach((v) => expect(values).toContain(v));
  });
});
