"use client";

import {
  ActivitiesWidget,
  EconomyWidget,
  PartyWidget,
  WeeklyCalendar,
} from "@/components/dashboard/sidebar-right";
import { useCompactMode } from "@/hooks/useCompactMode";
import { cn } from "@/utils";

export function DashboardSidebarRight() {
  const { isCompact } = useCompactMode();

  return (
    <aside
      className={cn(
        "shrink-0 bg-primary-dark/20 border-l border-primary/30 backdrop-blur-md h-screen flex flex-col overflow-hidden transition-all duration-200",
        isCompact ? "w-[300px] px-4 py-4 gap-3" : "w-[345px] px-5 py-5 gap-4",
      )}
    >
      <WeeklyCalendar />
      <div className="h-px w-full bg-white/8" />
      <ActivitiesWidget />
      <div className="h-px w-full bg-white/8" />
      <EconomyWidget balance={26} />
      <div className="h-px w-full bg-white/8" />
      <PartyWidget />
    </aside>
  );
}
