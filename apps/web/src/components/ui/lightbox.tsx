import * as React from "react";
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface LightboxItem {
  url: string;
  filename: string;
  contentType: string;
}

interface LightboxProps {
  items: LightboxItem[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

/**
 * Full-screen lightbox for previewing images and videos
 */
export function Lightbox({ items, initialIndex = 0, open, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const [zoom, setZoom] = React.useState(1);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [touchStartX, setTouchStartX] = React.useState<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const goToPrevious = React.useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [items.length]);

  const goToNext = React.useCallback(() => {
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [items.length]);

  const handleZoomIn = React.useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.5, 3));
  }, []);

  const handleZoomOut = React.useCallback(() => {
    setZoom((prev) => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) {
        setOffset({ x: 0, y: 0 });
      }
      return newZoom;
    });
  }, []);

  // Reset state when opening
  React.useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    }
  }, [open, initialIndex]);

  // Handle keyboard navigation
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          goToPrevious();
          break;
        case "ArrowRight":
          goToNext();
          break;
        case "+":
        case "=":
          handleZoomIn();
          break;
        case "-":
          handleZoomOut();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, goToPrevious, goToNext, handleZoomIn, handleZoomOut]);

  // Prevent body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || items.length === 0) return null;

  const currentItem = items[currentIndex];
  if (!currentItem) return null;

  const isImage = currentItem.contentType.startsWith("image/");
  const isVideo = currentItem.contentType.startsWith("video/");

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = currentItem.url;
    link.download = currentItem.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (touch && zoom > 1) {
        setIsDragging(true);
        setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging && zoom > 1) {
      const touch = e.touches[0];
      if (touch) {
        setOffset({
          x: touch.clientX - dragStart.x,
          y: touch.clientY - dragStart.y,
        });
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Swipe navigation for mobile
  const handleSwipeStart = (e: React.TouchEvent) => {
    if (zoom === 1) {
      const touch = e.touches[0];
      if (touch) {
        setTouchStartX(touch.clientX);
      }
    }
  };

  const handleSwipeEnd = (e: React.TouchEvent) => {
    if (touchStartX !== null && zoom === 1) {
      const touch = e.changedTouches[0];
      if (touch) {
        const touchEndX = touch.clientX;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > 50) {
          if (diff > 0) {
            goToNext();
          } else {
            goToPrevious();
          }
        }
      }
    }
    setTouchStartX(null);
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-none">
            {currentItem.filename}
          </span>
          {items.length > 1 && (
            <span className="text-sm text-white/60">
              ({currentIndex + 1} / {items.length})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {isImage && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={handleZoomOut}
                disabled={zoom <= 1}
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
              <span className="text-sm text-white/60 w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={handleDownload}
          >
            <Download className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-hidden relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={(e) => {
          handleTouchStart(e);
          handleSwipeStart(e);
        }}
        onTouchMove={handleTouchMove}
        onTouchEnd={(e) => {
          handleTouchEnd();
          handleSwipeEnd(e);
        }}
      >
        {isImage && (
          <img
            src={currentItem.url}
            alt={currentItem.filename}
            className={cn(
              "max-h-full max-w-full object-contain transition-transform duration-200",
              isDragging && "cursor-grabbing",
              zoom > 1 && !isDragging && "cursor-grab"
            )}
            style={{
              transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
            }}
            draggable={false}
          />
        )}

        {isVideo && (
          <video
            src={currentItem.url}
            controls
            autoPlay
            className="max-h-full max-w-full"
          >
            Your browser does not support the video tag.
          </video>
        )}
      </div>

      {/* Navigation arrows */}
      {items.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 h-12 w-12 hidden sm:flex"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 h-12 w-12 hidden sm:flex"
            onClick={goToNext}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </>
      )}

      {/* Thumbnail strip for multiple items */}
      {items.length > 1 && (
        <div className="flex items-center justify-center gap-2 p-4 overflow-x-auto">
          {items.map((item, index) => (
            <button
              key={index}
              className={cn(
                "h-12 w-12 rounded-md overflow-hidden border-2 transition-all flex-shrink-0",
                index === currentIndex
                  ? "border-white"
                  : "border-transparent opacity-50 hover:opacity-75"
              )}
              onClick={() => {
                setCurrentIndex(index);
                setZoom(1);
                setOffset({ x: 0, y: 0 });
              }}
            >
              {item.contentType.startsWith("image/") ? (
                <img
                  src={item.url}
                  alt={item.filename}
                  className="h-full w-full object-cover"
                />
              ) : item.contentType.startsWith("video/") ? (
                <div className="h-full w-full bg-purple-500/20 flex items-center justify-center">
                  <span className="text-xs text-white">VID</span>
                </div>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
