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
  Zap,
  Bell,
  RefreshCw,
  Sparkles,
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
    description: "M1, M2, M3, M4 chips",
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

  if (platform.includes("win") || userAgent.includes("windows")) {
    return "windows";
  }

  if (platform.includes("mac") || userAgent.includes("macintosh")) {
    const isARM =
      userAgent.includes("arm") ||
      (navigator as { userAgentData?: { architecture?: string } }).userAgentData
        ?.architecture === "arm";
    return isARM ? "macos-arm64" : "macos-arm64";
  }

  if (platform.includes("linux") || userAgent.includes("linux")) {
    return "linux";
  }

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
 * Platform download card component with Linear-style hover effects
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
      <Card className="relative p-5">
        <div className="flex items-start gap-4">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "group relative p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
        isDetected && "ring-2 ring-primary/20 border-primary/30 shadow-sm shadow-primary/5"
      )}
    >
      {isDetected && (
        <div className="absolute -top-2.5 left-4">
          <Badge
            variant="secondary"
            className="bg-primary/10 text-primary border-primary/20 text-[10px] font-medium"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Detected
          </Badge>
        </div>
      )}
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-muted/80 group-hover:bg-muted transition-colors">
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
          <Button size="sm" variant="outline" className="transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary" asChild>
            <a href={release.downloadUrl} download>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download
            </a>
          </Button>
        ) : (
          <Button size="sm" variant="outline" disabled className="opacity-50">
            Coming soon
          </Button>
        )}
      </div>
    </Card>
  );
}

/**
 * Main hero download button with Linear-style design
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
        <Skeleton className="h-14 w-72 rounded-xl" />
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }

  if (!release) {
    return (
      <div className="flex flex-col items-center gap-3">
        <Button size="lg" disabled className="h-14 px-10 text-base rounded-xl">
          <Icon className="h-5 w-5 mr-2.5" />
          Coming soon for {platform.shortName}
        </Button>
        <p className="text-sm text-muted-foreground">
          Desktop app is in development
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Button 
        size="lg" 
        asChild 
        className="h-14 px-10 text-base font-medium rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <a href={release.downloadUrl} download>
          <Icon className="h-5 w-5 mr-2.5" />
          Download for {platform.shortName}
          <Download className="h-4 w-4 ml-2.5 opacity-60" />
        </a>
      </Button>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">v{release.version}</span>
        <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
        <span>{formatFileSize(release.fileSize)}</span>
        <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
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
    <div className="flex items-start gap-3.5">
      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 mt-0.5 flex-shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <h4 className="text-sm font-medium">{title}</h4>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
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

  React.useEffect(() => {
    setDetectedPlatform(detectPlatform());
  }, []);

  React.useEffect(() => {
    async function fetchReleases() {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/releases/latest`);

      if (!response.ok) {
        setError("Unable to load release information");
        setIsLoading(false);
        return;
      }

      const data: ReleasesResponse = await response.json();

      if (data.success) {
        setReleases(data.data);
      }
      setIsLoading(false);
    }

    void fetchReleases();
  }, []);

  const detectedPlatformInfo = PLATFORMS[detectedPlatform];
  const detectedRelease = releases[detectedPlatform];

  const otherPlatforms = Object.values(PLATFORMS).filter(
    (p) => p.key !== detectedPlatform
  );

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-mesh pointer-events-none opacity-50" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between px-4 mx-auto max-w-5xl">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold tracking-tight">Open Sunsama</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button size="sm" className="shadow-sm" asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative container px-4 mx-auto max-w-5xl">
        <div className="flex flex-col items-center justify-center text-center py-20 md:py-28">
          {/* App Icon */}
          <div className="animate-fade-up flex items-center justify-center h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 mb-8 shadow-xl shadow-primary/10">
            <Calendar className="h-12 w-12 text-primary" />
          </div>

          <h1 className="animate-fade-up-delay-1 text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Download Open Sunsama
          </h1>
          <p className="animate-fade-up-delay-2 text-lg text-muted-foreground max-w-md mb-10 leading-relaxed">
            The desktop app for focused daily planning. Native performance,
            offline support, and seamless system integration.
          </p>

          {/* Primary Download Button */}
          <div className="animate-fade-up-delay-3">
            <HeroDownloadButton
              platform={detectedPlatformInfo}
              release={detectedRelease}
              isLoading={isLoading}
            />
          </div>

          {/* Requirements note */}
          <p className="text-xs text-muted-foreground/60 mt-8">
            {detectedPlatformInfo.description} · Free and open source
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative container px-4 mx-auto max-w-5xl pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 rounded-2xl bg-card/50 backdrop-blur-sm border shadow-sm">
          <FeatureHighlight
            icon={Zap}
            title="Native Performance"
            description="Built with Tauri for lightning-fast, lightweight experience"
          />
          <FeatureHighlight
            icon={Bell}
            title="System Integration"
            description="Global hotkeys, menu bar, and native notifications"
          />
          <FeatureHighlight
            icon={RefreshCw}
            title="Auto Updates"
            description="Always stay current with seamless background updates"
          />
        </div>
      </section>

      {/* Other Platforms Section */}
      <section className="relative container px-4 mx-auto max-w-5xl py-16 border-t">
        <div className="mb-8">
          <h2 className="text-xl font-semibold tracking-tight">Other Platforms</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Download Open Sunsama for your operating system
          </p>
        </div>

        {error && (
          <div className="text-sm text-destructive mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
            {error}
          </div>
        )}

        <div className="grid gap-4">
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
      <section className="relative container px-4 mx-auto max-w-5xl py-16 border-t">
        <Card className="p-8 bg-card/50 backdrop-blur-sm border shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="text-lg font-semibold">Prefer the web?</h3>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-md">
                Open Sunsama is also available as a progressive web app. 
                Access your tasks from any browser, no installation required.
              </p>
            </div>
            <Button variant="outline" size="lg" className="flex-shrink-0" asChild>
              <Link to="/app">
                Open Web App
                <ExternalLink className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </Card>
      </section>

      {/* Release Notes Section */}
      <section className="relative container px-4 mx-auto max-w-5xl py-16 border-t">
        <div className="text-center">
          <h2 className="text-xl font-semibold tracking-tight mb-3">Release Notes</h2>
          <p className="text-sm text-muted-foreground mb-6">
            See what's new in the latest version
          </p>
          <Button variant="outline" asChild>
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
      <footer className="relative border-t bg-card/30 backdrop-blur-sm">
        <div className="container px-4 mx-auto max-w-5xl py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold tracking-tight">Open Sunsama</span>
                <span className="text-xs text-muted-foreground">Free and open source</span>
              </div>
            </div>
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
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
        </div>
      </footer>
    </div>
  );
}
