import { api } from './api';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

/**
 * Converts a base64url VAPID public key to the Uint8Array format
 * required by PushManager.subscribe().
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0))) as Uint8Array<ArrayBuffer>;
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
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[push] Service workers or PushManager not supported in this browser');
    return false;
  }
  if (!VAPID_PUBLIC_KEY) {
    console.error('[push] VITE_VAPID_PUBLIC_KEY is not set — check your .env file');
    return false;
  }
  if (Notification.permission !== 'granted') {
    console.warn('[push] Notification permission not granted:', Notification.permission);
    return false;
  }

  try {
    console.log('[push] Registering service worker…');
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('[push] Service worker registered, waiting for ready…');
    await navigator.serviceWorker.ready;
    console.log('[push] Service worker ready, subscribing to push…');

    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      console.log('[push] Re-using existing push subscription, saving to server…');
    }
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true, // required — iOS/browsers reject false
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }));

    const json = subscription.toJSON();
    const endpoint = json.endpoint;
    const p256dh = json.keys?.['p256dh'];
    const auth = json.keys?.['auth'];

    if (!endpoint || !p256dh || !auth) {
      console.error('[push] Subscription JSON missing keys:', json);
      return false;
    }

    await api.post('/push/subscribe', { endpoint, keys: { p256dh, auth } });
    console.log('[push] ✅ Push subscription saved to server');
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
