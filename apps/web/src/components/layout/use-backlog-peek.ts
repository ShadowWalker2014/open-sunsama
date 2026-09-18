import * as React from "react";
import { useDndMonitor, type Over } from "@dnd-kit/core";

/** Hover this long before the backlog opens, so sweeping past the edge doesn't flash it. */
const OPEN_DELAY_MS = 120;
/** Grace period after the pointer leaves, so small overshoots don't close it. */
const CLOSE_DELAY_MS = 280;
/** While dragging a task, hold it over the rail this long to open the backlog. */
const DRAG_OPEN_DELAY_MS = 350;
/** While dragging out of the backlog, close almost immediately to reveal the board. */
const DRAG_CLOSE_DELAY_MS = 100;

/** Floating UI launched from inside the panel (menus, popovers, dialogs) counts as inside. */
const FLOATING_UI =
  '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [data-radix-popper-content-wrapper]';

function isOverBacklog(over: Over | null): boolean {
  return over?.id === "backlog" || over?.data.current?.columnId === "backlog";
}

/** Radix modal layers (context menus, dialogs) disable pointer events on the body while open. */
function isModalLayerOpen(): boolean {
  return document.body.style.pointerEvents === "none";
}

interface UseBacklogPeekOptions {
  panelRef: React.RefObject<HTMLElement | null>;
  /** Peeking is off while the backlog is pinned open. */
  enabled: boolean;
  /** Keeps the panel open, e.g. while one of its dialogs is showing. */
  locked: boolean;
}

/**
 * Sidebar-style "peek": the collapsed backlog opens as an overlay while the
 * pointer is over it and closes shortly after the pointer leaves. While a task
 * is being dragged, it follows the drag instead: holding a task over the rail
 * opens it, and dragging out of it closes it so the board underneath is free.
 */
export function useBacklogPeek({ panelRef, enabled, locked }: UseBacklogPeekOptions) {
  const [open, setOpen] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const [dragOverBacklog, setDragOverBacklog] = React.useState(false);

  const openRef = React.useRef(open);
  openRef.current = open;
  const lockedRef = React.useRef(locked);
  lockedRef.current = locked;
  const openTimer = React.useRef<number | null>(null);
  const closeTimer = React.useRef<number | null>(null);
  /** Set after an explicit close (Escape, collapse) until the pointer leaves the panel. */
  const suppressed = React.useRef(false);
  const pointerInside = React.useRef(false);

  const cancelOpen = React.useCallback(() => {
    if (openTimer.current !== null) window.clearTimeout(openTimer.current);
    openTimer.current = null;
  }, []);

  const cancelClose = React.useCallback(() => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);

  const scheduleOpen = React.useCallback(
    (delay: number) => {
      cancelClose();
      if (openRef.current || openTimer.current !== null) return;
      openTimer.current = window.setTimeout(() => {
        openTimer.current = null;
        setOpen(true);
      }, delay);
    },
    [cancelClose]
  );

  const scheduleClose = React.useCallback(
    (delay: number) => {
      cancelOpen();
      if (!openRef.current || closeTimer.current !== null) return;
      closeTimer.current = window.setTimeout(() => {
        closeTimer.current = null;
        setOpen(false);
      }, delay);
    },
    [cancelOpen]
  );

  /** Close now; if the pointer is on the panel, stay closed until it leaves and comes back. */
  const dismiss = React.useCallback(() => {
    cancelOpen();
    cancelClose();
    suppressed.current = pointerInside.current;
    setOpen(false);
  }, [cancelOpen, cancelClose]);

  React.useEffect(() => () => {
    cancelOpen();
    cancelClose();
  }, [cancelOpen, cancelClose]);

  // Pinning takes over; drop any peek state so unpinning starts closed.
  React.useEffect(() => {
    if (enabled) return;
    cancelOpen();
    cancelClose();
    setOpen(false);
  }, [enabled, cancelOpen, cancelClose]);

  useDndMonitor({
    onDragStart: ({ active }) => {
      setDragging(true);
      setDragOverBacklog(active.data.current?.columnId === "backlog");
    },
    onDragOver: ({ over }) => setDragOverBacklog(isOverBacklog(over)),
    onDragEnd: () => setDragging(false),
    onDragCancel: () => setDragging(false),
  });

  // During a drag, the drop target decides, not DOM hover.
  React.useEffect(() => {
    if (!enabled || !dragging) return;
    if (dragOverBacklog) scheduleOpen(DRAG_OPEN_DELAY_MS);
    else scheduleClose(DRAG_CLOSE_DELAY_MS);
  }, [enabled, dragging, dragOverBacklog, scheduleOpen, scheduleClose]);

  // While open, watch the pointer anywhere on the page. This also catches the
  // cases enter/leave events miss: a dialog closing under a still pointer, or
  // the panel shrinking away from it.
  React.useEffect(() => {
    if (!enabled || !open || dragging) return;

    const isInside = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest(FLOATING_UI)) return true;
      const rect = panelRef.current?.getBoundingClientRect();
      return (
        !!rect &&
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      );
    };

    const onMouseMove = (event: MouseEvent) => {
      if (isInside(event)) cancelClose();
      else if (!lockedRef.current && !isModalLayerOpen()) scheduleClose(CLOSE_DELAY_MS);
    };
    const onMouseOut = (event: MouseEvent) => {
      // relatedTarget is null when the pointer leaves the window.
      if (event.relatedTarget === null && !lockedRef.current && !isModalLayerOpen()) {
        scheduleClose(CLOSE_DELAY_MS);
      }
    };
    // Capture phase, so this runs before a dialog or menu handles the same
    // Escape and closes itself; that Escape is theirs, not the panel's.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (!lockedRef.current && !isModalLayerOpen()) dismiss();
    };

    document.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseout", onMouseOut);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseout", onMouseOut);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [enabled, open, dragging, panelRef, cancelClose, scheduleClose, dismiss]);

  const panelHandlers = React.useMemo(
    () => ({
      onPointerEnter: (event: React.PointerEvent) => {
        pointerInside.current = true;
        if (!enabled || dragging || suppressed.current || event.pointerType === "touch") return;
        scheduleOpen(OPEN_DELAY_MS);
      },
      onPointerLeave: () => {
        pointerInside.current = false;
        suppressed.current = false;
        if (!dragging) cancelOpen();
      },
    }),
    [enabled, dragging, scheduleOpen, cancelOpen]
  );

  return { open: enabled && open, dragging, dismiss, panelHandlers };
}
