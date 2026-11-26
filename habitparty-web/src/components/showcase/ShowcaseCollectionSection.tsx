"use client";

import { Gem, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useMemo, useState } from "react";
import { AchievementsGallery } from "@/components/showcase/AchievementsGallery";
import {
  LazyArtifactsGallery,
  preloadArtifactsGallery,
} from "@/components/showcase/showcaseDynamicPanels";
import { DEFAULT_TOTAL_ARTIFACTS_COUNT } from "@/constants/artifacts";
import type {
  AchievementItemResponseDTO,
  ArtifactItemResponseDTO,
  ProfileHighlightResponseDTO,
} from "@/types/showcase";
import { cn } from "@/utils/cn";
import {
  handleTabListKeyDown,
  type ShowcaseCollectionTabId,
} from "@/utils/showcaseUtils";

interface ShowcaseCollectionSectionProps {
  achievements: AchievementItemResponseDTO[];
  artifacts: ArtifactItemResponseDTO[];
  highlights: ProfileHighlightResponseDTO[];
  isVisitorMode: boolean;
  activeCollection?: ShowcaseCollectionTabId;
  onSelectCollection?: (tab: ShowcaseCollectionTabId) => void;
  onPinAchievement?: (achievement: AchievementItemResponseDTO) => void;
  onUnpinAchievement?: (achievement: AchievementItemResponseDTO) => void;
  onPinArtifact?: (artifact: ArtifactItemResponseDTO) => void;
  onUnpinArtifact?: (artifact: ArtifactItemResponseDTO) => void;
  totalAchievementsCount?: number;
  totalArtifactsCount?: number;
  achievementsSeenDismissed?: boolean;
  artifactsSeenDismissed?: boolean;
}

const noop = () => {};

/**
 * Agrupa Conquistas & Medalhas e Artefatos & Relíquias em 2 sub-abas acessíveis,
 * reduzindo a altura vertical inicial da aba Vitrine do perfil.
 */
export function ShowcaseCollectionSection({
  achievements,
  artifacts,
  highlights,
  isVisitorMode,
  activeCollection,
  onSelectCollection,
  onPinAchievement = noop,
  onUnpinAchievement,
  onPinArtifact = noop,
  onUnpinArtifact,
  totalAchievementsCount,
  totalArtifactsCount,
  achievementsSeenDismissed = false,
  artifactsSeenDismissed = false,
}: ShowcaseCollectionSectionProps) {
  const t = useTranslations("showcase.collectionTabs");
  const baseId = useId();
  const [internalTab, setInternalTab] =
    useState<ShowcaseCollectionTabId>("achievements");

  const currentTab = activeCollection ?? internalTab;
  const handleSelect = (tab: ShowcaseCollectionTabId) => {
    if (activeCollection === undefined) {
      setInternalTab(tab);
    }
    onSelectCollection?.(tab);
  };

  const unlockedAchievements = useMemo(
    () => achievements.filter((a) => a.unlocked).length,
    [achievements],
  );
  const resolvedTotalAchievements =
    achievements.length > 0
      ? achievements.length
      : (totalAchievementsCount ?? 0);

  const unlockedArtifacts = useMemo(
    () => artifacts.filter((a) => a.unlocked).length,
    [artifacts],
  );
  const resolvedTotalArtifacts =
    artifacts.length > 0
      ? artifacts.length
      : (totalArtifactsCount ?? DEFAULT_TOTAL_ARTIFACTS_COUNT);

  const unseenAchievementsCount = useMemo(
    () =>
      isVisitorMode || achievementsSeenDismissed
        ? 0
        : achievements.filter((a) => a.unlocked && !a.seen).length,
    [achievements, achievementsSeenDismissed, isVisitorMode],
  );
  const unseenArtifactsCount = useMemo(
    () =>
      isVisitorMode || artifactsSeenDismissed
        ? 0
        : artifacts.filter((a) => a.unlocked && !a.seen).length,
    [artifacts, artifactsSeenDismissed, isVisitorMode],
  );

  const achievementsTabId = `${baseId}-tab-achievements`;
  const achievementsPanelId = `${baseId}-panel-achievements`;
  const artifactsTabId = `${baseId}-tab-artifacts`;
  const artifactsPanelId = `${baseId}-panel-artifacts`;

  const subTabs = [
    {
      id: "achievements" as const,
      tabId: achievementsTabId,
      panelId: achievementsPanelId,
      label: t("achievements"),
      countText: `${unlockedAchievements}/${resolvedTotalAchievements}`,
      unseenCount: unseenAchievementsCount,
      icon: Trophy,
      onPreload: undefined,
    },
    {
      id: "artifacts" as const,
      tabId: artifactsTabId,
      panelId: artifactsPanelId,
      label: t("artifacts"),
      countText: `${unlockedArtifacts}/${resolvedTotalArtifacts}`,
      unseenCount: unseenArtifactsCount,
      icon: Gem,
      onPreload: preloadArtifactsGallery,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div
        role="tablist"
        aria-label={t("navAria")}
        className="flex items-center gap-1 border-b border-neutral-700/80 dark:border-primary/20 overflow-x-auto custom-scrollbar"
      >
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              id={tab.tabId}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={tab.panelId}
              tabIndex={isSelected ? 0 : -1}
              onKeyDown={handleTabListKeyDown}
              onClick={() => handleSelect(tab.id)}
              onMouseEnter={tab.onPreload}
              onFocus={tab.onPreload}
              className={cn(
                "relative inline-flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer",
                "focus-visible:outline-2 focus-visible:outline-gold focus-visible:-outline-offset-2",
                "aria-selected:text-amber-700 dark:aria-selected:text-gold aria-selected:bg-amber-500/8 dark:aria-selected:bg-gold/10 aria-selected:forced-colors:outline-2 aria-selected:forced-colors:outline-solid aria-selected:forced-colors:outline-[Highlight]",
                "aria-selected:after:content-[''] aria-selected:after:absolute aria-selected:after:inset-x-2 aria-selected:after:bottom-0 aria-selected:after:border-b-2 aria-selected:after:border-amber-600 dark:aria-selected:after:border-gold",
                !isSelected &&
                  "text-neutral-300 hover:text-neutral-50 hover:bg-white/5",
              )}
            >
              <Icon size={15} aria-hidden="true" />
              <span>{tab.label}</span>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums",
                  isSelected
                    ? "bg-amber-500/20 text-amber-800 dark:bg-gold/20 dark:text-gold"
                    : "bg-neutral-800/80 text-neutral-300 border border-neutral-700/70",
                )}
              >
                {tab.countText}
              </span>
              {tab.unseenCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">
                  {t("newBadge", { count: tab.unseenCount })}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {currentTab === "achievements" ? (
        <div
          id={achievementsPanelId}
          role="tabpanel"
          aria-labelledby={achievementsTabId}
        >
          <AchievementsGallery
            achievements={achievements}
            highlights={highlights}
            isVisitorMode={isVisitorMode}
            onPinAchievement={onPinAchievement}
            onUnpinAchievement={onUnpinAchievement}
          />
        </div>
      ) : (
        <div
          id={artifactsPanelId}
          role="tabpanel"
          aria-labelledby={artifactsTabId}
        >
          <LazyArtifactsGallery
            artifacts={artifacts}
            highlights={highlights}
            isVisitorMode={isVisitorMode}
            onPinArtifact={onPinArtifact}
            onUnpinArtifact={onUnpinArtifact}
          />
        </div>
      )}
    </div>
  );
}
