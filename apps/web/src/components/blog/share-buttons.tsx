import { Twitter, Linkedin, Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ShareButtonsProps {
  title: string;
  url: string;
  description?: string;
  className?: string;
}

const BASE_URL = "https://opensunsama.com";

/**
 * Social share buttons for blog posts
 * Includes Twitter/X, LinkedIn, and copy link functionality
 */
export function ShareButtons({
  title,
  url,
  description,
  className,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;

  const handleTwitterShare = useCallback(() => {
    const text = encodeURIComponent(
      description ? `${title} - ${description}` : title
    );
    const shareUrl = encodeURIComponent(fullUrl);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`,
      "_blank",
      "noopener,noreferrer,width=550,height=420"
    );
  }, [title, description, fullUrl]);

  const handleLinkedInShare = useCallback(() => {
    const shareUrl = encodeURIComponent(fullUrl);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
      "_blank",
      "noopener,noreferrer,width=550,height=420"
    );
  }, [fullUrl]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast({
        title: "Link copied",
        description: "The link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = fullUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      toast({
        title: "Link copied",
        description: "The link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  }, [fullUrl]);

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className="text-[11px] text-muted-foreground mr-1">Share:</span>

      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={handleTwitterShare}
        title="Share on Twitter/X"
        aria-label="Share on Twitter/X"
      >
        <Twitter className="h-3.5 w-3.5" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={handleLinkedInShare}
        title="Share on LinkedIn"
        aria-label="Share on LinkedIn"
      >
        <Linkedin className="h-3.5 w-3.5" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className={cn("h-7 w-7 p-0", copied && "text-green-600")}
        onClick={handleCopyLink}
        title="Copy link"
        aria-label="Copy link"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Link2 className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
}
