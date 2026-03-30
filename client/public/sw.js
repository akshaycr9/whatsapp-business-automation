// Service Worker for Web Push Notifications
// Handles push events from the server and notification click navigation.
// iOS 16.4+ supports this when the PWA is added to the Home Screen.

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'New WhatsApp Message', body: event.data.text() };
  }

  const title = payload.title ?? 'New WhatsApp Message';
  const options = {
    body: payload.body ?? '',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'wa-inbound-message',
    // Renotify so each new message replaces the previous banner with a fresh alert
    renotify: true,
    data: {
      url: payload.url ?? '/conversations',
    },
  };

  event.waitUntil(
    // Skip the OS notification if the app window is currently focused —
    // the Socket.io in-app notification already handles that case.
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const hasFocusedWindow = clients.some((c) => c.focused);
        if (hasFocusedWindow) return;
        return self.registration.showNotification(title, options);
      }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? '/conversations';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Navigate an existing window if one is open
      if (clients.length > 0) {
        const existing = clients[0];
        existing.navigate(targetUrl);
        return existing.focus();
      }
      // Otherwise open a new window
      return self.clients.openWindow(targetUrl);
    }),
  );
});
