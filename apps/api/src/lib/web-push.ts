/**
 * Web Push notification utilities
 * Handles sending push notifications to subscribed browsers
 */

import webpush from 'web-push';
import { getDb, eq, pushSubscriptions } from '@open-sunsama/database';

// VAPID keys for authentication with push services
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@opensunsama.com';

// Track if VAPID is configured
let vapidConfigured = false;

/**
 * Initialize web-push with VAPID details
 * Call this once at startup
 */
export function initWebPush(): boolean {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('[WebPush] VAPID keys not configured - push notifications disabled');
    return false;
  }

  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    vapidConfigured = true;
    console.log('[WebPush] Initialized with VAPID keys');
    return true;
  } catch (error) {
    console.error('[WebPush] Failed to initialize:', error);
    return false;
  }
}

/**
 * Check if web push is properly configured
 */
export function isWebPushConfigured(): boolean {
  return vapidConfigured;
}

/**
 * Get the public VAPID key for client-side subscription
 */
export function getVapidPublicKey(): string | null {
  return VAPID_PUBLIC_KEY || null;
}

/**
 * Notification payload structure
 */
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{ action: string; title: string; icon?: string }>;
  requireInteraction?: boolean;
}

/**
 * Send a push notification to a specific subscription
 */
export async function sendPushNotification(
  subscription: {
    endpoint: string;
    p256dhKey: string;
    authKey: string;
  },
  payload: PushNotificationPayload
): Promise<{ success: boolean; error?: string }> {
  if (!vapidConfigured) {
    return { success: false, error: 'Web push not configured' };
  }

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dhKey,
      auth: subscription.authKey,
    },
  };

  try {
    await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
    return { success: true };
  } catch (error) {
    // Handle specific error cases
    if (error instanceof webpush.WebPushError) {
      // 410 Gone or 404 Not Found means subscription is no longer valid
      if (error.statusCode === 410 || error.statusCode === 404) {
        // Remove invalid subscription from database
        const db = getDb();
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.endpoint, subscription.endpoint));
        
        return { success: false, error: 'Subscription expired or invalid - removed' };
      }
      return { success: false, error: `Push failed: ${error.message} (${error.statusCode})` };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send a push notification to all subscriptions for a user
 */
export async function sendPushToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number; errors: string[] }> {
  if (!vapidConfigured) {
    return { sent: 0, failed: 0, errors: ['Web push not configured'] };
  }

  const db = getDb();
  const subscriptions = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0, errors: [] };
  }

  const results = await Promise.all(
    subscriptions.map((sub) =>
      sendPushNotification(
        {
          endpoint: sub.endpoint,
          p256dhKey: sub.p256dhKey,
          authKey: sub.authKey,
        },
        payload
      )
    )
  );

  const sent = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const errors = results.filter((r) => r.error).map((r) => r.error!);

  return { sent, failed, errors };
}

/**
 * Send a task reminder notification
 */
export async function sendTaskReminderPush(
  userId: string,
  task: { id: string; title: string; scheduledTime?: string | null }
): Promise<void> {
  const payload: PushNotificationPayload = {
    title: 'Task Reminder',
    body: task.title,
    icon: '/android-chrome-192x192.png',
    badge: '/favicon-32x32.png',
    tag: `task-reminder-${task.id}`,
    data: {
      type: 'task-reminder',
      taskId: task.id,
      url: `/tasks?task=${task.id}`,
    },
    actions: [
      { action: 'complete', title: 'Mark Complete' },
      { action: 'snooze', title: 'Snooze 15min' },
    ],
    requireInteraction: true,
  };

  await sendPushToUser(userId, payload);
}

// Auto-initialize on module load
initWebPush();
