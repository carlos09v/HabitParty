import type { DashboardWidgetsListProps } from "@/types/dashboard";
import { ActivitiesWidget } from "./ActivitiesWidget";
import { EconomyWidget } from "./EconomyWidget";
import { PartyWidget } from "./PartyWidget";
import { WeeklyCalendar } from "./WeeklyCalendar";

export function DashboardWidgetsList({
  isCompact = false,
  experienceMode = "PRODUCTIVITY",
  balance = 0,
  weeklyEarnings = 0,
  weeklySpent = 0,
  bars,
  transactions = [],
  tasks = [],
  activities = [],
  records = [],
  onSelectDay,
}: DashboardWidgetsListProps) {
  return (
    <>
      <WeeklyCalendar
        isCompact={isCompact}
        transactions={transactions}
        tasks={tasks}
        onSelectDay={onSelectDay}
      />
      <div className="h-px w-full bg-neutral-700/70 dark:bg-white/10 shrink-0" />
      <ActivitiesWidget
        activities={activities}
        records={records}
        isCompact={isCompact}
      />
      <div className="h-px w-full bg-neutral-700/70 dark:bg-white/10 shrink-0" />
      <EconomyWidget
        balance={balance}
        weeklyEarnings={weeklyEarnings}
        weeklySpent={weeklySpent}
        bars={bars}
        isCompact={isCompact}
      />
      <div className="h-px w-full bg-neutral-700/70 dark:bg-white/10 shrink-0" />
      <PartyWidget isCompact={isCompact} experienceMode={experienceMode} />
    </>
  );
}
