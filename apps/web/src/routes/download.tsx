import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  Calendar,
  Download,
  Monitor,
  Apple,
  Github,
  ExternalLink,
  CheckCircle2,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    description: "Windows 10 or later",
    fileType: ".exe",
  },
  "macos-arm64": {
    key: "macos-arm64",
    name: "macOS (Apple Silicon)",
    shortName: "macOS",
    icon: Apple,
    description: "M1, M2, M3 chips",
    fileType: ".dmg",
  },
  "macos-x64": {
    key: "macos-x64",
    name: "macOS (Intel)",
    shortName: "macOS",
    icon: Apple,
    description: "Intel-based Macs",
    fileType: ".dmg",
  },
  linux: {
    key: "linux",
    name: "Linux",
    shortName: "Linux",
    icon: Cpu,
    description: "AppImage for most distros",
    fileType: ".AppImage",
  },
};

// Release data from API
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

/**
 * Detect user's operating system from navigator
 */
function detectPlatform(): PlatformKey {
  if (typeof window === "undefined") return "macos-arm64";

  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || "";

  // Check for Windows
  if (platform.includes("win") || userAgent.includes("windows")) {
    return "windows";
  }

  // Check for macOS
  if (platform.includes("mac") || userAgent.includes("macintosh")) {
    // Try to detect Apple Silicon vs Intel
    // Modern approach: check for ARM architecture hints
    const isARM =
      userAgent.includes("arm") ||
      // Check if running under Rosetta 2 (Intel translation on ARM)
      (navigator as { userAgentData?: { architecture?: string } }).userAgentData
        ?.architecture === "arm";

    // Default to Apple Silicon for newer Macs (post-2020)
    // This is a reasonable default as most new Macs are Apple Silicon
    return isARM ? "macos-arm64" : "macos-arm64";
  }

  // Check for Linux
  if (platform.includes("linux") || userAgent.includes("linux")) {
    return "linux";
  }

  // Default to macOS Apple Silicon
  return "macos-arm64";
}

/**
 * Format file size in human readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Platform download card component
 */
function PlatformCard({
  platform,
  release,
  isDetected,
  isLoading,
}: {
  platform: PlatformInfo;
  release?: Release;
  isDetected: boolean;
  isLoading: boolean;
}) {
  const Icon = platform.icon;

  if (isLoading) {
    return (
      <Card
        className={cn(
          "relative p-5 transition-all duration-200",
          isDetected && "ring-2 ring-primary/20"
        )}
      >
        <div className="flex items-start gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "relative p-5 transition-all duration-200 hover:border-border",
        isDetected && "ring-2 ring-primary/20 border-primary/30"
      )}
    >
      {isDetected && (
        <div className="absolute -top-2.5 left-4">
          <Badge
            variant="secondary"
            className="bg-primary/10 text-primary border-primary/20 text-[10px] font-medium"
          >
            Detected
          </Badge>
        </div>
      )}
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-muted/80">
          <Icon className="h-5 w-5 text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm">{platform.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {platform.description}
          </p>
          {release && (
            <p className="text-[11px] text-muted-foreground/70 mt-1.5">
              {formatFileSize(release.fileSize)} · {platform.fileType}
            </p>
          )}
        </div>
        {release ? (
          <Button size="sm" variant="outline" asChild>
            <a href={release.downloadUrl} download>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download
            </a>
          </Button>
        ) : (
          <Button size="sm" variant="outline" disabled>
            Coming soon
          </Button>
        )}
      </div>
    </Card>
  );
}

/**
 * Main hero download button
 */
function HeroDownloadButton({
  platform,
  release,
  isLoading,
}: {
  platform: PlatformInfo;
  release?: Release;
  isLoading: boolean;
}) {
  const Icon = platform.icon;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="h-12 w-64 rounded-md" />
        <Skeleton className="h-4 w-40" />
      </div>
    );
  }

  if (!release) {
    return (
      <div className="flex flex-col items-center gap-3">
        <Button size="lg" disabled className="h-12 px-8 text-sm">
          <Icon className="h-5 w-5 mr-2" />
          Coming soon for {platform.shortName}
        </Button>
        <p className="text-sm text-muted-foreground">
          Desktop app is in development
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Button size="lg" asChild className="h-12 px-8 text-sm font-medium group">
        <a href={release.downloadUrl} download>
          <Icon className="h-5 w-5 mr-2" />
          Download for {platform.shortName}
          <Download className="h-4 w-4 ml-2 opacity-60 group-hover:opacity-100 transition-opacity" />
        </a>
      </Button>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>v{release.version}</span>
        <span className="text-muted-foreground/40">·</span>
        <span>{formatFileSize(release.fileSize)}</span>
        <span className="text-muted-foreground/40">·</span>
        <span>{platform.fileType}</span>
      </div>
    </div>
  );
}

