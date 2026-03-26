/**
 * Strips all non-digit characters and ensures the India country code (91) is
 * present, returning E.164 format without `+` prefix.
 *
 * Examples:
 *   "9876543210"        → "919876543210"  (bare 10-digit, prepend 91)
 *   "+91 98765-43210"   → "919876543210"  (already has country code, strip formatting)
 *   "919876543210"      → "919876543210"  (already correct, untouched)
 *   "09876543210"       → "919876543210"  (leading 0 stripped, 91 prepended)
 */
export const normalizePhone = (raw: string): string => {
  const digits = raw.replace(/[^\d]/g, '');
  // A bare 10-digit number has no country code — prepend India's dial code
  if (digits.length === 10) return `91${digits}`;
  // An 11-digit number starting with 0 is a local trunk-prefixed number — replace leading 0 with 91
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return digits;
};

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
