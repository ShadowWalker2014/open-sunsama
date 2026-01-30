import * as React from "react";
import type { Task } from "@open-sunsama/types";

export interface KanbanNavigationContextValue {
  navigatePrevious: () => void;
  navigateNext: () => void;
  navigateToToday: () => void;
  selectTask: (task: Task) => void;
}

const KanbanNavigationContext = React.createContext<KanbanNavigationContextValue | null>(null);

export function KanbanNavigationProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: KanbanNavigationContextValue;
}) {
  return (
    <KanbanNavigationContext.Provider value={value}>
      {children}
    </KanbanNavigationContext.Provider>
  );
}

export function useKanbanNavigation() {
  const context = React.useContext(KanbanNavigationContext);
  if (!context) {
    throw new Error("useKanbanNavigation must be used within KanbanNavigationProvider");
  }
  return context;
}

// Optional hook that returns null if not in provider (for safe usage)
export function useKanbanNavigationOptional() {
  return React.useContext(KanbanNavigationContext);
}
