/**
 * Plays a short two-tone notification sound using the Web Audio API.
 * No audio files required. Fails silently if AudioContext is unavailable
 * (e.g., before any user interaction on some browsers).
 */
export function playNotificationSound(): void {
  try {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    // Two-tone ascending ding (similar to messaging app sounds)
    const tones = [
      { freq: 880, start: 0 },
      { freq: 1100, start: 0.15 },
    ];

    for (const { freq, start } of tones) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + 0.3);
    }
  } catch {
    // Silently ignore — AudioContext unavailable or suspended
  }
}

/**
 * Requests browser notification permission. Should be called after a
 * user gesture (e.g., first click in the app) to maximise acceptance.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

const NOTIFICATION_BODY_LIMIT = 100;

/**
 * Shows a native browser notification if permission has been granted.
 * `body` is truncated to NOTIFICATION_BODY_LIMIT characters.
 */
export function showBrowserNotification(title: string, body: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const truncated =
    body.length > NOTIFICATION_BODY_LIMIT
      ? `${body.slice(0, NOTIFICATION_BODY_LIMIT)}…`
      : body;

  try {
    new Notification(title, {
      body: truncated,
      icon: '/favicon.svg',
      tag: 'whatsapp-message', // replaces previous notification instead of stacking
    });
  } catch {
    // Silently ignore
  }
}
