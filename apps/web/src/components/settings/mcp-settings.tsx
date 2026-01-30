import * as React from "react";
import { Check, Copy, Loader2, Terminal, AlertCircle, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { useApiKeys, useCreateApiKey } from "@/hooks/useApiKeys";
import type { ApiKey, ApiKeyScope } from "@open-sunsama/types";

const MCP_KEY_NAME = "MCP Integration";
const ALL_SCOPES: ApiKeyScope[] = [
  "tasks:read",
  "tasks:write",
  "time-blocks:read",
  "time-blocks:write",
];

type ClientTab = "general" | "cursor" | "claude" | "vscode" | "windsurf";

const CLIENT_TABS: { id: ClientTab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "cursor", label: "Cursor" },
  { id: "claude", label: "Claude" },
  { id: "vscode", label: "VS Code" },
  { id: "windsurf", label: "Windsurf" },
];

/**
 * MCP Integration settings tab
 * Shows setup instructions for various MCP clients with auto-generated API key
 */
export function McpSettings() {
  const [activeClient, setActiveClient] = React.useState<ClientTab>("cursor");
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [mcpKey, setMcpKey] = React.useState<string | null>(null);
  const [isCreatingKey, setIsCreatingKey] = React.useState(false);

  const { data: apiKeys, isLoading: isLoadingKeys } = useApiKeys();
  const createMutation = useCreateApiKey();

  // Get the API URL from environment
  const apiUrl = import.meta.env.VITE_API_URL || "https://api.opensunsama.com";

  // Find existing MCP key
  const existingMcpKey = React.useMemo(() => {
    return apiKeys?.find((key: ApiKey) => key.name === MCP_KEY_NAME);
  }, [apiKeys]);

  // Auto-create MCP key if it doesn't exist
  React.useEffect(() => {
    const createMcpKeyIfNeeded = async () => {
      if (isLoadingKeys || existingMcpKey || isCreatingKey || mcpKey) return;

      setIsCreatingKey(true);
      const response = await createMutation.mutateAsync({
        name: MCP_KEY_NAME,
        scopes: ALL_SCOPES,
        expiresAt: null,
      });
      setMcpKey(response.key);
      setIsCreatingKey(false);
    };

    createMcpKeyIfNeeded();
  }, [isLoadingKeys, existingMcpKey, isCreatingKey, mcpKey, createMutation]);

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRegenerateKey = async () => {
    setIsCreatingKey(true);
    const response = await createMutation.mutateAsync({
      name: MCP_KEY_NAME,
      scopes: ALL_SCOPES,
      expiresAt: null,
    });
    setMcpKey(response.key);
    setIsCreatingKey(false);
  };

  // Show loading state
  if (isLoadingKeys || isCreatingKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>MCP Integration</CardTitle>
          <CardDescription>
            Connect AI assistants to Open Sunsama using the Model Context Protocol
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              {isCreatingKey ? "Creating MCP API key..." : "Loading..."}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // The API key to display - either newly created or existing (prefix only)
  const displayKey = mcpKey || (existingMcpKey ? existingMcpKey.keyPrefix + "..." : null);
  const hasFullKey = !!mcpKey;

  // Generate config JSON for each client
  const generateConfig = (client: ClientTab): string => {
    const keyPlaceholder = hasFullKey ? mcpKey : "os_your-api-key-here";
    
    const baseConfig = {
      command: "node",
      args: ["/path/to/open-sunsama/mcp/build/index.js"],
      env: {
        OPENSUNSAMA_API_KEY: keyPlaceholder,
        ...(apiUrl !== "https://api.opensunsama.com" && { OPENSUNSAMA_API_URL: apiUrl }),
      },
    };

    switch (client) {
      case "general":
        return JSON.stringify(
          {
            mcpServers: {
              "open-sunsama": baseConfig,
            },
          },
          null,
          2
        );

      case "cursor":
        return JSON.stringify(
          {
            mcpServers: {
              "open-sunsama": baseConfig,
            },
          },
          null,
          2
        );

      case "claude":
        return JSON.stringify(
          {
            mcpServers: {
              "open-sunsama": baseConfig,
            },
          },
          null,
          2
        );

      case "vscode":
        return JSON.stringify(
          {
            mcpServers: [
              {
                name: "open-sunsama",
                ...baseConfig,
              },
            ],
          },
          null,
          2
        );

      case "windsurf":
        return JSON.stringify(
          {
            mcpServers: {
              "open-sunsama": baseConfig,
            },
          },
          null,
          2
        );

      default:
        return "";
    }
  };

  const getConfigPath = (client: ClientTab): string => {
    switch (client) {
      case "cursor":
        return ".cursor/mcp.json (project) or Cursor Settings → MCP";
      case "claude":
        return "~/Library/Application Support/Claude/claude_desktop_config.json (macOS)\n%APPDATA%\\Claude\\claude_desktop_config.json (Windows)";
      case "vscode":
        return "~/.continue/config.json";
      case "windsurf":
        return "Windsurf MCP settings";
      default:
        return "Your MCP client configuration file";
    }
  };

  const configJson = generateConfig(activeClient);

  return (
    <Card>
      <CardHeader>
        <CardTitle>MCP Integration</CardTitle>
        <CardDescription>
          Connect AI assistants like Claude, Cursor, and Windsurf to Open Sunsama
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* API Key Section */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Terminal className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Your MCP API Key</p>
                {hasFullKey ? (
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-background px-2 py-1 font-mono text-xs">
                      {mcpKey}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleCopy(mcpKey!, "apiKey")}
                    >
                      {copiedField === "apiKey" ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Key prefix: <code className="rounded bg-background px-1">{displayKey}</code>
                    </p>
                    <div className="flex items-center gap-2 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Full key was shown only once at creation. Generate a new key to see it.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerateKey}
              disabled={isCreatingKey}
            >
              {isCreatingKey ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              )}
              New Key
            </Button>
          </div>
        </div>

        {/* Client Tabs */}
        <div className="space-y-4">
          <div className="flex gap-1 rounded-lg border bg-muted/30 p-1">
            {CLIENT_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveClient(tab.id)}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  activeClient === tab.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Config Path */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Configuration file location:</p>
            <p className="whitespace-pre-line text-xs text-muted-foreground/80">
              {getConfigPath(activeClient)}
            </p>
          </div>

          {/* Code Block */}
          <div className="relative">
            <div className="absolute right-2 top-2 z-10">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 bg-background/80 text-xs backdrop-blur-sm"
                onClick={() => handleCopy(configJson, "config")}
              >
                {copiedField === "config" ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <pre className="overflow-x-auto rounded-lg border bg-zinc-950 p-4 text-sm">
              <code className="text-zinc-100">{configJson}</code>
            </pre>
          </div>

          {/* Instructions */}
          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Setup Instructions:</p>
            <ol className="list-inside list-decimal space-y-1 pl-1">
              <li>Clone the Open Sunsama repository to your machine</li>
              <li>Run <code className="rounded bg-muted px-1">cd mcp && bun install && bun run build</code></li>
              <li>Update the path in the config above to point to your local clone</li>
              <li>Copy the configuration to your MCP client's config file</li>
              <li>Restart your AI assistant to load the MCP server</li>
            </ol>
          </div>

          {/* Note about API URL */}
          {apiUrl !== "https://api.opensunsama.com" && (
            <div className="rounded-md border border-blue-500/20 bg-blue-500/10 px-3 py-2">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                <strong>Note:</strong> Your configuration includes a custom API URL ({apiUrl}) since you're not using the default cloud API.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
