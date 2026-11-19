"use client";

import type { AvatarFrameId } from "@/constants/avatarFrames";
import type {
  AchievementItemResponseDTO,
  ShowcaseStatsResponseDTO,
} from "@/types/showcase";
import type { FriendConnectionItem } from "@/types/social";
import type { UserResponseDTO } from "@/types/user";
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
          onSelectTier={selectTier}
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

        <aside className="lg:col-span-5 flex flex-col gap-4">
          <TierInspectorCard
            tierView={selectedTierView}
            status={selectedStatus}
            isGamified={isGamified}
            progress={progress}
            nextRankTitle={nextRankTitle}
            remainingXpToSelected={remainingXpToSelected}
          />

          <EffortSimulatorCard
            remainingXp={remainingXpToSelected}
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
