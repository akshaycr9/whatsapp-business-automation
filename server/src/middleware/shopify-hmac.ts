import crypto from 'crypto';
import { type Request, type Response, type NextFunction } from 'express';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

export const verifyShopifyHmac = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const rawBody = req.rawBody;

  if (!rawBody) {
    logger.error('Shopify HMAC: missing raw body');
    res.sendStatus(400);
    return;
  }

  const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string | undefined;

  if (!hmacHeader) {
    logger.warn('Shopify HMAC: missing X-Shopify-Hmac-Sha256 header');
    res.sendStatus(401);
    return;
  }

  const computed = crypto
    .createHmac('sha256', env.SHOPIFY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('base64');

  try {
    const computedBuf = Buffer.from(computed);
    const headerBuf = Buffer.from(hmacHeader);

    if (
      computedBuf.length !== headerBuf.length ||
      !crypto.timingSafeEqual(computedBuf, headerBuf)
    ) {
      logger.warn('Shopify HMAC: invalid signature');
      res.sendStatus(401);
      return;
    }
  } catch {
    logger.warn('Shopify HMAC: signature comparison failed');
    res.sendStatus(401);
    return;
  }

  next();
};
