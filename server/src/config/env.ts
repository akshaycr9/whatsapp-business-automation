import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  META_ACCESS_TOKEN: z.string().min(1),
  META_PHONE_NUMBER_ID: z.string().min(1),
  META_WABA_ID: z.string().min(1),
  META_APP_SECRET: z.string().min(1),
  META_VERIFY_TOKEN: z.string().min(1),
  SHOPIFY_STORE_URL: z.string().min(1),
  SHOPIFY_ACCESS_TOKEN: z.string().min(1),
  SHOPIFY_WEBHOOK_SECRET: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
