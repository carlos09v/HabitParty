import {
  Backpack,
  CheckCircle2,
  CheckSquare,
  Coins,
  Flame,
  Gift,
  Sparkles,
  Store,
  Target,
  Timer,
} from "lucide-react";
import type { AppLocale } from "@/i18n/config";
import { getUtilityTranslator } from "@/i18n/utilityTranslator";
import type { FocusActivity } from "@/types/focus";
import type {
  InventoryItem,
  InventoryItemResponseDTO,
} from "@/types/inventory";
import type { Reward, RewardDisplayEntry } from "@/types/reward";
import type { BoardColumn, Task } from "@/types/task";
import type { WelcomeCardStat } from "@/types/ui";
import { formatCoins } from "@/utils/economy";
import { formatFocusMinutes } from "@/utils/focusFormatters";
import { formatCreditsLeisureEquivalence } from "@/utils/rewardEconomy";
import { groupRewardsForShowcase, isDebtReward } from "@/utils/rewardGrouping";
import { isTaskConsideredDone } from "@/utils/taskMapper";

/**
 * Calcula as estatísticas do WelcomeCard para a tela de Recompensas (Loja).
 * Aceita entradas já agrupadas para evitar recomputar `groupRewardsForShowcase`.
 * Dívidas descartáveis não entram na contagem de cards regulares da vitrine (alinhando com o contador X/12).
 */
export function calculateRewardWelcomeStats(
  rewardsOrEntries: Reward[] | RewardDisplayEntry[],
  currentCoins: number,
  locale: AppLocale = "pt-BR",
  isGamified = false,
): {
  stats: WelcomeCardStat[];
  redeemableCount: number;
} {
  const t = getUtilityTranslator(locale, "catalog.rewards");
  const groupedEntries: RewardDisplayEntry[] =
    rewardsOrEntries.length > 0 && "variants" in rewardsOrEntries[0]
      ? (rewardsOrEntries as RewardDisplayEntry[])
      : groupRewardsForShowcase(rewardsOrEntries as Reward[]);
  let regularShowcaseCount = 0;
  let redeemableCount = 0;
  let timeBasedCount = 0;
  let singleUseCount = 0;
  let mysteryCount = 0;
  let groupedPackagesCount = 0;

  for (const entry of groupedEntries) {
    if (isDebtReward(entry.primaryReward)) {
      continue;
    }
    regularShowcaseCount++;
    if (entry.variants.some((v) => v.price <= currentCoins)) {
      redeemableCount++;
    }
    if (entry.variants.length > 1) {
      groupedPackagesCount += entry.variants.length;
    }
    const r = entry.primaryReward;
    if (r.type === "TIME_BASED" || r.type === "TimeBased") {
      timeBasedCount++;
    } else if (r.type === "SINGLE_USE" || r.type === "SingleUse") {
      singleUseCount++;
    } else if (r.type === "MISTERY_BOX" || r.type === "MysteryBox") {
      mysteryCount++;
    }
  }

  const breakdownParts: string[] = [];
  if (timeBasedCount > 0) {
    breakdownParts.push(t("voucherCount", { count: timeBasedCount }));
  }
  if (singleUseCount > 0) {
    breakdownParts.push(t("singleUseCount", { count: singleUseCount }));
  }
  if (mysteryCount > 0) {
    breakdownParts.push(
      isGamified
        ? t("boxCount", { count: mysteryCount })
        : t("breakDrawCount", { count: mysteryCount }),
    );
  }
  if (groupedPackagesCount > 0) {
    breakdownParts.push(t("packagesCount", { count: groupedPackagesCount }));
  }
  const hint =
    breakdownParts.length > 0 ? breakdownParts.join(" • ") : t("noOptions");

  const currencyLabel = isGamified ? t("coinsCurrency") : t("creditsCurrency");

  const stats: WelcomeCardStat[] = [
    {
      label: t("balanceLabel"),
      value: `${formatCoins(currentCoins, { locale })} ${currencyLabel}`,
      icon: Coins,
      variant: isGamified ? "gold" : "info",
      hint:
        !isGamified && currentCoins > 0
          ? t("earnedLeisure", {
              equivalence: formatCreditsLeisureEquivalence(currentCoins),
            })
          : t("availableToRedeem"),
    },
    {
      label: t("redeemableLabel"),
      value: t("cardsCount", { count: redeemableCount }),
      icon: Gift,
      variant: redeemableCount > 0 ? "success" : "default",
      hint:
        redeemableCount > 0
          ? t("withinReach")
          : isGamified
            ? t("earnMoreCoins")
            : t("earnMoreCredits"),
    },
    {
      label: t("showcaseLabel"),
      value: t("cardsCount", { count: regularShowcaseCount }),
      icon: Store,
      variant: "primary",
      hint,
    },
  ];

  return { stats, redeemableCount };
}

/**
 * Calcula as estatísticas do WelcomeCard para a tela de Inventário (Mochila).
 */
