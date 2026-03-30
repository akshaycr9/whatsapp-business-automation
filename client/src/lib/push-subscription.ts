import { api } from './api';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

/**
 * Converts a base64url VAPID public key to the Uint8Array format
 * required by PushManager.subscribe().
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/**
 * Registers the service worker and subscribes to Web Push.
 * Safe to call multiple times — re-uses an existing subscription if one exists.
 *
 * Returns false when:
 * - The browser doesn't support service workers or Push API
 * - VAPID_PUBLIC_KEY is not configured
 * - The user has denied notification permission
 */
export async function registerPushSubscription(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  if (!VAPID_PUBLIC_KEY) {
    console.warn('[push] VITE_VAPID_PUBLIC_KEY is not set — skipping push subscription');
    return false;
  }
  if (Notification.permission !== 'granted') return false;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    // Wait for the SW to be active before subscribing
    await navigator.serviceWorker.ready;

    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true, // required — iOS/browsers reject false
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }));

    const { endpoint, keys } = subscription.toJSON() as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };

    await api.post('/push/subscribe', { endpoint, keys });
    return true;
  } catch (err) {
    console.error('[push] Failed to register push subscription:', err);
    return false;
  }
}

/**
 * Unsubscribes from Web Push and removes the subscription from the server.
 */
export async function unregisterPushSubscription(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!registration) return;

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    await api.delete('/push/subscribe', { data: { endpoint: subscription.endpoint } });
    await subscription.unsubscribe();
  } catch (err) {
    console.error('[push] Failed to unregister push subscription:', err);
  }
}
