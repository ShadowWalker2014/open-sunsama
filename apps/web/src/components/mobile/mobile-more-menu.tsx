import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  Sunrise,
  Sparkles,
  Moon,
  Archive,
  Inbox,
  Target,
  MessageSquare,
  FileText,
  CheckSquare,
  Trello,
  Mic,
  MessageCircle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks";

interface MenuItem {
  id: string;
  icon: React.ElementType;
  label: string;
  href?: string;
  onClick?: () => void;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: "Rituals",
    items: [
      {
        id: "daily-planning",
        icon: Sunrise,
        label: "Daily planning",
        onClick: () => toast({ title: "Coming soon", description: "Daily planning will be available soon." }),
      },
      {
        id: "daily-highlights",
        icon: Sparkles,
        label: "Daily highlights",
        onClick: () => toast({ title: "Coming soon", description: "Daily highlights will be available soon." }),
      },
      {
        id: "daily-shutdown",
        icon: Moon,
        label: "Daily shutdown",
        onClick: () => toast({ title: "Coming soon", description: "Daily shutdown will be available soon." }),
      },
    ],
  },
  {
    title: "Work to be done",
    items: [
      {
        id: "backlog",
        icon: Inbox,
        label: "Backlog",
        href: "/app?backlog=true",
      },
      {
        id: "archive",
        icon: Archive,
        label: "Archive",
        onClick: () => toast({ title: "Coming soon", description: "Archive will be available soon." }),
      },
      {
        id: "objectives",
        icon: Target,
        label: "Objectives",
        onClick: () => toast({ title: "Coming soon", description: "Objectives will be available soon." }),
      },
    ],
  },
  {
    title: "Integrations",
    items: [
      {
        id: "slack",
        icon: MessageSquare,
        label: "Slack",
        onClick: () => toast({ title: "Coming soon", description: "Slack integration will be available soon." }),
      },
      {
        id: "notion",
        icon: FileText,
        label: "Notion",
        onClick: () => toast({ title: "Coming soon", description: "Notion integration will be available soon." }),
      },
      {
        id: "todoist",
        icon: CheckSquare,
        label: "Todoist",
        onClick: () => toast({ title: "Coming soon", description: "Todoist integration will be available soon." }),
      },
      {
        id: "trello",
        icon: Trello,
        label: "Trello",
        onClick: () => toast({ title: "Coming soon", description: "Trello integration will be available soon." }),
      },
    ],
  },
  {
    title: "Other",
    items: [
      {
        id: "add-to-siri",
        icon: Mic,
        label: "Add to Siri",
        onClick: () => toast({ title: "Coming soon", description: "Siri shortcuts will be available soon." }),
      },
      {
        id: "support",
        icon: MessageCircle,
        label: "Send us a support message",
        onClick: () => toast({ title: "Coming soon", description: "Support chat will be available soon." }),
      },
    ],
  },
];

interface MenuItemComponentProps {
  item: MenuItem;
}

function MenuItemComponent({ item }: MenuItemComponentProps) {
  const Icon = item.icon;

  const content = (
    <>
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <span className="text-[15px]">{item.label}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
    </>
  );

  const className = cn(
    "flex w-full items-center justify-between px-4 py-3",
    "min-h-[48px]", // Touch-friendly minimum height
    "transition-colors",
    "active:bg-accent/50", // Touch feedback
    "hover:bg-accent/30"
  );

  if (item.href) {
    return (
      <Link to={item.href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={item.onClick} className={className}>
      {content}
    </button>
  );
}

interface MenuSectionComponentProps {
  section: MenuSection;
  isLast?: boolean;
}

function MenuSectionComponent({ section, isLast }: MenuSectionComponentProps) {
  return (
    <div className="mb-2">
      {/* Section header */}
      <div className="px-4 py-2">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {section.title}
        </h3>
      </div>

      {/* Section items */}
      <div className="bg-card rounded-lg mx-2 overflow-hidden">
        {section.items.map((item, index) => (
          <React.Fragment key={item.id}>
            <MenuItemComponent item={item} />
            {index < section.items.length - 1 && (
              <div className="mx-4 border-b border-border/50" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Dashed separator between sections */}
      {!isLast && (
        <div className="mx-4 mt-4 border-t border-dashed border-border/40" />
      )}
    </div>
  );
}

/**
 * Mobile More menu component
 * Displays grouped navigation items with section headers
 * Matching Sunsama mobile app design
 */
export function MobileMoreMenu() {
  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border/40">
        <h1 className="text-xl font-semibold">More</h1>
      </div>

      {/* Scrollable content */}
      <div
        className="flex-1 overflow-y-auto py-4"
        style={{ paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}
      >
        {menuSections.map((section, index) => (
          <MenuSectionComponent
            key={section.title}
            section={section}
            isLast={index === menuSections.length - 1}
          />
        ))}

        {/* Settings link at bottom */}
        <div className="mt-4 mx-2">
          <Link
            to="/app/settings"
            className={cn(
              "flex w-full items-center justify-center px-4 py-3",
              "min-h-[48px]",
              "bg-card rounded-lg",
              "text-[15px] font-medium",
              "transition-colors",
              "active:bg-accent/50",
              "hover:bg-accent/30"
            )}
          >
            Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
