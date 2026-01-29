/**
 * Notifications API methods
 * @module @open-sunsama/api-client/notifications
 */

import type {
  NotificationPreferences,
  UpdateNotificationPreferencesInput,
} from "@open-sunsama/types";
import type { OpenSunsamaClient, RequestOptions } from "./client.js";

/**
 * API response wrapper type
 */
interface ApiResponseWrapper<T> {
  success: boolean;
  data: T;
}

/**
 * Notifications API interface
 */
export interface NotificationsApi {
  /**
   * Get the current user's notification preferences
   * @returns The notification preferences
   */
  getPreferences(options?: RequestOptions): Promise<NotificationPreferences>;

  /**
   * Update the current user's notification preferences
   * @param input Fields to update
   * @returns The updated notification preferences
   */
  updatePreferences(
    input: UpdateNotificationPreferencesInput,
    options?: RequestOptions
  ): Promise<NotificationPreferences>;
}

/**
 * Create notifications API methods bound to a client
 * @param client The Open Sunsama client instance
 * @returns Notifications API methods
 */
export function createNotificationsApi(client: OpenSunsamaClient): NotificationsApi {
  return {
    async getPreferences(options?: RequestOptions): Promise<NotificationPreferences> {
      const response = await client.get<ApiResponseWrapper<NotificationPreferences>>(
        "notifications/preferences",
        options
      );
      return response.data;
    },

    async updatePreferences(
      input: UpdateNotificationPreferencesInput,
      options?: RequestOptions
    ): Promise<NotificationPreferences> {
      const response = await client.put<ApiResponseWrapper<NotificationPreferences>>(
        "notifications/preferences",
        input,
        options
      );
      return response.data;
    },
  };
}
