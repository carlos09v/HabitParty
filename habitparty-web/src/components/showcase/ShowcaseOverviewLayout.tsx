import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { LockedSectionNotice } from "@/components/showcase/LockedSectionNotice";
import { ShowcaseCollectionSection } from "@/components/showcase/ShowcaseCollectionSection";
import { ShowcaseHighlightsSection } from "@/components/showcase/ShowcaseHighlightsSection";
import type {
  AchievementItemResponseDTO,
  ArtifactItemResponseDTO,
  ProfileHighlightResponseDTO,
  ShowcaseStatsResponseDTO,
  TaskStreakHighlightDTO,
} from "@/types/showcase";
import type { UserResponseDTO } from "@/types/user";
import type { ShowcaseCollectionTabId } from "@/utils/showcaseUtils";

interface ShowcaseOverviewLayoutProps {
  panelId: string;
  labelledById: string;
  bannerSlot?: ReactNode;
  user: UserResponseDTO;
  stats: ShowcaseStatsResponseDTO;
  highlights: ProfileHighlightResponseDTO[];
  achievements: AchievementItemResponseDTO[];
  artifacts: ArtifactItemResponseDTO[];
  taskStreaks?: TaskStreakHighlightDTO[];
  isVisitorMode: boolean;
  canViewStats: boolean;
  canViewAchievements: boolean;
  statsSlot?: ReactNode;
  onOpenPicker: (slotIndex: number) => void;
  onPreloadPicker?: () => void;
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

/**
 * Layout unificado da aba "Visão Geral" da vitrine (própria e pública):
 * Banner opcional → 4 Slots de Destaques → Grade de Estatísticas (ou aviso privado) → Coleção Conquistas/Artefatos (ou aviso privado).
 */
export function ShowcaseOverviewLayout({
  panelId,
  labelledById,
  bannerSlot,
  user,
  stats,
  highlights,
  achievements,
  artifacts,
  taskStreaks,
  isVisitorMode,
  canViewStats,
  canViewAchievements,
  statsSlot,
  onOpenPicker,
  onPreloadPicker,
  activeCollection,
  onSelectCollection,
  onPinAchievement,
  onUnpinAchievement,
  onPinArtifact,
  onUnpinArtifact,
  totalAchievementsCount,
  totalArtifactsCount,
  achievementsSeenDismissed,
  artifactsSeenDismissed,
}: ShowcaseOverviewLayoutProps) {
  const tPublic = useTranslations("showcase.publicProfile");

  return (
    <div
      id={panelId}
      role="tabpanel"
      aria-labelledby={labelledById}
      className="flex flex-col gap-7"
    >
      {bannerSlot}

      <ShowcaseHighlightsSection
        user={user}
        stats={stats}
        highlights={highlights}
        achievements={achievements}
        artifacts={artifacts}
        taskStreaks={taskStreaks}
        isVisitorMode={isVisitorMode}
        onOpenPicker={onOpenPicker}
        onPreloadPicker={onPreloadPicker}
      />

      {canViewStats && statsSlot ? (
        statsSlot
      ) : (
        <LockedSectionNotice
          title={tPublic("statsLockedTitle")}
          description={tPublic("statsLockedDesc")}
        />
      )}

      {canViewAchievements ? (
        <ShowcaseCollectionSection
          achievements={achievements}
          artifacts={artifacts}
          highlights={highlights}
          isVisitorMode={isVisitorMode}
          activeCollection={activeCollection}
          onSelectCollection={onSelectCollection}
          onPinAchievement={onPinAchievement}
          onUnpinAchievement={onUnpinAchievement}
          onPinArtifact={onPinArtifact}
          onUnpinArtifact={onUnpinArtifact}
          totalAchievementsCount={totalAchievementsCount}
          totalArtifactsCount={totalArtifactsCount}
          achievementsSeenDismissed={achievementsSeenDismissed}
          artifactsSeenDismissed={artifactsSeenDismissed}
        />
      ) : (
        <LockedSectionNotice
          title={tPublic("achievementsLockedTitle")}
          description={tPublic("achievementsLockedDesc")}
        />
      )}
    </div>
  );
}
