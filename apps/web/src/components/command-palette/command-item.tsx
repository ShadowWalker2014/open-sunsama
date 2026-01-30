import * as React from "react";
import {
  LayoutDashboard,
  Calendar,
  Settings,
  Key,
  Plus,
  Keyboard,
  Sun,
  Moon,
  Monitor,
  // Task command icons
  CheckCircle2,
  CalendarClock,
  CalendarPlus,
  Inbox,
  Copy,
  Trash2,
  // MCP command icons
  Terminal,
  Bot,
  Code,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/shortcuts-modal";
import type { Command } from "./commands";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Calendar,
  Settings,
  Key,
  Plus,
  Keyboard,
  Sun,
  Moon,
  Monitor,
  // Task command icons
  CheckCircle2,
  CalendarClock,
  CalendarPlus,
  Inbox,
  Copy,
  Trash2,
  // MCP command icons
  Terminal,
  Bot,
  Code,
  Waves,
};

interface CommandItemProps {
  command: Command;
  isSelected: boolean;
  onClick: () => void;
}

export function CommandItem({ command, isSelected, onClick }: CommandItemProps) {
  const Icon = ICON_MAP[command.icon] || Settings;

  return (
    <button
      data-selected={isSelected}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 h-[40px] w-full text-left transition-colors cursor-pointer",
        isSelected ? "bg-accent" : "hover:bg-accent/50"
      )}
    >
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-[13px] flex-1 truncate">{command.title}</span>
      {command.shortcut && <Kbd className="text-[10px]">{command.shortcut}</Kbd>}
    </button>
  );
}
