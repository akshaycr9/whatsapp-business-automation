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
