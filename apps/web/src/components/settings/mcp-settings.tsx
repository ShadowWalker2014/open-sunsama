import * as React from "react";
import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  KeyRound,
  Link2,
  Loader2,
  PlugZap,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { useCreateApiKey } from "@/hooks/useApiKeys";
import { useMcpConnections, useDisconnectMcpConnection } from "@/hooks/useMcpConnections";
import type { ApiKeyScope } from "@open-sunsama/types";
import { AppLogo } from "./app-logo";

const API_URL = import.meta.env.VITE_API_URL || "https://api.opensunsama.com";
const MCP_URL = `${API_URL.replace(/\/$/, "")}/mcp`;
const IS_HOSTED = API_URL.replace(/\/$/, "") === "https://api.opensunsama.com";

const MCP_KEY_NAME = "MCP Integration";
const MCP_KEY_STORAGE_KEY = "opensunsama_mcp_key";
const MCP_KEY_SCOPES: ApiKeyScope[] = [
  "tasks:read",
  "tasks:write",
  "time-blocks:read",
  "time-blocks:write",
  "user:read",
  "user:write",
];

/**
 * Simple JSON syntax highlighter
 * Returns React elements with colored spans
 */
function highlightJson(json: string): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  let key = 0;
  const tokenRegex = /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+\.?\d*)|(\btrue\b|\bfalse\b|\bnull\b)|([{}[\],])/g;
  let match;
  let lastIndex = 0;

  while ((match = tokenRegex.exec(json)) !== null) {
    if (match.index > lastIndex) {
      elements.push(<span key={key++}>{json.slice(lastIndex, match.index)}</span>);
    }
    const [, str, colon, num, bool, punct] = match;
    if (str) {
      if (colon) {
        elements.push(
          <span key={key++} className="text-sky-400">{str}</span>,
          <span key={key++} className="text-zinc-400">{colon}</span>
        );
      } else {
        elements.push(<span key={key++} className="text-amber-300">{str}</span>);
      }
    } else if (num) {
      elements.push(<span key={key++} className="text-purple-400">{num}</span>);
    } else if (bool) {
      elements.push(<span key={key++} className="text-orange-400">{bool}</span>);
    } else if (punct) {
      elements.push(<span key={key++} className="text-zinc-500">{punct}</span>);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < json.length) {
    elements.push(<span key={key++}>{json.slice(lastIndex)}</span>);
  }
  return elements;
}

function useCopy() {
  const [copied, setCopied] = React.useState<string | null>(null);
  const copy = React.useCallback(async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  }, []);
  return { copied, copy };
}

function CopyButton({ text, field, copied, onCopy, label = "Copy" }: {
  text: string;
  field: string;
  copied: string | null;
  onCopy: (text: string, field: string) => void;
  label?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 gap-1.5 bg-background/80 text-xs backdrop-blur-sm"
      onClick={() => onCopy(text, field)}
    >
      {copied === field ? (
        <>
          <Check className="h-3.5 w-3.5 text-green-500" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          {label}
        </>
      )}
    </Button>
  );
}

function CodeBlock({ code, json = false, field, copied, onCopy }: {
  code: string;
  json?: boolean;
  field: string;
  copied: string | null;
  onCopy: (text: string, field: string) => void;
}) {
  return (
    <div className="relative">
      <div className="absolute right-2 top-2 z-10">
        <CopyButton text={code} field={field} copied={copied} onCopy={onCopy} />
      </div>
      <pre className="overflow-x-auto rounded-lg border bg-zinc-950 p-4 pr-24 text-[13px] text-zinc-100">
        <code className="block font-mono">{json ? highlightJson(code) : code}</code>
      </pre>
    </div>
  );
}

function Steps({ children }: { children: React.ReactNode }) {
  return <ol className="list-decimal space-y-2 pl-5 text-sm marker:text-muted-foreground">{children}</ol>;
}

function ExternalButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
      <a href={href} target="_blank" rel="noreferrer">
        {children}
        <ExternalLink className="h-3 w-3" />
      </a>
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Connector (OAuth) — the recommended way
// ---------------------------------------------------------------------------

type ClientTab = "claude" | "chatgpt" | "claude-code" | "cursor" | "vscode" | "other";

const CLIENT_TABS: { id: ClientTab; label: string }[] = [
  { id: "claude", label: "Claude" },
  { id: "chatgpt", label: "ChatGPT" },
  { id: "claude-code", label: "Claude Code" },
  { id: "cursor", label: "Cursor" },
  { id: "vscode", label: "VS Code" },
  { id: "other", label: "Other" },
];

