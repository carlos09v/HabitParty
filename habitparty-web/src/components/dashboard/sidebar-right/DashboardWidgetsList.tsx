import type { DashboardWidgetsListProps } from "@/types/dashboard";
import { ActivitiesWidget } from "./ActivitiesWidget";
import { EconomyWidget } from "./EconomyWidget";
import { PartyWidget } from "./PartyWidget";
import { WeeklyCalendar } from "./WeeklyCalendar";

export function DashboardWidgetsList({
  experienceMode = "PRODUCTIVITY",
  isPremium = false,
  timeZone,
  balance = 0,
  weeklyEarnings = 0,
  weeklySpent = 0,
  bars,
  rewardsBridge,
  transactions = [],
  tasks = [],
  activities = [],
  records = [],
  friendsOverview,
}: DashboardWidgetsListProps) {
  return (
    <>
      <WeeklyCalendar
        transactions={transactions}
        tasks={tasks}
        records={records}
        timeZone={timeZone}
      />
      <div className="h-px w-full bg-neutral-700/70 dark:bg-white/10 shrink-0" />
      <ActivitiesWidget
        activities={activities}
        records={records}
        initialIsPremium={isPremium}
        timeZone={timeZone}
      />
      <div className="h-px w-full bg-neutral-700/70 dark:bg-white/10 shrink-0" />
      <EconomyWidget
        balance={balance}
        weeklyEarnings={weeklyEarnings}
        weeklySpent={weeklySpent}
        bars={bars}
        rewardsBridge={rewardsBridge}
        timeZone={timeZone}
      />
      <div className="h-px w-full bg-neutral-700/70 dark:bg-white/10 shrink-0" />
      <PartyWidget
        experienceMode={experienceMode}
        initialOverview={friendsOverview}
      />
    </>
  );
}
