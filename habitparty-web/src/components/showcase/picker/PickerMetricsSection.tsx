import { BarChart3, Flame } from "lucide-react";
import { useTranslations } from "next-intl";
import type {
  AchievementItemResponseDTO,
  ArtifactItemResponseDTO,
  HighlightType,
  ShowcaseStatsResponseDTO,
  TaskStreakHighlightDTO,
} from "@/types/showcase";
import {
  resolveHighlightSlotCard,
  STAT_METRIC_KEYS,
} from "@/utils/showcaseUtils";
import { type PickerGridItem, PickerItemGrid } from "./PickerItemGrid";

interface PickerMetricsSectionProps {
  stats: ShowcaseStatsResponseDTO;
  achievements: AchievementItemResponseDTO[];
  artifacts: ArtifactItemResponseDTO[];
  taskStreaks: TaskStreakHighlightDTO[];
  activeTaskStreaks: TaskStreakHighlightDTO[];
  isGamified: boolean;
  levelTitle: string;
  currentXp: number;
  findEquippedSlotIndex: (
    type: HighlightType,
    referenceId?: string | null,
    highlightKey?: string | null,
  ) => number;
  onAssign: (
    type: HighlightType,
    referenceId: string | null,
    highlightKey: string | null,
  ) => void;
}

export function PickerMetricsSection({
  stats,
  achievements,
  artifacts,
  taskStreaks,
  activeTaskStreaks,
  isGamified,
  levelTitle,
  currentXp,
  findEquippedSlotIndex,
  onAssign,
}: PickerMetricsSectionProps) {
  const t = useTranslations("showcase.pickerModal");
  const tHighlights = useTranslations("showcase.highlights");
  const tRarities = useTranslations("showcase.rarities");
  const tCatalog = useTranslations("showcase.catalog");
  const tBadges = useTranslations("showcase.accountBadges");
  const tArtifacts = useTranslations("showcase.artifacts");

  const resolveContext = {
    achievements,
    artifacts,
    taskStreaks,
    stats,
    isGamified,
    levelTitle,
    currentXp,
    tCatalog,
    tBadges,
    tArtifacts,
    tHighlights,
  };

  const metricItems: PickerGridItem[] = STAT_METRIC_KEYS.filter(
    (metricKey) =>
      metricKey !== "HIGHEST_TASK_STREAK" ||
      (stats?.highestTaskStreak ?? 0) > 0 ||
      findEquippedSlotIndex("STAT_METRIC", null, "HIGHEST_TASK_STREAK") !== -1,
  ).flatMap((metricKey) => {
    const resolved = resolveHighlightSlotCard(
      {
        highlightType: "STAT_METRIC",
        referenceId: null,
        highlightKey: metricKey,
      },
      resolveContext,
    );
    if (!resolved) return [];
    return [
      {
        key: metricKey,
        iconKey: resolved.iconKey,
        title: resolved.title,
        subtitle: resolved.subtitle,
        rarity: resolved.rarity,
        rarityLabel: tRarities(resolved.rarity),
        equippedSlot: findEquippedSlotIndex("STAT_METRIC", null, metricKey),
        highlightRingOnEquipped: true,
        onSelect: () => onAssign("STAT_METRIC", null, metricKey),
      },
    ];
  });

  const taskStreakItems: PickerGridItem[] = activeTaskStreaks.flatMap(
    (taskStreak) => {
      const resolved = resolveHighlightSlotCard(
        {
          highlightType: "TASK_STREAK",
          referenceId: null,
          highlightKey: taskStreak.id,
          taskStreak,
        },
        resolveContext,
      );
      if (!resolved) return [];
      return [
        {
          key: taskStreak.id,
          iconKey: resolved.iconKey,
          title: resolved.title,
          subtitle: resolved.subtitle,
          rarity: resolved.rarity,
          rarityLabel: tRarities(resolved.rarity),
          extraBadge: resolved.extraBadge,
          equippedSlot: findEquippedSlotIndex(
            "TASK_STREAK",
            null,
            taskStreak.id,
          ),
          highlightRingOnEquipped: true,
          onSelect: () => onAssign("TASK_STREAK", null, taskStreak.id),
        },
      ];
    },
  );

  const alreadyEquippedLabel = (slot: number) => t("alreadyEquipped", { slot });

  return (
    <div className="flex flex-col gap-5">
      {/* SEÇÃO 1: MÉTRICAS DO PERFIL (INCLUINDO MAIOR STREAK DE TAREFA) */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-neutral-300">
          <BarChart3 size={14} className="text-sky-400" aria-hidden="true" />
          <span>{t("metricsSectionTitle")}</span>
        </div>

        <PickerItemGrid
          items={metricItems}
          alreadyEquippedLabel={alreadyEquippedLabel}
          gridClassName="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
        />
      </div>

      {/* SEÇÃO 2: OFENSIVAS ATIVAS DE MAIOR STREAK */}
      {taskStreakItems.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-neutral-300">
              <Flame
                size={14}
                className="text-warning-500"
                aria-hidden="true"
              />
              <span>{t("tasksSectionTitle")}</span>
            </div>
            <span className="text-[11px] font-semibold text-neutral-400 tabular-nums">
              {taskStreakItems.length}
            </span>
          </div>

          <PickerItemGrid
            items={taskStreakItems}
            alreadyEquippedLabel={alreadyEquippedLabel}
            gridClassName="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
          />
        </div>
      )}
    </div>
  );
}
