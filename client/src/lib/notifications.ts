// ── Audio ─────────────────────────────────────────────────────────────────────

// Reuse one AudioContext across calls — browsers allow only a limited number
// and creating a new one per notification can hit that limit quickly.
let _audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!_audioCtx || _audioCtx.state === 'closed') {
    _audioCtx = new AudioContext();
  }
  return _audioCtx;
}

function doPlay(ctx: AudioContext): void {
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

  // Two-tone ascending ding
  for (const [i, freq] of ([880, 1100] as const).entries()) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    const t = ctx.currentTime + i * 0.15;
    osc.start(t);
    osc.stop(t + 0.3);
  }
}

/**
 * Plays a short two-tone notification ding via the Web Audio API.
 * Handles the "suspended" context state that browsers enforce until a
 * user gesture has occurred — resumes the context before playing.
 */
export function playNotificationSound(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => doPlay(ctx)).catch(() => {});
    } else {
      doPlay(ctx);
    }
  } catch {
    // Silently ignore (e.g. AudioContext not supported)
  }
}

// ── Browser notifications ─────────────────────────────────────────────────────

/**
 * Requests browser notification permission.
 * Must be called from within a user-gesture handler to reliably show
 * the browser's permission dialog (not just the quiet address-bar bell).
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

const BODY_LIMIT = 100;

/**
 * Shows a native browser notification when permission is granted.
 * Body is truncated to BODY_LIMIT characters.
 */
export function showBrowserNotification(title: string, body: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const truncated = body.length > BODY_LIMIT ? `${body.slice(0, BODY_LIMIT)}…` : body;

  try {
    new Notification(title, {
      body: truncated,
      icon: '/favicon.svg',
      // Replace previous notification instead of stacking
      tag: 'wa-inbound-message',
    });
  } catch {
    // Silently ignore
  }
}
