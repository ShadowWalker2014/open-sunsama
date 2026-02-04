import * as React from "react";
import { Keyboard } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  SHORTCUTS,
  formatShortcut,
  type ShortcutDefinition,
} from "@/hooks/useKeyboardShortcuts";
import { cn } from "@/lib/utils";

interface ShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Group shortcuts by category
const groupedShortcuts = Object.entries(SHORTCUTS).reduce<
  Record<string, ShortcutDefinition[]>
>((acc, [_key, shortcut]) => {
  const category = shortcut.category;
  if (!acc[category]) {
    acc[category] = [];
  }
  acc[category]!.push(shortcut);
  return acc;
}, {});

const categoryLabels: Record<string, string> = {
  general: "General",
  navigation: "Navigation",
  task: "Task Actions",
  focus: "Focus Mode",
};

const categoryOrder = ["general", "navigation", "task", "focus"];

export function ShortcutsModal({ open, onOpenChange }: ShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Keyboard className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Keyboard Shortcuts</h2>
        </div>

        {/* Shortcuts List */}
        <div className="px-4 py-3 max-h-[60vh] overflow-y-auto">
          {categoryOrder.map((category) => {
            const shortcuts = groupedShortcuts[category];
            if (!shortcuts?.length) return null;

            return (
              <div key={category} className="mb-4 last:mb-0">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  {categoryLabels[category]}
                </h3>
                <div className="space-y-1">
                  {shortcuts.map((shortcut, idx) => (
                    <ShortcutRow key={idx} shortcut={shortcut} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            Press <Kbd>?</Kbd> to toggle this menu
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ShortcutRow({ shortcut }: { shortcut: ShortcutDefinition }) {
  const formatted = formatShortcut(shortcut);
  const keys = formatted.split(" ");

  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-foreground">{shortcut.description}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, idx) => (
          <Kbd key={idx}>{key}</Kbd>
        ))}
      </div>
    </div>
  );
}

// Keyboard key badge component
function Kbd({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-border bg-muted px-1.5",
        "text-[11px] font-medium text-muted-foreground",
        className
      )}
    >
      {children}
    </kbd>
  );
}

// Export Kbd for use elsewhere
export { Kbd };
