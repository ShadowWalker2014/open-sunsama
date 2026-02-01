import * as React from "react";
import { Download, Monitor, Apple, Cpu, ExternalLink, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type PlatformKey = "windows" | "macos-arm64" | "macos-x64" | "linux";

interface PlatformInfo {
  key: PlatformKey;
  name: string;
  icon: typeof Monitor;
  description: string;
}

const PLATFORMS: PlatformInfo[] = [
  { key: "macos-arm64", name: "macOS (Apple Silicon)", icon: Apple, description: "M1/M2/M3/M4" },
  { key: "macos-x64", name: "macOS (Intel)", icon: Apple, description: "Intel Macs" },
  { key: "windows", name: "Windows", icon: Monitor, description: "Windows 10+" },
  { key: "linux", name: "Linux", icon: Cpu, description: "AppImage" },
];

interface Release {
  version: string;
  platform: PlatformKey;
  downloadUrl: string;
  fileSize: number;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function detectPlatform(): PlatformKey {
  if (typeof window === "undefined") return "macos-arm64";
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || "";

  if (platform.includes("win") || userAgent.includes("windows")) return "windows";
  if (platform.includes("linux") || userAgent.includes("linux")) return "linux";
  if (platform.includes("mac") || userAgent.includes("macintosh")) return "macos-arm64";
  return "macos-arm64";
}

export function DesktopSettings() {
  const [releases, setReleases] = React.useState<Record<PlatformKey, Release | undefined>>({
    windows: undefined,
    "macos-arm64": undefined,
    "macos-x64": undefined,
    linux: undefined,
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [detectedPlatform, setDetectedPlatform] = React.useState<PlatformKey>("macos-arm64");

  React.useEffect(() => {
    setDetectedPlatform(detectPlatform());
  }, []);

  React.useEffect(() => {
    async function fetchReleases() {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/releases/latest`);
      if (!response.ok) {
        setIsLoading(false);
        return;
      }
      const data = await response.json();
      if (data.success) setReleases(data.data);
      setIsLoading(false);
    }
    void fetchReleases();
  }, []);

  const detectedRelease = releases[detectedPlatform];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Desktop App</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Download the native desktop app for a faster experience
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { title: "Global Hotkeys", desc: "Quick capture from anywhere" },
          { title: "System Tray", desc: "Always accessible" },
          { title: "Native Notifications", desc: "Never miss a reminder" },
          { title: "Offline Support", desc: "Work without internet" },
        ].map((feature) => (
          <div key={feature.title} className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border/40">
            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">{feature.title}</p>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recommended Download */}
      {isLoading ? (
        <Skeleton className="h-20 w-full rounded-lg" />
      ) : detectedRelease ? (
        <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Recommended for your system</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {PLATFORMS.find(p => p.key === detectedPlatform)?.name} • v{detectedRelease.version} • {formatFileSize(detectedRelease.fileSize)}
              </p>
            </div>
            <Button asChild>
              <a href={detectedRelease.downloadUrl} download>
                <Download className="h-4 w-4" />
                Download
              </a>
            </Button>
          </div>
        </div>
      ) : null}

      {/* All Platforms */}
      <div className="space-y-3">
        <p className="text-sm font-medium">All Platforms</p>
        <div className="space-y-2">
          {PLATFORMS.map((platform) => {
            const Icon = platform.icon;
            const release = releases[platform.key];
            const isDetected = platform.key === detectedPlatform;

            return (
              <div
                key={platform.key}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-colors",
                  isDetected ? "border-primary/30 bg-primary/5" : "border-border/40"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    isDetected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{platform.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {platform.description}
                      {release && ` • ${formatFileSize(release.fileSize)}`}
                    </p>
                  </div>
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : release ? (
                  <Button variant={isDetected ? "default" : "outline"} size="sm" asChild>
                    <a href={release.downloadUrl} download>
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Coming soon
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* View all releases link */}
      <div className="pt-2">
        <a 
          href="/download" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          View all releases & changelog
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

export default DesktopSettings;
