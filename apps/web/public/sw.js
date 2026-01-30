/**
 * Service Worker for Open Sunsama Push Notifications
 * Handles push events and notification clicks
 */

// Default notification options
const DEFAULT_ICON = '/android-chrome-192x192.png';
const DEFAULT_BADGE = '/favicon-32x32.png';

/**
 * Handle incoming push notifications
 */
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.warn('[SW] Push event received but no data');
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    // If not JSON, use text as body
    payload = {
      title: 'Open Sunsama',
      body: event.data.text(),
    };
  }

  const {
    title = 'Open Sunsama',
    body = '',
    icon = DEFAULT_ICON,
    badge = DEFAULT_BADGE,
    tag,
    data = {},
    actions = [],
    requireInteraction = false,
  } = payload;

  const options = {
    body,
    icon,
    badge,
    tag,
    data,
    actions,
    requireInteraction,
    // Vibration pattern for mobile (vibrate, pause, vibrate)
    vibrate: [200, 100, 200],
    // Show notification even if app is in foreground
    renotify: !!tag,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/**
 * Handle notification click events
 */
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  // Close the notification
  notification.close();

  // Determine what URL to open based on action
  let targetUrl = '/';

  if (action === 'complete' && data.taskId) {
    // User clicked "Mark Complete" - open task with complete action
    targetUrl = `/?task=${data.taskId}&action=complete`;
  } else if (action === 'snooze' && data.taskId) {
    // User clicked "Snooze" - open task with snooze action
    targetUrl = `/?task=${data.taskId}&action=snooze`;
  } else if (data.url) {
    // Use the URL from notification data
    targetUrl = data.url;
  } else if (data.taskId) {
    // Default: open the task
    targetUrl = `/?task=${data.taskId}`;
  }

  // Open or focus the app window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Navigate to target URL and focus
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // App not open, open new window
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

/**
 * Handle notification close events (for analytics/cleanup)
 */
self.addEventListener('notificationclose', (event) => {
  const notification = event.notification;
  const data = notification.data || {};

  // Could send analytics about dismissed notifications
  console.log('[SW] Notification closed:', notification.tag, data);
});

/**
 * Service worker install event
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Service worker installed');
  // Take control immediately without waiting for reload
  self.skipWaiting();
});

/**
 * Service worker activate event
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Service worker activated');
  // Take control of all pages immediately
  event.waitUntil(clients.claim());
});
