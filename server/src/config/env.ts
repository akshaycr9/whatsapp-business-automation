import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  // Optional: set to your ngrok URL (e.g. https://xxx.ngrok-free.dev) so the server
  // prints the exact webhook URLs to configure in Shopify Admin and Meta App dashboard.
  PUBLIC_URL: z.string().url().optional(),
  DATABASE_URL: z.string().url(),
  META_ACCESS_TOKEN: z.string().min(1),
  META_PHONE_NUMBER_ID: z.string().min(1),
  META_WABA_ID: z.string().min(1),
  META_APP_SECRET: z.string().min(1),
  META_VERIFY_TOKEN: z.string().min(1),
  // Strip any protocol prefix and trailing slash so it's always a bare hostname
  // e.g. "https://your-store.myshopify.com/" → "your-store.myshopify.com"
  SHOPIFY_STORE_URL: z
    .string()
    .min(1)
    .transform((val) => val.replace(/^https?:\/\//, '').replace(/\/$/, '')),
  // Shopify Admin API access token — starts with shpat_ (private app) or shpua_ (custom app).
  // Find it in Shopify Admin → Apps → your app → API credentials.
  SHOPIFY_ACCESS_TOKEN: z
    .string()
    .min(1)
    .refine(
      (val) => !val.startsWith('your_') && val !== '',
      'SHOPIFY_ACCESS_TOKEN still contains a placeholder — set it to your real Shopify Admin API token',
    ),
  // Shopify webhook signing secret — find it in Shopify Admin → Settings → Notifications → Webhooks.
  SHOPIFY_WEBHOOK_SECRET: z
    .string()
    .min(1)
    .refine(
      (val) => !val.startsWith('your_'),
      'SHOPIFY_WEBHOOK_SECRET still contains a placeholder — set it to your real signing secret',
    ),
  // VAPID keys for Web Push Notifications (iOS PWA + desktop browsers).
  // Generate once with: node -e "const wp=require('web-push'); const k=wp.generateVAPIDKeys(); console.log(JSON.stringify(k,null,2))"
  // Run from server/ directory after npm install.
  VAPID_PUBLIC_KEY: z.string().min(1),
  VAPID_PRIVATE_KEY: z.string().min(1),
  // Must be "mailto:your@email.com" or your site URL — identifies you to push services.
  VAPID_EMAIL: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
