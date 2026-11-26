import { getTranslations } from "next-intl/server";
import {
  DashboardRightRail,
  DashboardWidgetsList,
} from "@/components/dashboard/sidebar-right";
import type { DashboardSidebarRightProps } from "@/types/dashboard";

/**
 * Painel Lateral Direito do Dashboard com widgets de resumo e histórico.
 * React Server Component: renderiza a árvore de widgets UMA ÚNICA VEZ e delega a exibição
 * responsiva (aside fixo em xl+ ou drawer sob demanda em < xl) ao `DashboardRightRail`.
 */
export async function DashboardSidebarRight({
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
}: DashboardSidebarRightProps) {
  const t = await getTranslations("dashboard.sidebarRight");

  return (
    <DashboardRightRail balance={balance} asideAriaLabel={t("asideAriaLabel")}>
      <DashboardWidgetsList
        experienceMode={experienceMode}
        isPremium={isPremium}
        timeZone={timeZone}
        balance={balance}
        weeklyEarnings={weeklyEarnings}
        weeklySpent={weeklySpent}
        bars={bars}
        rewardsBridge={rewardsBridge}
        transactions={transactions}
        tasks={tasks}
        activities={activities}
        records={records}
        friendsOverview={friendsOverview}
      />
    </DashboardRightRail>
  );
}
