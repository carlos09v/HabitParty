"use client";

import { useRef } from "react";
import type { AvatarFrameId } from "@/constants/avatarFrames";
import type {
  AchievementItemResponseDTO,
  ShowcaseStatsResponseDTO,
} from "@/types/showcase";
import type { FriendConnectionItem } from "@/types/social";
import type { UserResponseDTO } from "@/types/user";
import type { UserLevelTier } from "@/utils/progression";
import { EffortSimulatorCard } from "./EffortSimulatorCard";
import { LinkedAchievementCard } from "./LinkedAchievementCard";
import { ProgressionHeader } from "./ProgressionHeader";
import { PyramidLadder } from "./PyramidLadder";
import { TierInspectorCard } from "./TierInspectorCard";
import { EMPTY_FRIENDS, useProgressionPyramid } from "./useProgressionPyramid";

export interface ProgressionPyramidPanelProps {
  user: UserResponseDTO;
  stats?: ShowcaseStatsResponseDTO | null;
  achievements: AchievementItemResponseDTO[];
  friends?: FriendConnectionItem[];
  activeFrameId?: AvatarFrameId;
  isVisitorMode?: boolean;
}

export function ProgressionPyramidPanel({
  user,
  stats,
  achievements,
  friends = EMPTY_FRIENDS,
  activeFrameId,
  isVisitorMode = false,
}: ProgressionPyramidPanelProps) {
  const inspectorAsideRef = useRef<HTMLElement>(null);
  const {
    isGamified,
    currentXp,
    progress,
    currentRankOrder,
    currentTier,
    currentRankTitle,
    nextRankTitle,
    eraGroups,
    friendsByTier,
    selectedTierView,
    selectedStatus,
    selectTier,
    remainingXpToSelected,
    linkedAchievement,
    linkedAchievementTheme,
    linkedAchievementCopy,
    displayName,
    activeAvatarFrame,
  } = useProgressionPyramid({
    user,
    stats,
    achievements,
    friends,
    activeFrameId,
    isVisitorMode,
  });

  const handleSelectTier = (tier: UserLevelTier) => {
    selectTier(tier);
    if (
      typeof window !== "undefined" &&
      window.innerWidth < 1024 &&
      inspectorAsideRef.current
    ) {
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      inspectorAsideRef.current.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "nearest",
      });
    }
  };

  // Quando o usuário está no degrau atual (e não no topo), o simulador aponta para a próxima patente
  const simulatorRemainingXp =
    selectedStatus === "current" && !progress.isMaxLevel
      ? progress.remainingXp
      : remainingXpToSelected;
  const simulatorTargetTitle =
    selectedStatus === "current" && !progress.isMaxLevel
      ? nextRankTitle
      : selectedStatus === "locked"
        ? selectedTierView.localizedTitle
        : undefined;

  return (
    <div className="flex flex-col gap-6">
      <ProgressionHeader
        isGamified={isGamified}
        currentRankTitle={currentRankTitle}
        currentRankOrder={currentRankOrder}
        currentXp={currentXp}
        nextRankTitle={nextRankTitle}
        isMaxLevel={progress.isMaxLevel}
        remainingXp={progress.remainingXp}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <PyramidLadder
          eraGroups={eraGroups}
          currentTier={currentTier}
          currentRankOrder={currentRankOrder}
          selectedTier={selectedTierView.entry.tier}
          isGamified={isGamified}
          isVisitorMode={isVisitorMode}
          onSelectTier={handleSelectTier}
          friendsByTier={friendsByTier}
          progress={progress}
          userAvatar={{
            src: user.profilePhotoUrl,
            name: displayName,
            hasRing: Boolean(user.isPremium),
            frameId: activeAvatarFrame,
            presetId: user.avatarPreset,
          }}
        />

        <aside
          ref={inspectorAsideRef}
          className="lg:col-span-5 flex flex-col gap-4 scroll-mt-4"
        >
          <TierInspectorCard
            tierView={selectedTierView}
            status={selectedStatus}
            isGamified={isGamified}
            progress={progress}
            nextRankTitle={nextRankTitle}
            remainingXpToSelected={remainingXpToSelected}
          />

          <EffortSimulatorCard
            remainingXp={simulatorRemainingXp}
            targetRankTitle={simulatorTargetTitle}
            isGamified={isGamified}
          />

          <LinkedAchievementCard
            achievement={linkedAchievement}
            theme={linkedAchievementTheme}
            copy={linkedAchievementCopy}
          />
        </aside>
      </div>
    </div>
  );
}
