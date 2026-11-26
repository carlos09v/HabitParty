"use client";

import { Flame } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { resolveAvatarFrameId } from "@/constants/avatarFrames";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import type { SocialUserSummary } from "@/types/social";
import { cn } from "@/utils/cn";
import { localizeLevelTitle } from "@/utils/levels";

interface FriendIdentityCellProps {
  user: SocialUserSummary;
  variant?: "default" | "compact";
  metaText?: string;
  onNavigate?: () => void;
}

export function FriendIdentityCell({
  user,
  variant = "default",
  metaText,
  onNavigate,
}: FriendIdentityCellProps) {
  const t = useTranslations("showcase.friends");
  const locale = useLocale() as AppLocale;
  const { isGamified } = useExperienceMode();
  const displayName = user.fullName || user.username;
  const isCompact = variant === "compact";
  const resolvedLevelTitle =
    metaText ??
    (user.levelTitle
      ? localizeLevelTitle(user.levelTitle, locale, isGamified)
      : null);

  return (
    <Link
      href={`/profile/${encodeURIComponent(user.username)}`}
      onClick={onNavigate}
      className={cn(
        "flex items-center min-w-0 flex-1 group",
        isCompact
          ? "gap-2.5 p-1.5 rounded-xl hover:bg-surface-hover dark:hover:bg-white/5 transition-colors"
          : "gap-3",
      )}
    >
      <UserAvatar
        src={user.profilePhotoUrl}
        name={displayName}
        size={isCompact ? "sm" : "md"}
        hasRing={user.isPremium}
        frameId={resolveAvatarFrameId(user.avatarFrame)}
        presetId={user.avatarPreset}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              "truncate transition-colors",
              isCompact
                ? "text-xs font-bold text-neutral-100 group-hover:text-amber-700 dark:group-hover:text-gold"
                : "text-sm font-extrabold text-neutral-100 group-hover:text-amber-800 dark:group-hover:text-gold",
            )}
          >
            {displayName}
          </span>
          {!isCompact && user.currentStreak > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-[10px] font-bold text-orange-700 dark:text-orange-300 shrink-0 tabular-nums">
              <Flame size={10} aria-hidden="true" />
              <span>{t("streakChip", { count: user.currentStreak })}</span>
            </span>
          )}
        </div>
        {isCompact ? (
          <p className="text-[11px] text-neutral-400 truncate tabular-nums">
            @{user.username}
            {resolvedLevelTitle ? ` • ${resolvedLevelTitle}` : ""}
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-400">
            <span className="truncate">@{user.username}</span>
            {resolvedLevelTitle && (
              <>
                <span>•</span>
                <span className="truncate">{resolvedLevelTitle}</span>
              </>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
