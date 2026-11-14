"use client";

import { Flame } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { getAvatarFrame } from "@/constants/avatarFrames";
import type { SocialUserSummary } from "@/types/social";

interface FriendIdentityCellProps {
  user: SocialUserSummary;
}

export function FriendIdentityCell({ user }: FriendIdentityCellProps) {
  const t = useTranslations("showcase.friends");
  const displayName = user.fullName || user.username;

  return (
    <Link
      href={`/profile/${encodeURIComponent(user.username)}`}
      className="flex items-center gap-3 min-w-0 flex-1 group"
    >
      <UserAvatar
        src={user.profilePhotoUrl}
        name={displayName}
        size="md"
        hasRing={user.isPremium}
        frameId={getAvatarFrame(user.avatarFrame ?? undefined).id}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-extrabold text-neutral-100 group-hover:text-amber-800 dark:group-hover:text-gold transition-colors truncate">
            {displayName}
          </span>
          {user.currentStreak > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-[10px] font-bold text-orange-700 dark:text-orange-300 shrink-0 tabular-nums">
              <Flame size={10} aria-hidden="true" />
              <span>{t("streakChip", { count: user.currentStreak })}</span>
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-400">
          <span className="truncate">@{user.username}</span>
          <span>•</span>
          <span className="truncate">{user.levelTitle}</span>
        </div>
      </div>
    </Link>
  );
}
