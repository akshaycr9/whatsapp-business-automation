/**
 * Strips all non-digit characters and returns E.164 format without `+` prefix.
 * e.g. "+91 98765-43210" → "919876543210"
 */
export const normalizePhone = (raw: string): string =>
  raw.replace(/[^\d]/g, '');

/**
 * A valid phone number is 10–15 digits after normalization.
 */
export const isValidPhone = (phone: string): boolean =>
  /^\d{10,15}$/.test(phone);

/**
 * Extracts a phone number from a Shopify webhook payload, checking four
 * sources in order of reliability:
 *   1. shipping_address.phone  (most common — entered at checkout)
 *   2. billing_address.phone   (fallback if shipping differs)
 *   3. customer.phone          (only present on accounts with saved phone)
 *   4. root body.phone         (checkout-level field used by checkouts/* topics)
 *
 * Returns the raw string so the caller can pass it through normalizePhone().
 * Returns null if all sources are empty.
 */
export const extractShopifyPhone = (body: Record<string, unknown>): string | null => {
  const shipping = body['shipping_address'] as Record<string, unknown> | null | undefined;
  const billing = body['billing_address'] as Record<string, unknown> | null | undefined;
  const customer = body['customer'] as Record<string, unknown> | null | undefined;

  return (
    (shipping?.['phone'] as string | null | undefined) ||
    (billing?.['phone'] as string | null | undefined) ||
    (customer?.['phone'] as string | null | undefined) ||
    (body['phone'] as string | null | undefined) ||
    null
  );
};
