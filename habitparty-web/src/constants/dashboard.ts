import { CalendarCheck, CheckCircle2, Sparkles } from "lucide-react";
import type { AppLocale } from "@/i18n/config";
import { getUtilityTranslator } from "@/i18n/utilityTranslator";
import type {
  DashboardAdvancedFilters,
  EconomyBarData,
} from "@/types/dashboard";

/** Retorna as barras padrão localizadas para o gráfico de Economia do Dashboard. */
export function getDefaultEconomyBars(
  locale: AppLocale = "pt-BR",
): EconomyBarData[] {
  const t = getUtilityTranslator(locale, "dashboard.defaultEconomyBars");
  return [
    {
      label: t("minus3WeeksLabel"),
      periodLabel: t("minus3WeeksPeriod"),
      gold: 0,
      spent: 0,
      heightPercent: 10,
      spentHeightPercent: 10,
      isHighlight: false,
    },
    {
      label: t("minus2WeeksLabel"),
      periodLabel: t("minus2WeeksPeriod"),
      gold: 0,
      spent: 0,
      heightPercent: 10,
      spentHeightPercent: 10,
      isHighlight: false,
    },
    {
      label: t("lastWeekLabel"),
      periodLabel: t("lastWeekPeriod"),
      gold: 0,
      spent: 0,
      heightPercent: 10,
      spentHeightPercent: 10,
      isHighlight: false,
    },
    {
      label: t("currentWeekLabel"),
      periodLabel: t("currentWeekPeriod"),
      gold: 0,
      spent: 0,
      heightPercent: 10,
      spentHeightPercent: 10,
      isHighlight: true,
    },
  ];
}

export const DEFAULT_DASHBOARD_ADVANCED_FILTERS: DashboardAdvancedFilters = {
  workspaceId: "all",
  taskType: "all",
  columnId: "all",
  difficulty: "all",
  hideCompleted: false,
  sortBy: "default",
};

export type DashboardStandardFilterId =
  | "today"
  | "next7days"
  | "this_month"
  | "nodate"
  | "overdue";

export const DASHBOARD_TASK_FILTERS: readonly {
  id: DashboardStandardFilterId;
}[] = [
  { id: "today" },
  { id: "next7days" },
  { id: "this_month" },
  { id: "nodate" },
  { id: "overdue" },
] as const;

export function isDashboardStandardFilterId(
  value: string,
): value is DashboardStandardFilterId {
  return (
    value === "today" ||
    value === "next7days" ||
    value === "this_month" ||
    value === "nodate" ||
    value === "overdue"
  );
}

export const DASHBOARD_EMPTY_MESSAGES: Record<
  DashboardStandardFilterId,
  { icon: typeof CalendarCheck }
> = {
  today: { icon: CalendarCheck },
  next7days: { icon: Sparkles },
  this_month: { icon: Sparkles },
  overdue: { icon: CheckCircle2 },
  nodate: { icon: CalendarCheck },
};

export type ActivityPeriodOption = "today" | "this_week" | "this_month";

export const ACTIVITY_PERIOD_OPTIONS: readonly {
  id: ActivityPeriodOption;
}[] = [{ id: "today" }, { id: "this_week" }, { id: "this_month" }] as const;

/** Quantidade padrão de tarefas exibidas por página na tabela do Dashboard */
export const DASHBOARD_ITEMS_PER_PAGE = 5;
