"use client";

import { useTranslations } from "next-intl";
import type { AvatarFrameId } from "@/constants/avatarFrames";
import type { FriendConnectionItem } from "@/types/social";
import type { LevelProgress, UserLevelTier } from "@/utils";
import { PyramidTierRow } from "./PyramidTierRow";
import { getTierStatus } from "./tierStatus";
import { EMPTY_FRIENDS, type EraTierGroup } from "./useProgressionPyramid";

interface PyramidLadderProps {
  eraGroups: EraTierGroup[];
  currentTier: UserLevelTier;
  currentRankOrder: number;
  selectedTier: UserLevelTier;
  isVisitorMode: boolean;
  onSelectTier: (tier: UserLevelTier) => void;
  friendsByTier: Map<UserLevelTier, FriendConnectionItem[]>;
  progress: LevelProgress;
  userAvatar: {
    src?: string | null;
    name: string;
    hasRing: boolean;
    frameId: AvatarFrameId;
  };
}

export function PyramidLadder({
  eraGroups,
  currentTier,
  currentRankOrder,
  selectedTier,
  isVisitorMode,
  onSelectTier,
  friendsByTier,
  progress,
  userAvatar,
}: PyramidLadderProps) {
  const t = useTranslations("showcase.progression");

  return (
    <section
      aria-label={t("pyramid.navAria")}
      className="lg:col-span-7 rounded-2xl border border-neutral-700 dark:border-primary/30 bg-card dark:bg-surface/55 p-4 sm:p-6 flex flex-col gap-5"
    >
      {eraGroups.map(({ eraId, tiers }) => (
        <div key={eraId} className="flex flex-col items-center gap-2">
          <div className="w-full flex items-center gap-2 px-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-neutral-400">
              {t(`eras.${eraId}`)}
            </span>
            <div className="h-px flex-1 bg-neutral-700/70 dark:bg-white/10" />
          </div>

          {tiers.map((tierView) => {
            const isCurrent = tierView.entry.tier === currentTier;
            const status = getTierStatus(
              tierView.meta.rankOrder,
              currentRankOrder,
              isCurrent,
            );
            const tierFriends = isVisitorMode
              ? EMPTY_FRIENDS
              : (friendsByTier.get(tierView.entry.tier) ?? EMPTY_FRIENDS);

            return (
              <PyramidTierRow
                key={tierView.entry.tier}
                tierView={tierView}
                status={status}
                isSelected={tierView.entry.tier === selectedTier}
                isVisitorMode={isVisitorMode}
                onSelect={onSelectTier}
                friends={tierFriends}
                progress={progress}
                userAvatar={userAvatar}
              />
            );
          })}
        </div>
      ))}
    </section>
  );
}
