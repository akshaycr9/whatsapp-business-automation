import webPush from 'web-push';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';

webPush.setVapidDetails(env.VAPID_EMAIL, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);

export interface PushPayload {
  title: string;
  body: string;
  conversationId?: string;
  url?: string;
}

export const saveSubscription = async (
  endpoint: string,
  p256dh: string,
  auth: string,
  userAgent?: string,
): Promise<void> => {
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh, auth, userAgent },
    update: { p256dh, auth, userAgent },
  });
  logger.info(`Push subscription saved: ${endpoint.slice(0, 60)}…`);
};

export const removeSubscription = async (endpoint: string): Promise<void> => {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
};

/**
 * Sends a Web Push notification to every stored subscription.
 * Expired/unsubscribed endpoints (HTTP 410/404) are automatically removed.
 */
export const sendPushToAll = async (payload: PushPayload): Promise<void> => {
  const subscriptions = await prisma.pushSubscription.findMany();
  if (subscriptions.length === 0) return;

  const notification = JSON.stringify(payload);

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webPush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        notification,
      ),
    ),
  );

  results.forEach((result, idx) => {
    if (result.status === 'rejected') {
      const err = result.reason as { statusCode?: number };
      if (err.statusCode === 410 || err.statusCode === 404) {
        // Subscription is gone — clean it up silently
        removeSubscription(subscriptions[idx].endpoint).catch(() => {});
      } else {
        logger.error('Push notification failed:', result.reason);
      }
    }
  });
};
