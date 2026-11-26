"use client";

import { Ban, ExternalLink, Search, UserMinus, Users, X } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { FriendConnectionItem, SocialUserSummary } from "@/types/social";
import { FriendIdentityCell } from "./FriendIdentityCell";

interface AcceptedFriendsGridProps {
  friends: FriendConnectionItem[];
  isTargetPending: (targetId?: string | null) => boolean;
  onRemoveFriend: (conn: FriendConnectionItem) => void;
  onBlockUser: (user: SocialUserSummary) => void;
}

export function AcceptedFriendsGrid({
  friends,
  isTargetPending,
  onRemoveFriend,
  onBlockUser,
}: AcceptedFriendsGridProps) {
  const t = useTranslations("showcase.friends");
  const [filterQuery, setFilterQuery] = useState("");

  const filteredFriends = useMemo(() => {
    const query = filterQuery.trim().toLowerCase();
    if (!query) return friends;
    return friends.filter((conn) => {
      const name = (conn.user.fullName || "").toLowerCase();
      const handle = conn.user.username.toLowerCase();
      return name.includes(query) || handle.includes(query);
    });
  }, [friends, filterQuery]);

  return (
    <section className="rounded-2xl border border-neutral-700 dark:border-primary/25 bg-card dark:bg-surface/50 p-5 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-body-m font-extrabold text-neutral-100 flex items-center gap-2">
          <Users
            size={18}
            className="text-amber-700 dark:text-gold"
            aria-hidden="true"
          />
          <span>{t("acceptedTitle", { count: friends.length })}</span>
        </h2>

        {friends.length > 4 && (
          <search className="relative w-full sm:w-64">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder={t("filterFriendsPlaceholder")}
              aria-label={t("filterFriendsPlaceholder")}
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              className="w-full h-9 pl-9 pr-8 rounded-xl bg-surface/70 border border-neutral-700 dark:border-primary/25 text-base sm:text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-gold"
            />
            {filterQuery && (
              <button
                type="button"
                onClick={() => setFilterQuery("")}
                aria-label={t("clearSearchAria")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-neutral-400 hover:text-neutral-100 cursor-pointer"
              >
                <X size={13} aria-hidden="true" />
              </button>
            )}
          </search>
        )}
      </div>

      {friends.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-700 dark:border-primary/25 bg-surface/40 p-6 text-center flex flex-col items-center gap-2">
          <p className="text-sm font-bold text-neutral-200">
            {t("emptyFriendsTitle")}
          </p>
          <p className="text-xs text-neutral-400 max-w-md">
            {t("emptyFriendsDesc")}
          </p>
        </div>
      ) : filteredFriends.length === 0 ? (
        <p className="text-xs text-neutral-400 py-2">
          {t("filterFriendsEmpty")}
        </p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredFriends.map((conn) => {
            const isItemBusy =
              isTargetPending(conn.friendshipId) ||
              isTargetPending(conn.user.id);
            const targetName = conn.user.fullName || `@${conn.user.username}`;

            return (
              <li
                key={conn.friendshipId}
                className="flex flex-col justify-between gap-3 rounded-xl border border-neutral-700 dark:border-primary/20 bg-surface/55 p-3.5"
              >
                <FriendIdentityCell user={conn.user} />

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-neutral-700/60 dark:border-primary/15">
                  <Link
                    href={`/profile/${encodeURIComponent(conn.user.username)}`}
                    aria-label={t("viewProfileAria", { name: targetName })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-gold/15 border border-gold/40 text-amber-800 dark:text-gold hover:bg-gold/25 transition-colors"
                  >
                    <ExternalLink size={12} aria-hidden="true" />
                    <span>{t("viewProfileBtn")}</span>
                  </Link>
                  <button
                    type="button"
                    disabled={isItemBusy}
                    aria-label={t("removeFriendUserAria", { name: targetName })}
                    onClick={() => onRemoveFriend(conn)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-neutral-700 bg-card hover:bg-surface-hover text-neutral-300 hover:text-red-700 dark:hover:text-red-400 transition-colors cursor-pointer disabled:opacity-55"
                  >
                    <UserMinus size={12} aria-hidden="true" />
                    <span>{t("removeFriendBtn")}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isItemBusy}
                    onClick={() => onBlockUser(conn.user)}
                    aria-label={t("blockUserAria", { name: targetName })}
                    title={t("blockUserAria", { name: targetName })}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-300 transition-colors cursor-pointer disabled:opacity-55"
                  >
                    <Ban size={12} aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