export function calculateInventoryWelcomeStats(
  items: InventoryItem[],
  locale: AppLocale = "pt-BR",
  isGamified = false,
): {
  stats: WelcomeCardStat[];
  totalQuantity: number;
  inFocusCount: number;
} {
  const t = getUtilityTranslator(locale, "catalog.inventory");
  let totalQuantity = 0;
  let inFocusCount = 0;
  let singleUseCount = 0;
  let couponCount = 0;
  let mysteryCount = 0;

  for (const item of items) {
    const qty = item.quantity || 1;
    totalQuantity += qty;
    if (item.status === "IN_FOCUS") {
      inFocusCount += qty;
    }
    const rewardType = item.reward?.type;
    if (rewardType === "SINGLE_USE" || rewardType === "SingleUse") {
      singleUseCount += qty;
    } else if (rewardType === "TIME_BASED" || rewardType === "TimeBased") {
      couponCount += qty;
    } else if (rewardType === "MISTERY_BOX" || rewardType === "MysteryBox") {
      mysteryCount += qty;
    }
  }

  const typeHintParts = [t("voucherCount", { count: couponCount })];
  if (mysteryCount > 0) {
    typeHintParts.push(
      isGamified
        ? t("boxCount", { count: mysteryCount })
        : t("breakDrawCount", { count: mysteryCount }),
    );
  }

  const stats: WelcomeCardStat[] = [
    {
      label: isGamified ? t("totalBackpack") : t("totalInventory"),
      value: t("itemCount", { count: totalQuantity }),
      icon: Backpack,
      variant: "primary",
      hint: t("storedTypes", { count: items.length }),
    },
    {
      label: t("activeInFocus"),
      value: t("itemCount", { count: inFocusCount }),
      icon: Flame,
      variant: inFocusCount > 0 ? "gold" : "default",
      hint: inFocusCount > 0 ? t("onFocusStage") : t("noItemsInFocus"),
    },
    {
      label: t("itemTypes"),
      value: t("singleUseCount", { count: singleUseCount }),
      icon: Sparkles,
      variant: "success",
      hint: typeHintParts.join(" • "),
    },
  ];

  return { stats, totalQuantity, inFocusCount };
}

/**
 * Calcula as estatísticas do WelcomeCard para a tela de Tarefas (Quadro Kanban).
 * Suporta diretamente a lista de colunas para agregação em passagem única sem alocar arrays intermediários.
 */
export function calculateTasksWelcomeStats(
  columnsOrTasks: BoardColumn[] | Task[],
  columnsCount?: number,
  locale: AppLocale = "pt-BR",
): {
  stats: WelcomeCardStat[];
  completedCount: number;
  habitsCount: number;
  percent: number;
} {
  const t = getUtilityTranslator(locale, "catalog.tasks");
  let totalTasks = 0;
  let completedCount = 0;
  let habitsCount = 0;
  let resolvedColumnsCount = columnsCount ?? 0;

  if (columnsOrTasks.length > 0 && "tasks" in columnsOrTasks[0]) {
    const cols = columnsOrTasks as BoardColumn[];
    resolvedColumnsCount = cols.length;
    for (const col of cols) {
      for (const tTask of col.tasks) {
        totalTasks++;
        if (isTaskConsideredDone(tTask)) completedCount++;
        if ((tTask.type || "").toLowerCase() === "habit") habitsCount++;
      }
      totalTasks += col.archivedTotalCount ?? 0;
      completedCount += col.archivedCompletedCount ?? 0;
    }
  } else {
    const tasks = columnsOrTasks as Task[];
    totalTasks = tasks.length;
    for (const tTask of tasks) {
      if (isTaskConsideredDone(tTask)) completedCount++;
      if ((tTask.type || "").toLowerCase() === "habit") habitsCount++;
    }
  }

  const percent =
    totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const stats: WelcomeCardStat[] = [
    {
      label: t("boardLabel"),
      value: t("taskCount", { count: totalTasks }),
      icon: CheckSquare,
      variant: "info",
      hint: t("columnCount", { count: resolvedColumnsCount }),
    },
    {
      label: t("completedLabel"),
      value: t("doneCount", { count: completedCount }),
      icon: CheckCircle2,
      variant: completedCount > 0 ? "success" : "default",
      hint: totalTasks > 0 ? t("percentCompleted", { percent }) : t("noTasks"),
    },
    {
      label: t("activeHabitsLabel"),
      value: t("habitCount", { count: habitsCount }),
      icon: Flame,
      variant: "gold",
      hint: t("dailyConsistency"),
    },
  ];

  return { stats, completedCount, habitsCount, percent };
}

/**
 * Calcula as estatísticas do WelcomeCard para a tela de Sessão de Foco.
 */
export function calculateFocusWelcomeStats(
  activities: FocusActivity[] = [],
  backpackItems: InventoryItemResponseDTO[] = [],
  locale: AppLocale = "pt-BR",
  isGamified = false,
  todaySummary?: {
    minutes: number;
    sessionsCount: number;
  },
): WelcomeCardStat[] {
  const t = getUtilityTranslator(locale, "catalog.focus");
  const activitiesCount = activities.length;
  const backpackCount = backpackItems.length;
  const todayMinutes = Math.max(0, Math.round(todaySummary?.minutes ?? 0));
  const todaySessions = Math.max(0, todaySummary?.sessionsCount ?? 0);

  const formattedTodayDuration = formatFocusMinutes(todayMinutes);

  return [
    {
      label: t("activitiesLabel"),
      value: t("activityCount", { count: activitiesCount }),
      icon: Target,
      variant: "info",
      hint: activitiesCount > 0 ? t("readyToStart") : t("createFirstActivity"),
    },
    {
      label: isGamified ? t("stageItemsLabel") : t("couponsBreaksLabel"),
      value: t("itemCount", { count: backpackCount }),
      icon: Backpack,
      variant: backpackCount > 0 ? "gold" : "default",
      hint:
        backpackCount > 0
          ? t("focusCouponsHint")
          : isGamified
            ? t("sendFromBackpack")
            : t("linkViaInventory"),
    },
    {
      label: t("focusTodayLabel"),
      value: formattedTodayDuration,
      icon: Timer,
      variant: todayMinutes > 0 ? "success" : "primary",
      hint:
        todaySessions > 0
          ? t("sessionsToday", { count: todaySessions })
          : isGamified
            ? t("gamifiedModeHint")
            : t("productivityModeHint"),
    },
  ];
}
