"use client";

import { CheckCircle2, Crown, Lock } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type { CSSProperties } from "react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { AvatarFrameId } from "@/constants/avatarFrames";
import type { FriendConnectionItem } from "@/types/social";
import {
  cn,
  type LevelProgress,
  type ProgressionTierView,
  type UserLevelTier,
} from "@/utils";
import { TierFriendsPopover } from "./TierFriendsPopover";
import {
  getPyramidRowClass,
  TIER_TITLE_TEXT_CLASS,
  type TierStatus,
} from "./tierStatus";

interface PyramidTierRowProps {
  tierView: ProgressionTierView;
  status: TierStatus;
  isSelected: boolean;
  isVisitorMode: boolean;
  onSelect: (tier: UserLevelTier) => void;
  friends: FriendConnectionItem[];
  progress: LevelProgress;
  userAvatar: {
    src?: string | null;
    name: string;
    hasRing: boolean;
    frameId: AvatarFrameId;
  };
}

export function PyramidTierRow({
  tierView,
  status,
  isSelected,
  isVisitorMode,
  onSelect,
  friends,
  progress,
  userAvatar,
}: PyramidTierRowProps) {
  const t = useTranslations("showcase.progression.pyramid");
  const format = useFormatter();

  const isCurrent = status === "current";
  const isUnlocked = status !== "locked";

  const rowWidthStyle = {
    "--mobile-w": `${tierView.meta.mobileWidthPercent}%`,
    "--desktop-w": `${tierView.meta.desktopWidthPercent}%`,
  } as CSSProperties;

  return (
    <div
      style={rowWidthStyle}
      className={getPyramidRowClass(
        status,
        isSelected,
        tierView.meta.activeBorderClass,
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(tierView.entry.tier)}
        aria-pressed={isSelected}
        className="flex-1 min-w-0 flex items-center justify-between gap-2.5 text-left cursor-pointer rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {isCurrent ? (
            <UserAvatar
              src={userAvatar.src}
              name={userAvatar.name}
              size="sm"
              hasRing={userAvatar.hasRing}
              frameId={userAvatar.frameId}
              className="shrink-0"
            />
          ) : (
            <span
              className={cn(
                "w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 text-xs font-black tabular-nums",
                isUnlocked
                  ? tierView.meta.badgeClass
                  : "bg-neutral-800/30 dark:bg-white/5 border-neutral-600/50 dark:border-white/10 text-neutral-400",
              )}
            >
              {tierView.entry.tier === "LEGEND" ? (
                <Crown size={14} aria-hidden="true" />
              ) : isUnlocked ? (
                <CheckCircle2 size={14} aria-hidden="true" />
              ) : (
                <Lock size={13} aria-hidden="true" />
              )}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={cn(
                  "text-xs sm:text-sm font-extrabold truncate",
                  TIER_TITLE_TEXT_CLASS[status],
                )}
              >
                {tierView.localizedTitle}
              </span>

              {isCurrent && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gold text-on-gold shrink-0">
                  {isVisitorMode ? t("playerBadge") : t("youBadge")}
                </span>
              )}
            </div>

            {isCurrent && !progress.isMaxLevel && (
              <div className="mt-1.5 flex items-center gap-2">
                <ProgressBar
                  as="span"
                  decorative
                  percent={progress.percent}
                  className="h-1.5 flex-1 bg-neutral-700/60 dark:bg-black/40"
                  fillClassName={cn(
                    "bg-gradient-to-r transition-transform duration-500",
                    tierView.meta.barGradientClass,
                  )}
                />
                <span className="text-[10px] font-extrabold text-amber-700 dark:text-gold tabular-nums shrink-0">
                  {progress.percent}%
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0">
          <span className="text-[11px] font-bold text-neutral-300 tabular-nums">
            {t("xpThresholdLabel", {
              minXp: format.number(tierView.minXp),
            })}
          </span>
          <span className="text-[10px] text-neutral-400 font-semibold tabular-nums">
            {t("rankNumberLabel", {
              rank: tierView.meta.rankOrder,
            })}
          </span>
        </div>
      </button>

      {friends.length > 0 && <TierFriendsPopover friends={friends} />}
    </div>
  );
}
