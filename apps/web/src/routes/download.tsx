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
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BorderBeam } from "@/components/landing/border-beam";
import { ShimmerButton } from "@/components/landing/shimmer-button";
import { useInView } from "react-intersection-observer";
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
    return isARM ? "macos-arm64" : "macos-x64";
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
      <Card className="relative p-6 bg-card/30 backdrop-blur-md border rounded-[24px]">
        <div className="flex items-start gap-5">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <div className="flex-1 space-y-3 mt-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </Card>
    );
  }

  return (
    <Card
      ref={ref}
      className={cn(
        "group relative p-6 bg-card/30 backdrop-blur-md transition-all duration-500 hover:bg-card/50 hover:shadow-xl hover:shadow-primary/5 rounded-[24px]",
        inView ? "animate-fade-up" : "opacity-0",
        isDetected && "border-primary/30 shadow-sm shadow-primary/5"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {isDetected && (
        <div className="absolute -top-3 left-6">
          <Badge
            variant="secondary"
            className="bg-primary/10 text-primary border-primary/20 text-[10px] font-jetbrains uppercase tracking-widest py-1 px-3"
          >
            <Sparkles className="h-3 w-3 mr-1.5" />
            Detected
          </Badge>
        </div>
      )}
      <div className="flex items-center gap-5">
        <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
          <Icon className="h-7 w-7 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold font-display text-lg tracking-tight">{platform.name}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {platform.description}
          </p>
          {release && (
            <p className="text-xs font-jetbrains text-muted-foreground/60 mt-1.5 flex items-center gap-2">
              <span>{formatFileSize(release.fileSize)}</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>{platform.fileType}</span>
            </p>
          )}
        </div>
        {release ? (
          <Button size="lg" variant="outline" className="rounded-xl font-bold border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all px-6" asChild>
            <a href={release.downloadUrl} download>
              <Download className="h-4 w-4 mr-2" />
              Download
            </a>
          </Button>
        ) : (
          <Button size="lg" variant="outline" disabled className="rounded-xl opacity-50 font-bold border-2 px-6">
            Coming soon
          </Button>
        )}
      </div>
      <BorderBeam size={200} duration={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
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
      <div className="flex flex-col items-center gap-4 mt-8">
        <Skeleton className="h-16 w-80 rounded-full" />
        <Skeleton className="h-5 w-56" />
      </div>
    );
  }

  if (!release) {
    return (
      <div className="flex flex-col items-center gap-4 mt-8">
        <Button size="lg" disabled className="h-16 px-12 text-lg font-bold rounded-full border-2 opacity-50">
          <Icon className="h-6 w-6 mr-3" />
          Coming soon for {platform.shortName}
        </Button>
        <p className="text-sm font-medium text-muted-foreground">
          Native desktop app is currently in development.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 mt-8 animate-fade-up animate-delay-300">
      <ShimmerButton 
        className="h-16 px-12 text-xl font-bold"
        onClick={() => window.location.href = release.downloadUrl}
      >
        <Icon className="h-6 w-6 mr-3" />
        Download for {platform.shortName}
        <ArrowRight className="h-5 w-5 ml-3 opacity-60 group-hover:translate-x-1 transition-transform" />
      </ShimmerButton>
      <div className="flex items-center gap-4 text-sm font-jetbrains text-muted-foreground uppercase tracking-widest">
        <span className="font-bold text-primary">v{release.version}</span>
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/20" />
        <span>{formatFileSize(release.fileSize)}</span>
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/20" />
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
  delay = 0,
}: {
  icon: any;
  title: string;
  description: string;
  delay?: number;
}) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  
  return (
    <div 
      ref={ref}
      className={cn(
        "flex flex-col items-start gap-4 p-6 rounded-3xl bg-card/20 border transition-all duration-500",
        inView ? "animate-fade-up" : "opacity-0"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h4 className="text-lg font-bold font-display tracking-tight mb-2">{title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
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
      try {
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
      } catch (e) {
        setError("Unable to connect to release server");
      } finally {
        setIsLoading(false);
      }
    }

    void fetchReleases();
  }, []);

  const detectedPlatformInfo = PLATFORMS[detectedPlatform];
  const detectedRelease = releases[detectedPlatform];

  const otherPlatforms = Object.values(PLATFORMS).filter(
    (p) => p.key !== detectedPlatform
  );

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/30 selection:text-primary-foreground font-sans">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full animate-pulse-subtle" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-secondary/5 blur-[100px] rounded-full animate-pulse-subtle" />
        <div className="absolute inset-0 bg-grid opacity-[0.03] dark:opacity-[0.05]" />
        <div className="absolute inset-0 bg-noise opacity-[0.02] dark:opacity-[0.03]" />
      </div>
      
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/60 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between px-6 mx-auto max-w-7xl">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-all duration-300 group-hover:rotate-6">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold tracking-tight text-xl font-display">Open Sunsama</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="font-medium">
              <Link to="/login">Sign in</Link>
            </Button>
            <ShimmerButton 
              className="px-5 py-2 text-sm font-semibold"
              onClick={() => window.location.href = '/register'}
            >
              Get Started
            </ShimmerButton>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 overflow-hidden">
          <div className="container px-6 mx-auto max-w-4xl text-center">
            {/* App Icon */}
            <div className="animate-fade-up mx-auto flex items-center justify-center h-28 w-28 rounded-[36px] bg-card p-1 border shadow-2xl mb-12">
               <div className="h-full w-full rounded-[30px] bg-gradient-to-br from-primary via-primary/80 to-primary/40 flex items-center justify-center shadow-inner">
                 <Calendar className="h-14 w-14 text-white" />
               </div>
            </div>

            <h1 className="animate-fade-up animate-delay-100 text-balance text-5xl md:text-7xl font-extrabold tracking-tight font-display mb-8 leading-[0.95]">
              Open Sunsama for Desktop
            </h1>
            <p className="animate-fade-up animate-delay-200 text-balance text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
              Experience the best of Open Sunsama with native performance, 
              global hotkeys, and seamless system integration.
            </p>

            {/* Primary Download Button */}
            <HeroDownloadButton
              platform={detectedPlatformInfo}
              release={detectedRelease}
              isLoading={isLoading}
            />

            {/* Requirements note */}
            <p className="animate-fade-up animate-delay-500 text-xs font-jetbrains text-muted-foreground/60 uppercase tracking-widest mt-12">
              Requires {detectedPlatformInfo.description} • Free & Open Source
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 border-y bg-card/20 relative">
          <div className="absolute inset-0 bg-dots opacity-[0.05]" />
          <div className="container px-6 mx-auto max-w-7xl relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureHighlight
                icon={Zap}
                title="Tauri-Powered"
                description="Built for speed and security. Our desktop app is lightweight, memory-efficient, and starts up instantly."
                delay={0}
              />
              <FeatureHighlight
                icon={Bell}
                title="Native Focus"
                description="Get native notifications and use the system tray for quick access. Stay focused with deep OS integration."
                delay={100}
              />
              <FeatureHighlight
                icon={RefreshCw}
                title="Continuous Flow"
                description="Auto-updates keep you on the latest version without interruption. Your tasks stay synced across all devices."
                delay={200}
              />
            </div>
          </div>
        </section>

        {/* Other Platforms Section */}
        <section className="py-24">
          <div className="container px-6 mx-auto max-w-4xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold font-display tracking-tight mb-4">All Platforms</h2>
              <p className="text-muted-foreground">
                Download the latest stable release for your operating system.
              </p>
            </div>

            {error && (
              <div className="text-sm text-destructive mb-10 p-5 rounded-2xl bg-destructive/10 border border-destructive/20 font-medium">
                {error}
              </div>
            )}

            <div className="grid gap-6">
              {otherPlatforms.map((platform, i) => (
                <PlatformCard
                  key={platform.key}
                  platform={platform}
                  release={releases[platform.key]}
                  isDetected={false}
                  isLoading={isLoading}
                  delay={i * 100}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Web App Section */}
        <section className="py-24">
          <div className="container px-6 mx-auto max-w-4xl">
            <div className="glass p-10 md:p-16 rounded-[40px] border shadow-xl flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left relative overflow-hidden group">
              <div className="absolute inset-0 bg-noise opacity-[0.02]" />
              <div className="relative z-10 flex-1">
                <h3 className="text-3xl font-bold font-display tracking-tight mb-4">Prefer the browser?</h3>
                <p className="text-lg text-muted-foreground max-w-md">
                  Access Open Sunsama from any device with our full-featured web app. 
                  No installation required.
                </p>
              </div>
              <div className="relative z-10">
                <Button variant="outline" size="lg" className="h-16 px-10 text-lg font-bold rounded-full border-2 hover:bg-accent/50 transition-all shadow-xl" asChild>
                  <Link to="/app">
                    Open Web App
                    <ExternalLink className="h-5 w-5 ml-2.5" />
                  </Link>
                </Button>
              </div>
              <BorderBeam size={400} duration={15} />
            </div>
          </div>
        </section>

        {/* Release Info */}
        <section className="py-24 border-t">
          <div className="container px-6 mx-auto max-w-4xl text-center">
             <h2 className="text-2xl font-bold font-display tracking-tight mb-4">Open Source Integrity</h2>
             <p className="text-muted-foreground mb-10 max-w-lg mx-auto">
               We believe in transparency. Check our source code, 
               verify our releases, and contribute on GitHub.
             </p>
             <div className="flex justify-center gap-6">
               <Button variant="outline" className="rounded-xl px-8 h-12 font-bold" asChild>
                 <a href="https://github.com/ShadowWalker2014/open-sunsama/releases" target="_blank" rel="noopener noreferrer">
                   <Github className="h-5 w-5 mr-2" />
                   Release Notes
                 </a>
               </Button>
               <Button variant="outline" className="rounded-xl px-8 h-12 font-bold" asChild>
                 <a href="https://github.com/ShadowWalker2014/open-sunsama" target="_blank" rel="noopener noreferrer">
                   <Monitor className="h-5 w-5 mr-2" />
                   Source Code
                 </a>
               </Button>
             </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background pt-24 pb-12 relative z-10">
        <div className="container px-6 mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 mb-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-all">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <span className="font-bold tracking-tight text-xl font-display">Open Sunsama</span>
            </Link>
            <nav className="flex items-center gap-10 text-sm font-medium text-muted-foreground">
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
              <a href="https://github.com/ShadowWalker2014/open-sunsama" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">GitHub</a>
            </nav>
          </div>
          <div className="pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© 2026 Open Sunsama. Non-commercial license. Built for people who value their time.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
