import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  Download,
  Monitor,
  Apple,
  Github,
  ExternalLink,
  Cpu,
  Zap,
  Bell,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import { useSEO, SEO_CONFIGS } from "@/hooks/useSEO";

// Platform configuration
type PlatformKey = "windows" | "macos-arm64" | "macos-x64" | "linux";

interface PlatformInfo {
  key: PlatformKey;
  name: string;
  shortName: string;
  icon: typeof Monitor;
  description: string;
  fileType: string;
}

const PLATFORMS: Record<PlatformKey, PlatformInfo> = {
  windows: {
    key: "windows",
    name: "Windows",
    shortName: "Windows",
    icon: Monitor,
    description: "Windows 10+",
    fileType: ".exe",
  },
  "macos-arm64": {
    key: "macos-arm64",
    name: "macOS (Apple Silicon)",
    shortName: "macOS",
    icon: Apple,
    description: "M1/M2/M3/M4",
    fileType: ".dmg",
  },
  "macos-x64": {
    key: "macos-x64",
    name: "macOS (Intel)",
    shortName: "macOS",
    icon: Apple,
    description: "Intel Macs",
    fileType: ".dmg",
  },
  linux: {
    key: "linux",
    name: "Linux",
    shortName: "Linux",
    icon: Cpu,
    description: "AppImage",
    fileType: ".AppImage",
  },
};

interface Release {
  id: string;
  version: string;
  platform: PlatformKey;
  downloadUrl: string;
  fileSize: number;
  fileName: string;
  sha256?: string;
  releaseNotes?: string;
  createdAt: string;
}

type ReleasesResponse = {
  success: boolean;
  data: Record<PlatformKey, Release | undefined>;
};

function detectPlatformSync(): PlatformKey {
  if (typeof window === "undefined") return "macos-arm64";
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || "";

  if (platform.includes("win") || userAgent.includes("windows"))
    return "windows";
  if (platform.includes("linux") || userAgent.includes("linux")) return "linux";
  if (platform.includes("mac") || userAgent.includes("macintosh")) {
    // Default to ARM for macOS - most Macs sold since 2020 are Apple Silicon
    // Will be refined by async detection
    return "macos-arm64";
  }
  return "macos-arm64";
}

