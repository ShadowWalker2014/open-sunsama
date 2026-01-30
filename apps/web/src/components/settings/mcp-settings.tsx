import * as React from "react";
import { Check, Copy, Loader2, Terminal, RefreshCw } from "lucide-react";
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
const MCP_KEY_STORAGE_KEY = "opensunsama_mcp_key";
const ALL_SCOPES: ApiKeyScope[] = [
  "tasks:read",
  "tasks:write",
  "time-blocks:read",
  "time-blocks:write",
];

type ClientTab = "cursor" | "claude" | "vscode" | "windsurf";

const CLIENT_TABS: { id: ClientTab; label: string }[] = [
  { id: "cursor", label: "Cursor" },
  { id: "claude", label: "Claude" },
  { id: "vscode", label: "VS Code" },
  { id: "windsurf", label: "Windsurf" },
];

/**
 * Blur a string for display (show first 8 chars, blur rest)
 */
function blurKey(key: string): string {
  if (key.length <= 12) return key;
  return key.slice(0, 12) + "•".repeat(Math.min(key.length - 12, 24));
}

/**
 * Simple JSON syntax highlighter
 * Returns React elements with colored spans
 */
function highlightJson(json: string): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  let key = 0;
  
  // Regex to match JSON tokens - capture groups for different token types
  const tokenRegex = /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+\.?\d*)|(\btrue\b|\bfalse\b|\bnull\b)|([{}[\],])/g;
  
  let match;
  let lastIndex = 0;
  
  while ((match = tokenRegex.exec(json)) !== null) {
    // Add any whitespace/text before the match
    if (match.index > lastIndex) {
      elements.push(<span key={key++}>{json.slice(lastIndex, match.index)}</span>);
    }
    
    const [, str, colon, num, bool, punct] = match;
    
    if (str) {
      if (colon) {
        // Property key (string followed by colon)
        elements.push(
          <span key={key++} className="text-sky-400">{str}</span>,
          <span key={key++} className="text-zinc-400">{colon}</span>
        );
      } else {
        // String value
        elements.push(<span key={key++} className="text-amber-300">{str}</span>);
      }
    } else if (num) {
      // Number
      elements.push(<span key={key++} className="text-purple-400">{num}</span>);
    } else if (bool) {
      // Boolean or null
      elements.push(<span key={key++} className="text-orange-400">{bool}</span>);
    } else if (punct) {
      // Punctuation
      elements.push(<span key={key++} className="text-zinc-500">{punct}</span>);
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text
  if (lastIndex < json.length) {
    elements.push(<span key={key++}>{json.slice(lastIndex)}</span>);
  }
  
  return elements;
}

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

  // Load key from localStorage on mount
  React.useEffect(() => {
    const storedKey = localStorage.getItem(MCP_KEY_STORAGE_KEY);
    if (storedKey) {
      setMcpKey(storedKey);
    }
  }, []);

  // Find existing MCP key in the API keys list
  const existingMcpKey = React.useMemo(() => {
    return apiKeys?.find((key: ApiKey) => key.name === MCP_KEY_NAME);
  }, [apiKeys]);

  // Auto-create MCP key if it doesn't exist (and we don't have one stored)
  React.useEffect(() => {
    const createMcpKeyIfNeeded = async () => {
      // Don't create if still loading, already creating, or we have a key
      if (isLoadingKeys || isCreatingKey) return;
      if (mcpKey) return; // Already have key from localStorage
      if (existingMcpKey) return; // Key exists in API but not in localStorage (old key)

      setIsCreatingKey(true);
      const response = await createMutation.mutateAsync({
        name: MCP_KEY_NAME,
        scopes: ALL_SCOPES,
        expiresAt: null,
      });
      // Store in localStorage for persistence
      localStorage.setItem(MCP_KEY_STORAGE_KEY, response.key);
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
    // Store in localStorage for persistence
    localStorage.setItem(MCP_KEY_STORAGE_KEY, response.key);
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

  // The actual API key (from localStorage or newly created)
  const actualKey = mcpKey || "os_your-api-key-here";
  const hasKey = !!mcpKey;

  // Generate config JSON for each client (with actual key for copying)
  const generateConfig = (client: ClientTab, forDisplay: boolean = false): string => {
    const keyValue = forDisplay && hasKey ? blurKey(actualKey) : actualKey;
    
    // Use npx to run the published npm package (zero install)
    const baseConfig = {
      command: "npx",
      args: ["-y", "@open-sunsama/mcp"],
      env: {
        OPENSUNSAMA_API_KEY: keyValue,
        ...(apiUrl !== "https://api.opensunsama.com" && { OPENSUNSAMA_API_URL: apiUrl }),
      },
    };

    if (client === "vscode") {
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
    }

    return JSON.stringify(
      {
        mcpServers: {
          "open-sunsama": baseConfig,
        },
      },
      null,
      2
    );
  };

  const getConfigPath = (client: ClientTab): string => {
    switch (client) {
      case "cursor":
        return ".cursor/mcp.json or Cursor Settings → MCP";
      case "claude":
        return "~/Library/Application Support/Claude/claude_desktop_config.json";
      case "vscode":
        return "~/.continue/config.json";
      case "windsurf":
        return "Windsurf Settings → MCP";
    }
  };

  const configJsonDisplay = generateConfig(activeClient, true);
  const configJsonCopy = generateConfig(activeClient, false);

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
                <div className="flex items-center gap-2">
                  <code className="rounded bg-background px-2 py-1 font-mono text-xs select-all">
                    <span className={cn(hasKey && "blur-[3px] hover:blur-none transition-all")}>
                      {actualKey}
                    </span>
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleCopy(actualKey, "apiKey")}
                  >
                    {copiedField === "apiKey" ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                {hasKey && (
                  <p className="text-xs text-muted-foreground">Hover to reveal</p>
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
          <div className="relative group">
            <div className="absolute right-2 top-2 z-10">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 bg-background/80 text-xs backdrop-blur-sm"
                onClick={() => handleCopy(configJsonCopy, "config")}
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
              <code className={cn(
                "block font-mono",
                hasKey && "blur-[2px] group-hover:blur-none transition-all"
              )}>
                {highlightJson(configJsonDisplay)}
              </code>
            </pre>
            {hasKey && (
              <p className="mt-1.5 text-xs text-muted-foreground">Hover to reveal</p>
            )}
          </div>

          {/* Quick Setup */}
          <div className="text-xs text-muted-foreground">
            <p>
              <a 
                href="https://github.com/ShadowWalker2014/open-sunsama/tree/main/mcp#installation" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:underline"
              >
                View setup guide →
              </a>
            </p>
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
