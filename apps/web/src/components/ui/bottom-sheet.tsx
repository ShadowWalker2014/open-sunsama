import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { useKeyboardInset } from "@/hooks/useKeyboardInset";

interface BottomSheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Called when the user drags the sheet down past the dismiss threshold. */
  onDismiss: () => void;
}

// Pull further than this (or flick faster than DISMISS_VELOCITY) to close.
const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 0.6; // px per ms

/**
 * Phone-native bottom sheet for a Radix `Dialog` root: slides up from the
 * bottom edge, respects the safe areas and closes when its grabber is dragged
 * down. With the keyboard open, the sheet stays anchored to the screen's
 * bottom edge and pads its content up by the keyboard's height, so its
 * background runs behind the (translucent, floating on iOS 26) keyboard and
 * no gap can show between them.
 */
export const BottomSheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  BottomSheetContentProps
>(({ className, children, onDismiss, style, ...props }, ref) => {
  const { keyboard, visibleHeight } = useKeyboardInset();
  const [dragY, setDragY] = React.useState(0);
  const drag = React.useRef<{ startY: number; lastY: number; lastT: number; v: number } | null>(
    null
  );

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { startY: e.clientY, lastY: e.clientY, lastT: e.timeStamp, v: 0 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dt = Math.max(1, e.timeStamp - d.lastT);
    d.v = (e.clientY - d.lastY) / dt;
    d.lastY = e.clientY;
    d.lastT = e.timeStamp;
    const dy = e.clientY - d.startY;
    // Rubber-band when pulled up; follow the finger when pulled down.
    setDragY(dy > 0 ? dy : dy / 6);
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const dy = d.lastY - d.startY;
    if (dy > DISMISS_DISTANCE || (dy > 20 && d.v > DISMISS_VELOCITY)) {
      onDismiss();
      return;
    }
    setDragY(0);
  };

  const dragging = drag.current !== null;

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="sheet-overlay fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px]" />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "sheet-content fixed inset-x-0 z-50 flex flex-col overflow-hidden",
          "rounded-t-[22px] border-t border-border/60 bg-background outline-none",
          "shadow-[0_-12px_48px_-12px_rgba(0,0,0,0.28)]",
          className
        )}
        style={{
          bottom: 0,
          // Keyboard open: everything above the keys is ours, minus a peek of
          // the page so it still reads as a sheet.
          maxHeight: keyboard
            ? `${keyboard + visibleHeight - 12}px`
            : "calc(100dvh - env(safe-area-inset-top, 0px) - 16px)",
          paddingBottom: keyboard ? `${keyboard}px` : "env(safe-area-inset-bottom, 0px)",
          transform: dragY ? `translateY(${dragY}px)` : undefined,
          transition: dragging
            ? "none"
            : "transform 280ms cubic-bezier(0.32, 0.72, 0, 1), padding-bottom 200ms ease-out",
          ["--sheet-drag" as string]: `${Math.max(0, dragY)}px`,
          ...style,
        }}
        {...props}
      >
        {/* Grabber — a full-width strip so it's an easy target for a thumb */}
        <div
          className="flex h-6 shrink-0 touch-none cursor-grab items-center justify-center active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          aria-hidden
        >
          <div className="h-[5px] w-9 rounded-full bg-muted-foreground/25" />
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});
BottomSheetContent.displayName = "BottomSheetContent";