const CURSOR_INSTALL_URL = `cursor://anysphere.cursor-deeplink/mcp/install?name=open-sunsama&config=${btoa(
  JSON.stringify({ url: MCP_URL })
)}`;
const VSCODE_INSTALL_URL = `vscode:mcp/install?${encodeURIComponent(
  JSON.stringify({ name: "open-sunsama", type: "http", url: MCP_URL })
)}`;

function ConnectorInstructions({ client, copied, onCopy }: {
  client: ClientTab;
  copied: string | null;
  onCopy: (text: string, field: string) => void;
}) {
  switch (client) {
    case "claude":
      return (
        <div className="space-y-3">
          <Steps>
            <li>
              In Claude, open <span className="font-medium">Settings → Customize → Connectors</span> and click{" "}
              <span className="font-medium">Add</span>.
            </li>
            <li>
              Name it <span className="font-medium">Open Sunsama</span>, paste the connector URL as the{" "}
              <span className="font-medium">MCP server URL</span>, and click <span className="font-medium">Continue</span>.
            </li>
            <li>
              Keep the detected sign-in settings and click <span className="font-medium">Add</span>. Then click{" "}
              <span className="font-medium">Connect</span>, sign in to Open Sunsama, and choose{" "}
              <span className="font-medium">Allow access</span>.
            </li>
          </Steps>
          <p className="text-xs text-muted-foreground">
            Works in claude.ai, Claude Desktop, and the Claude mobile apps. On Team and Enterprise plans,
            an owner adds it under Organization settings → Connectors first.
          </p>
          <ExternalButton href="https://claude.ai/new#customize/connectors">Open Claude connectors</ExternalButton>
        </div>
      );
    case "chatgpt":
      return (
        <div className="space-y-3">
          <Steps>
            <li>
              In ChatGPT, open <span className="font-medium">Settings → Security and login</span> and turn on{" "}
              <span className="font-medium">Developer mode</span>.
            </li>
            <li>
              Go to <span className="font-medium">Plugins</span>, click <span className="font-medium">+</span>, name
              it <span className="font-medium">Open Sunsama</span>, and paste the connector URL under{" "}
              <span className="font-medium">Connection</span>.
            </li>
            <li>
              Leave authentication on <span className="font-medium">OAuth</span>, check{" "}
              <span className="font-medium">I understand and want to continue</span>, click{" "}
              <span className="font-medium">Create</span>, sign in to Open Sunsama, and choose{" "}
              <span className="font-medium">Allow access</span>.
            </li>
          </Steps>
          <p className="text-xs text-muted-foreground">
            Developer mode is available on paid ChatGPT plans. Workspace admins may need to allow it.
          </p>
          <ExternalButton href="https://chatgpt.com/plugins">Open ChatGPT plugins</ExternalButton>
        </div>
      );
    case "claude-code":
      return (
        <div className="space-y-3">
          <p className="text-sm">Run this in your terminal:</p>
          <CodeBlock
            code={`claude mcp add --transport http open-sunsama ${MCP_URL}`}
            field="claude-code"
            copied={copied}
            onCopy={onCopy}
          />
          <p className="text-sm text-muted-foreground">
            Then run <code className="rounded bg-muted px-1 py-0.5 text-xs">/mcp</code> inside Claude Code,
            pick <span className="font-medium text-foreground">open-sunsama</span>, and choose Authenticate.
          </p>
        </div>
      );
    case "cursor":
      return (
        <div className="space-y-3">
          <Button asChild size="sm" className="h-8 gap-1.5 text-xs">
            <a href={CURSOR_INSTALL_URL}>
              <PlugZap className="h-3.5 w-3.5" />
              Add to Cursor
            </a>
          </Button>
          <p className="text-sm text-muted-foreground">
            Or add this to <code className="rounded bg-muted px-1 py-0.5 text-xs">~/.cursor/mcp.json</code>,
            then click <span className="font-medium text-foreground">Connect</span> next to open-sunsama in
            Cursor Settings → MCP:
          </p>
          <CodeBlock
            code={JSON.stringify({ mcpServers: { "open-sunsama": { url: MCP_URL } } }, null, 2)}
            json
            field="cursor"
            copied={copied}
            onCopy={onCopy}
          />
        </div>
      );
    case "vscode":
      return (
        <div className="space-y-3">
          <Button asChild size="sm" className="h-8 gap-1.5 text-xs">
            <a href={VSCODE_INSTALL_URL}>
              <PlugZap className="h-3.5 w-3.5" />
              Add to VS Code
            </a>
          </Button>
          <p className="text-sm text-muted-foreground">
            Or add this to <code className="rounded bg-muted px-1 py-0.5 text-xs">.vscode/mcp.json</code>.
            VS Code opens the sign-in page when the server first starts:
          </p>
          <CodeBlock
            code={JSON.stringify({ servers: { "open-sunsama": { type: "http", url: MCP_URL } } }, null, 2)}
            json
            field="vscode"
            copied={copied}
            onCopy={onCopy}
          />
        </div>
      );
    case "other":
      return (
        <div className="space-y-3 text-sm">
          <p>
            Any MCP client that supports remote servers with OAuth can connect: add the connector URL as a
            Streamable HTTP server and it will send you here to sign in.
          </p>
          <p className="text-muted-foreground">
            Windsurf: add{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              {`"open-sunsama": { "serverUrl": "${MCP_URL}" }`}
            </code>{" "}
            under <code className="rounded bg-muted px-1 py-0.5 text-xs">mcpServers</code> in{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">~/.codeium/windsurf/mcp_config.json</code>.
          </p>
          <p className="text-muted-foreground">
            Client can't do OAuth? Use an API key below instead.
          </p>
        </div>
      );
  }
}

function ConnectorCard() {
  const [client, setClient] = React.useState<ClientTab>("claude");
  const { copied, copy } = useCopy();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect AI assistants</CardTitle>
        <CardDescription>
          Add Open Sunsama to Claude, ChatGPT, Cursor, and other MCP clients. You sign in once and
          approve access. There's no API key to paste.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <Link2 className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-sm font-medium">Connector URL</p>
              <div className="flex min-w-0 items-center gap-1.5">
                <code className="min-w-0 truncate rounded bg-background px-2 py-1 font-mono text-xs select-all">
                  {MCP_URL}
                </code>
                <CopyButton text={MCP_URL} field="url" copied={copied} onCopy={copy} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-1 overflow-x-auto rounded-lg border bg-muted/30 p-1">
            {CLIENT_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setClient(tab.id)}
                className={cn(
                  "flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  client === tab.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <ConnectorInstructions client={client} copied={copied} onCopy={copy} />
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Connected apps
// ---------------------------------------------------------------------------

function formatRelative(iso: string | null): string {
  if (!iso) return "never";
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days < 30 ? `${days}d ago` : new Date(iso).toLocaleDateString();
}

function ConnectedAppsCard() {
  const { data: connections, isLoading } = useMcpConnections();
  const disconnect = useDisconnectMcpConnection();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected apps</CardTitle>
        <CardDescription>AI assistants you've allowed to access your account.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !connections?.length ? (
          <p className="py-2 text-sm text-muted-foreground">
            Nothing connected yet. Add the connector URL above to Claude or ChatGPT to get started.
          </p>
        ) : (
          <ul className="divide-y">
            {connections.map((connection) => (
              <li key={connection.clientId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <AppLogo
                  name={connection.clientName}
                  logoUri={connection.logoUri}
                  className="h-9 w-9"
                  imageClassName="h-5 w-5"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{connection.clientName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {connection.verifiedDomain ? `${connection.verifiedDomain} · ` : ""}
                    Connected {formatRelative(connection.connectedAt)} · Last used{" "}
                    {formatRelative(connection.lastUsedAt)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0 text-xs"
                  disabled={disconnect.isPending && disconnect.variables === connection.clientId}
                  onClick={() => disconnect.mutate(connection.clientId)}
                >
                  Disconnect
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// API key (traditional: local stdio server or header auth)
// ---------------------------------------------------------------------------

type KeyClientTab = "cursor" | "claude" | "vscode" | "windsurf" | "remote";

const KEY_CLIENT_TABS: { id: KeyClientTab; label: string; path: string }[] = [
  { id: "cursor", label: "Cursor", path: "~/.cursor/mcp.json or Cursor Settings → MCP" },
  { id: "claude", label: "Claude Desktop", path: "~/Library/Application Support/Claude/claude_desktop_config.json" },
  { id: "vscode", label: "VS Code", path: ".vscode/mcp.json" },
  { id: "windsurf", label: "Windsurf", path: "~/.codeium/windsurf/mcp_config.json" },
  { id: "remote", label: "Remote + header", path: "Any client that lets you set request headers" },
];

function maskKey(key: string): string {
  if (key.length <= 8) return key;
  return key.slice(0, 8) + "•".repeat(Math.min(key.length - 8, 24));
}

function apiKeyConfig(client: KeyClientTab, key: string): string {
  const stdio = {
    command: "npx",
    args: ["-y", "@open-sunsama/mcp"],
    env: {
      OPENSUNSAMA_API_KEY: key,
      ...(!IS_HOSTED && { OPENSUNSAMA_API_URL: API_URL }),
    },
  };
  if (client === "vscode") {
    return JSON.stringify({ servers: { "open-sunsama": { type: "stdio", ...stdio } } }, null, 2);
  }
  if (client === "remote") {
    return JSON.stringify(
      { mcpServers: { "open-sunsama": { url: MCP_URL, headers: { "X-API-Key": key } } } },
      null,
      2
    );
  }
  return JSON.stringify({ mcpServers: { "open-sunsama": stdio } }, null, 2);
}

function ApiKeyCard() {
  const [open, setOpen] = React.useState(false);
  const [client, setClient] = React.useState<KeyClientTab>("cursor");
  const [showKey, setShowKey] = React.useState(false);
  const [mcpKey, setMcpKey] = React.useState<string | null>(() =>
    typeof window === "undefined" ? null : localStorage.getItem(MCP_KEY_STORAGE_KEY)
  );
  const createMutation = useCreateApiKey();
  const { copied, copy } = useCopy();

  const generateKey = async () => {
    const response = await createMutation.mutateAsync({
      name: MCP_KEY_NAME,
      scopes: MCP_KEY_SCOPES,
      expiresAt: null,
    });
    localStorage.setItem(MCP_KEY_STORAGE_KEY, response.key);
    setMcpKey(response.key);
    setShowKey(true);
  };

  const activeTab = KEY_CLIENT_TABS.find((t) => t.id === client)!;

  return (
    <Card>
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 p-6 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="space-y-1.5">
          <h3 className="font-semibold leading-none tracking-tight">Use an API key instead</h3>
          <p className="text-sm text-muted-foreground">
            For the local command-line server (<code className="text-xs">npx @open-sunsama/mcp</code>) or
            clients that can't sign in with OAuth.
          </p>
        </div>
        <ChevronDown
          className={cn("mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <CardContent className="space-y-5 pt-0">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium">MCP API key</p>
                  {mcpKey ? (
                    <div className="flex min-w-0 items-center gap-1.5">
                      <code className="min-w-0 truncate rounded bg-background px-2 py-1 font-mono text-xs select-all">
                        {showKey ? mcpKey : maskKey(mcpKey)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 shrink-0 p-0"
                        onClick={() => setShowKey(!showKey)}
                        aria-label={showKey ? "Hide key" : "Show key"}
                      >
                        {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 shrink-0 p-0"
                        onClick={() => copy(mcpKey, "apiKey")}
                        aria-label="Copy key"
                      >
                        {copied === "apiKey" ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No key yet. Generate one to fill in the config below.
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={generateKey}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                )}
                {mcpKey ? "New key" : "Generate key"}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-1 overflow-x-auto rounded-lg border bg-muted/30 p-1">
              {KEY_CLIENT_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setClient(tab.id)}
                  className={cn(
                    "flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    client === tab.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Configuration file location:</p>
              <p className="text-xs text-muted-foreground/80">{activeTab.path}</p>
            </div>
            <div className="relative">
              <div className="absolute right-2 top-2 z-10">
                <CopyButton
                  text={apiKeyConfig(client, mcpKey ?? "os_your-api-key-here")}
                  field="config"
                  copied={copied}
                  onCopy={copy}
                />
              </div>
              <pre className="overflow-x-auto rounded-lg border bg-zinc-950 p-4 pr-24 text-[13px]">
                <code className="block font-mono">
                  {highlightJson(
                    apiKeyConfig(client, mcpKey ? (showKey ? mcpKey : maskKey(mcpKey)) : "os_your-api-key-here")
                  )}
                </code>
              </pre>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

/**
 * MCP settings tab: the OAuth connector (recommended), apps the user has
 * connected, and the API-key setup for local/CLI use.
 */
export function McpSettings() {
  return (
    <div className="space-y-6">
      <ConnectorCard />
      <ConnectedAppsCard />
      <ApiKeyCard />
    </div>
  );
}