async function detectMacArchitecture(): Promise<"macos-arm64" | "macos-x64"> {
  // Method 1: Use User-Agent Client Hints API (Chromium browsers)
  if ("userAgentData" in navigator) {
    const ua = navigator.userAgentData as {
      getHighEntropyValues?: (
        hints: string[]
      ) => Promise<{ architecture?: string }>;
    };
    if (ua.getHighEntropyValues) {
      const values = await ua.getHighEntropyValues(["architecture"]);
      if (values.architecture === "arm") return "macos-arm64";
      if (values.architecture === "x86") return "macos-x64";
    }
  }

  // Method 2: Check WebGL renderer (works in Safari and all browsers)
  const canvas = document.createElement("canvas");
  const gl =
    canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  if (gl) {
    const debugInfo = (gl as WebGLRenderingContext).getExtension(
      "WEBGL_debug_renderer_info"
    );
    if (debugInfo) {
      const renderer = (gl as WebGLRenderingContext).getParameter(
        debugInfo.UNMASKED_RENDERER_WEBGL
      );
      // Apple Silicon GPUs have "Apple" in the renderer name (e.g., "Apple M1", "Apple GPU")
      // Intel Macs show Intel GPU names (e.g., "Intel Iris Plus Graphics")
      if (typeof renderer === "string") {
        if (renderer.includes("Apple M") || renderer.includes("Apple GPU")) {
          return "macos-arm64";
        }
        if (renderer.includes("Intel")) {
          return "macos-x64";
        }
      }
    }
  }

  // Default to ARM - most Macs sold since late 2020 are Apple Silicon
  return "macos-arm64";
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Platform card - compact style
 */
function PlatformCard({
  platform,
  release,
  isDetected,
  isLoading,
  delay = 0,
}: {
  platform: PlatformInfo;
  release?: Release;
  isDetected: boolean;
  isLoading: boolean;
  delay?: number;
}) {
  const Icon = platform.icon;
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  if (isLoading) {
    return (
      <div className="p-4 rounded-xl border border-border/40 bg-card/50">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={cn(
        "group p-4 rounded-xl border bg-card/50 transition-all duration-200",
        isDetected
          ? "border-primary/30 bg-primary/5"
          : "border-border/40 hover:border-border/60",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            isDetected
              ? "bg-primary text-primary-foreground"
              : "bg-primary/10 text-primary"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-semibold">{platform.name}</h3>
            {isDetected && (
              <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                Detected
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {platform.description}
            {release && ` • ${formatFileSize(release.fileSize)}`}
          </p>
        </div>
        {release ? (
          <Button
            size="sm"
            variant={isDetected ? "default" : "outline"}
            className="h-8 px-3 text-xs"
            asChild
          >
            <a href={release.downloadUrl} download>
              <Download className="h-3.5 w-3.5" />
              Download
            </a>
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled
            className="h-8 px-3 text-xs opacity-50"
          >
            Coming soon
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Feature item - compact
 */
function FeatureItem({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h4 className="text-[13px] font-semibold">{title}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default function DownloadPage() {
  useSEO(SEO_CONFIGS.download);
  const [detectedPlatform, setDetectedPlatform] =
    React.useState<PlatformKey>("macos-arm64");
  const [releases, setReleases] = React.useState<
    Record<PlatformKey, Release | undefined>
  >({
    windows: undefined,
    "macos-arm64": undefined,
    "macos-x64": undefined,
    linux: undefined,
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const initialPlatform = detectPlatformSync();
    setDetectedPlatform(initialPlatform);

    // If macOS, refine detection with async method
    if (initialPlatform === "macos-arm64" || initialPlatform === "macos-x64") {
      detectMacArchitecture().then(setDetectedPlatform);
    }
  }, []);

  React.useEffect(() => {
    async function fetchReleases() {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      try {
        const response = await fetch(`${apiUrl}/releases/latest`);
        if (!response.ok) {
          setError("Unable to load releases");
          setIsLoading(false);
          return;
        }
        const data: ReleasesResponse = await response.json();
        if (data.success) setReleases(data.data);
      } catch {
        setError("Unable to connect to server");
      } finally {
        setIsLoading(false);
      }
    }
    void fetchReleases();
  }, []);

  const detectedPlatformInfo = PLATFORMS[detectedPlatform];
  const detectedRelease = releases[detectedPlatform];
  const allPlatforms = Object.values(PLATFORMS);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      {/* Subtle background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[400px] bg-primary/[0.03] blur-[100px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-12 items-center justify-between px-4 mx-auto max-w-5xl">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/open-sunsama-logo.png"
              alt="Open Sunsama"
              className="h-7 w-7 rounded-lg object-cover"
            />
            <span className="text-[13px] font-semibold">Open Sunsama</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs"
              asChild
            >
              <Link to="/login">Sign in</Link>
            </Button>
            <Button size="sm" className="h-8 px-3 text-xs" asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative">
        {/* Hero */}
        <section className="pt-16 pb-12 md:pt-24 md:pb-16">
          <div className="container px-4 mx-auto max-w-3xl text-center">
            {/* App icon */}
            <img
              src="/open-sunsama-logo.png"
              alt="Open Sunsama"
              className="mx-auto h-16 w-16 rounded-2xl object-cover mb-6"
            />

            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
              Open Sunsama for Desktop
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8">
              Native performance, global hotkeys, and system integration.
            </p>

            {/* Primary download */}
            {!isLoading && detectedRelease && (
              <div className="space-y-3">
                <Button size="lg" className="h-10 px-5 text-[13px]" asChild>
                  <a href={detectedRelease.downloadUrl} download>
                    <detectedPlatformInfo.icon className="h-4 w-4" />
                    Download for {detectedPlatformInfo.shortName}
                  </a>
                </Button>
                <p className="text-xs text-muted-foreground">
                  v{detectedRelease.version} •{" "}
                  {formatFileSize(detectedRelease.fileSize)} •{" "}
                  {detectedPlatformInfo.fileType}
                </p>
              </div>
            )}
            {!isLoading && !detectedRelease && (
              <p className="text-sm text-muted-foreground">
                Desktop app coming soon for {detectedPlatformInfo.shortName}
              </p>
            )}
            {isLoading && (
              <div className="space-y-3">
                <Skeleton className="h-10 w-48 mx-auto rounded-lg" />
                <Skeleton className="h-4 w-32 mx-auto" />
              </div>
            )}
          </div>
        </section>

        {/* Features */}
        <section className="py-12 border-t border-border/40 bg-muted/10">
          <div className="container px-4 mx-auto max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FeatureItem
                icon={Zap}
                title="Tauri-Powered"
                description="Lightweight, fast, secure"
              />
              <FeatureItem
                icon={Bell}
                title="Native Notifications"
                description="System tray integration"
              />
              <FeatureItem
                icon={RefreshCw}
                title="Auto Updates"
                description="Always up to date"
              />
            </div>
          </div>
        </section>

        {/* All platforms */}
        <section className="py-12 border-t border-border/40">
          <div className="container px-4 mx-auto max-w-2xl">
            <h2 className="text-lg font-semibold tracking-tight text-center mb-6">
              All Platforms
            </h2>

            {error && (
              <div className="text-xs text-destructive mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                {error}
              </div>
            )}

            <div className="space-y-3">
              {allPlatforms.map((platform, i) => (
                <PlatformCard
                  key={platform.key}
                  platform={platform}
                  release={releases[platform.key]}
                  isDetected={platform.key === detectedPlatform}
                  isLoading={isLoading}
                  delay={i * 50}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Web app */}
        <section className="py-12 border-t border-border/40">
          <div className="container px-4 mx-auto max-w-2xl">
            <div className="rounded-xl border border-border/40 bg-card/50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-[13px] font-semibold">
                  Prefer the browser?
                </h3>
                <p className="text-xs text-muted-foreground">
                  Access from any device with our web app.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
                asChild
              >
                <Link to="/app">
                  Open Web App
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Source */}
        <section className="py-12 border-t border-border/40">
          <div className="container px-4 mx-auto max-w-2xl text-center">
            <h3 className="text-[13px] font-semibold mb-2">Open Source</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Check source code and releases on GitHub.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs"
              asChild
            >
              <a
                href="https://github.com/ShadowWalker2014/open-sunsama"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-3.5 w-3.5" />
                View on GitHub
              </a>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6">
        <div className="container px-4 mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <img
                src="/open-sunsama-logo.png"
                alt="Open Sunsama"
                className="h-5 w-5 rounded object-cover"
              />
              <span className="text-[11px] text-muted-foreground">
                © 2026 Open Sunsama
              </span>
            </div>
            <nav className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <Link
                to="/privacy"
                className="hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
              <Link
                to="/terms"
                className="hover:text-foreground transition-colors"
              >
                Terms
              </Link>
              <a
                href="https://github.com/ShadowWalker2014/open-sunsama"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                <Github className="h-3.5 w-3.5" />
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
