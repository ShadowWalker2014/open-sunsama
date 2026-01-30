/**
 * MCP tools for user profile management
 * Provides tools for viewing and updating user profile information
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient, User, UserPreferences } from "../lib/api-client.js";

/**
 * Format user profile for display
 */
function formatUserProfile(user: User): string {
  const lines: string[] = [
    `Name: ${user.name || "(not set)"}`,
    `Email: ${user.email}`,
    `Timezone: ${user.timezone}`,
    `Avatar URL: ${user.avatarUrl || "(not set)"}`,
    `Account created: ${new Date(user.createdAt).toLocaleDateString()}`,
    `Last updated: ${new Date(user.updatedAt).toLocaleDateString()}`,
  ];

  if (user.preferences) {
    lines.push("");
    lines.push("Preferences:");
    lines.push(`  Theme mode: ${user.preferences.themeMode}`);
    lines.push(`  Color theme: ${user.preferences.colorTheme}`);
    lines.push(`  Font family: ${user.preferences.fontFamily}`);
  }

  return lines.join("\n");
}

/**
 * Creates a success response for MCP tools
 */
function successResponse(text: string) {
  return {
    content: [{ type: "text" as const, text }],
  };
}

/**
 * Creates an error response for MCP tools
 */
function errorResponse(message: string) {
  return {
    content: [{ type: "text" as const, text: `Error: ${message}` }],
    isError: true,
  };
}

/**
 * Register all user-related tools with the MCP server
 */
export function registerUserTools(
  server: McpServer,
  apiClient: ApiClient
): void {
  // Get current user profile
  server.tool(
    "get_user_profile",
    "Get the current authenticated user's profile information. Returns the user's name, email, timezone, avatar URL, and preferences (theme mode, color theme, font family). This is useful for personalizing interactions or understanding the user's settings.",
    {},
    async () => {
      try {
        const response = await apiClient.getMe();

        if (!response.success) {
          return errorResponse(
            response.error?.message || "Failed to fetch user profile"
          );
        }

        const user = response.data!;
        const formattedProfile = formatUserProfile(user);

        return successResponse(
          `User Profile:\n\n${formattedProfile}\n\nUser ID: ${user.id}`
        );
      } catch (error) {
        return errorResponse(
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }
  );

  // Update user profile
  server.tool(
    "update_user_profile",
    "Update the current user's profile information. You can update the user's display name, timezone, avatar URL, and preferences (theme mode, color theme, font family). At least one field must be provided. The timezone should be a valid IANA timezone identifier (e.g., 'America/New_York', 'Europe/London', 'Asia/Tokyo').",
    {
      name: z
        .string()
        .optional()
        .describe(
          "The user's display name. This is shown in the UI and can be any string"
        ),
      timezone: z
        .string()
        .optional()
        .describe(
          "The user's timezone as an IANA timezone identifier (e.g., 'America/New_York', 'Europe/London', 'Asia/Tokyo', 'UTC'). Used for scheduling and displaying times"
        ),
      avatarUrl: z
        .string()
        .nullable()
        .optional()
        .describe(
          "URL to the user's avatar image. Set to null to remove the avatar"
        ),
      themeMode: z
        .enum(["light", "dark", "system"])
        .optional()
        .describe(
          "UI theme mode preference. 'light' for light theme, 'dark' for dark theme, 'system' to follow system settings"
        ),
      colorTheme: z
        .string()
        .optional()
        .describe(
          "Color theme/accent color for the UI (e.g., 'blue', 'green', 'purple')"
        ),
      fontFamily: z
        .string()
        .optional()
        .describe(
          "Font family preference for the UI (e.g., 'Inter', 'SF Pro', 'Roboto')"
        ),
    },
    async (input) => {
      try {
        // Build update data
        const updateData: {
          name?: string;
          timezone?: string;
          avatarUrl?: string | null;
          preferences?: Partial<UserPreferences>;
        } = {};

        // Handle direct fields
        if (input.name !== undefined) {
          updateData.name = input.name;
        }
        if (input.timezone !== undefined) {
          updateData.timezone = input.timezone;
        }
        if (input.avatarUrl !== undefined) {
          updateData.avatarUrl = input.avatarUrl;
        }

        // Handle preferences
        const preferences: Partial<UserPreferences> = {};
        if (input.themeMode !== undefined) {
          preferences.themeMode = input.themeMode;
        }
        if (input.colorTheme !== undefined) {
          preferences.colorTheme = input.colorTheme;
        }
        if (input.fontFamily !== undefined) {
          preferences.fontFamily = input.fontFamily;
        }

        if (Object.keys(preferences).length > 0) {
          updateData.preferences = preferences;
        }

        // Check if at least one field is provided
        if (Object.keys(updateData).length === 0) {
          return errorResponse(
            "At least one field must be provided to update the profile"
          );
        }

        const response = await apiClient.updateMe(updateData);

        if (!response.success) {
          return errorResponse(
            response.error?.message || "Failed to update user profile"
          );
        }

        const user = response.data!;
        const updatedFields: string[] = [];

        if (input.name !== undefined) updatedFields.push("name");
        if (input.timezone !== undefined) updatedFields.push("timezone");
        if (input.avatarUrl !== undefined) updatedFields.push("avatarUrl");
        if (input.themeMode !== undefined) updatedFields.push("themeMode");
        if (input.colorTheme !== undefined) updatedFields.push("colorTheme");
        if (input.fontFamily !== undefined) updatedFields.push("fontFamily");

        return successResponse(
          `Successfully updated user profile (fields: ${updatedFields.join(", ")}):\n\n${formatUserProfile(user)}`
        );
      } catch (error) {
        return errorResponse(
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }
  );
}
