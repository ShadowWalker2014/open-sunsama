import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { BoardPageContent } from "@/components/app/board-page-content";

export default function TasksPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const homeTab = user?.preferences?.homeTab ?? "board";

  React.useEffect(() => {
    if (homeTab === "tasks") {
      void navigate({ to: "/app/tasks", replace: true });
      return;
    }
    if (homeTab === "calendar") {
      void navigate({ to: "/app/calendar", replace: true });
    }
  }, [homeTab, navigate]);

  if (homeTab !== "board") return null;
  return <BoardPageContent />;
}
