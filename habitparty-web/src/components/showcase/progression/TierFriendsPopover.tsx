"use client";

import { Users } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useId } from "react";
import { createPortal } from "react-dom";
import { FriendIdentityCell } from "@/components/showcase/friends/FriendIdentityCell";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { resolveAvatarFrameId } from "@/constants/avatarFrames";
import { useFloatingPopover } from "@/hooks/useFloatingPopover";
import type { FriendConnectionItem } from "@/types/social";

interface TierFriendsPopoverProps {
  friends: FriendConnectionItem[];
}

export function TierFriendsPopover({ friends }: TierFriendsPopoverProps) {
  const t = useTranslations("showcase.progression.pyramid");
  const format = useFormatter();
  const popoverId = useId();
  const popover = useFloatingPopover<
    HTMLDivElement,
    HTMLButtonElement,
    HTMLDivElement
  >({
    align: "right",
    estimatedWidth: 272,
    estimatedHeight: 220,
    offset: 8,
    margin: 12,
  });

  const previewFriends = friends.slice(0, 2);
  const extraCount = Math.max(0, friends.length - previewFriends.length);

  return (
    <div ref={popover.containerRef} className="relative shrink-0">
      <button
        ref={popover.triggerRef}
        type="button"
        onClick={popover.toggle}
        aria-expanded={popover.isOpen}
        aria-controls={popover.isOpen ? popoverId : undefined}
        aria-label={t("friendsHereAria", { count: friends.length })}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-neutral-600/80 dark:border-primary/35 bg-surface/90 hover:border-amber-500/60 dark:hover:border-gold/60 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        <span className="flex -space-x-2">
          {previewFriends.map((conn) => (
            <span
              key={conn.user.id}
              className="ring-2 ring-card dark:ring-surface rounded-full"
            >
              <UserAvatar
                src={conn.user.profilePhotoUrl}
                name={conn.user.fullName || conn.user.username}
                size="sm"
                hasRing={conn.user.isPremium}
                frameId={resolveAvatarFrameId(conn.user.avatarFrame)}
                className="w-6 h-6 text-[10px]"
              />
            </span>
          ))}
        </span>
        {extraCount > 0 ? (
          <span className="text-[11px] font-bold text-neutral-300 pl-0.5 tabular-nums">
            +{extraCount}
          </span>
        ) : (
          <Users
            size={12}
            className="text-neutral-400 shrink-0"
            aria-hidden="true"
          />
        )}
      </button>

      {popover.isOpen &&
        popover.shouldRenderPortal &&
        popover.floatingStyle &&
        createPortal(
          <div
            ref={popover.popoverRef}
            id={popoverId}
            style={popover.floatingStyle}
            className="z-[9999] w-68 rounded-2xl border border-neutral-700 dark:border-primary/40 bg-card dark:bg-surface p-3 shadow-card-deep dark:shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-neutral-700/70 dark:border-white/10">
              <span className="text-xs font-extrabold text-neutral-100">
                {t("friendsHereTitle", { count: friends.length })}
              </span>
              <Users
                size={13}
                className="text-amber-700 dark:text-gold shrink-0"
                aria-hidden="true"
              />
            </div>

            <ul className="flex flex-col gap-1.5 max-h-56 overflow-y-auto custom-scrollbar">
              {friends.map((conn) => (
                <li key={conn.user.id}>
                  <FriendIdentityCell
                    user={conn.user}
                    variant="compact"
                    metaText={t("friendXpMeta", {
                      xp: format.number(conn.user.totalXp ?? 0),
                    })}
                    onNavigate={popover.close}
                  />
                </li>
              ))}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}