/**
 * Feature highlight component
 */
function FeatureHighlight({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof CheckCircle2;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <div>
        <h4 className="text-sm font-medium">{title}</h4>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}

/**
 * Download page component
 * Linear-style design with OS detection and platform cards
 */
export default function DownloadPage() {
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

  // Detect platform on mount
  React.useEffect(() => {
    setDetectedPlatform(detectPlatform());
  }, []);

  // Fetch releases from API
  React.useEffect(() => {
    async function fetchReleases() {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
        const response = await fetch(`${apiUrl}/releases/latest`);

        if (!response.ok) {
          throw new Error("Failed to fetch releases");
        }

        const data: ReleasesResponse = await response.json();

        if (data.success) {
          setReleases(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch releases:", err);
        setError("Unable to load release information");
      } finally {
        setIsLoading(false);
      }
    }

    void fetchReleases();
  }, []);

  const detectedPlatformInfo = PLATFORMS[detectedPlatform];
  const detectedRelease = releases[detectedPlatform];

  // Get other platforms (excluding detected)
  const otherPlatforms = Object.values(PLATFORMS).filter(
    (p) => p.key !== detectedPlatform
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4 mx-auto max-w-5xl">
          <Link to="/" className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span className="font-semibold">Open Sunsama</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container px-4 mx-auto max-w-5xl">
        <div className="flex flex-col items-center justify-center text-center py-16 md:py-24">
          {/* App Icon */}
          <div className="flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 mb-8 shadow-lg shadow-primary/5">
            <Calendar className="h-10 w-10 text-primary" />
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Download Open Sunsama
          </h1>
          <p className="text-muted-foreground max-w-md mb-10">
            The desktop app for focused daily planning. Native performance,
            offline support, and system integration.
          </p>

          {/* Primary Download Button */}
          <HeroDownloadButton
            platform={detectedPlatformInfo}
            release={detectedRelease}
            isLoading={isLoading}
          />

          {/* Requirements note */}
          <p className="text-xs text-muted-foreground/60 mt-6">
            {detectedPlatformInfo.description}
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="container px-4 mx-auto max-w-5xl pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-xl bg-muted/30 border">
          <FeatureHighlight
            icon={CheckCircle2}
            title="Native Performance"
            description="Built with Tauri for fast, lightweight experience"
          />
          <FeatureHighlight
            icon={CheckCircle2}
            title="System Integration"
            description="Global hotkeys, menu bar access, notifications"
          />
          <FeatureHighlight
            icon={CheckCircle2}
            title="Auto Updates"
            description="Always stay on the latest version automatically"
          />
        </div>
      </section>

      {/* Other Platforms Section */}
      <section className="container px-4 mx-auto max-w-5xl py-12 border-t">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Other Platforms</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Download Open Sunsama for your operating system
          </p>
        </div>

        {error && (
          <div className="text-sm text-destructive mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            {error}
          </div>
        )}

        <div className="grid gap-3">
          {otherPlatforms.map((platform) => (
            <PlatformCard
              key={platform.key}
              platform={platform}
              release={releases[platform.key]}
              isDetected={false}
              isLoading={isLoading}
            />
          ))}
        </div>
      </section>

      {/* Web App Section */}
      <section className="container px-4 mx-auto max-w-5xl py-12 border-t">
        <Card className="p-6 bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="font-medium">Prefer the web?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Open Sunsama is also available as a web app. No installation
                required.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/app">
                Open Web App
                <ExternalLink className="h-3.5 w-3.5 ml-2" />
              </Link>
            </Button>
          </div>
        </Card>
      </section>

      {/* Release Notes Section */}
      <section className="container px-4 mx-auto max-w-5xl py-12 border-t">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Release Notes</h2>
          <p className="text-sm text-muted-foreground mb-4">
            See what's new in the latest version
          </p>
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://github.com/ShadowWalker2014/open-sunsama/releases"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-4 w-4 mr-2" />
              View on GitHub
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container px-4 mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Open Sunsama</span>
            <span className="mx-2">·</span>
            <span>Free and open source</span>
          </div>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
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
              className="flex items-center gap-2 hover:text-foreground transition-colors"
            >
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
