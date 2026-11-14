"use client";

import { Ban, ExternalLink, UserMinus, Users } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { FriendConnectionItem } from "@/types/social";
import { FriendIdentityCell } from "./FriendIdentityCell";

interface AcceptedFriendsGridProps {
  friends: FriendConnectionItem[];
  isMutating: boolean;
  onRemoveFriend: (friendshipId: string) => void;
  onBlockUser: (userId: string) => void;
}

export function AcceptedFriendsGrid({
  friends,
  isMutating,
  onRemoveFriend,
  onBlockUser,
}: AcceptedFriendsGridProps) {
  const t = useTranslations("showcase.friends");

  return (
    <section className="rounded-2xl border border-neutral-700 dark:border-primary/25 bg-card dark:bg-surface/50 p-5 flex flex-col gap-4">
      <h2 className="text-body-m font-extrabold text-neutral-100 flex items-center gap-2">
        <Users
          size={18}
          className="text-amber-700 dark:text-gold"
          aria-hidden="true"
        />
        <span>{t("acceptedTitle", { count: friends.length })}</span>
      </h2>

      {friends.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-700 dark:border-primary/25 bg-surface/40 p-6 text-center flex flex-col items-center gap-2">
          <p className="text-sm font-bold text-neutral-200">
            {t("emptyFriendsTitle")}
          </p>
          <p className="text-xs text-neutral-400 max-w-md">
            {t("emptyFriendsDesc")}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {friends.map((conn) => (
            <li
              key={conn.friendshipId}
              className="flex flex-col justify-between gap-3 rounded-xl border border-neutral-700 dark:border-primary/20 bg-surface/55 p-3.5"
            >
              <FriendIdentityCell user={conn.user} />

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-neutral-700/60 dark:border-primary/15">
                <Link
                  href={`/profile/${encodeURIComponent(conn.user.username)}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-gold/15 border border-gold/40 text-amber-800 dark:text-gold hover:bg-gold/25 transition-colors"
                >
                  <ExternalLink size={12} aria-hidden="true" />
                  <span>{t("viewProfileBtn")}</span>
                </Link>
                <button
                  type="button"
                  disabled={isMutating}
                  onClick={() => onRemoveFriend(conn.friendshipId)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-neutral-700 bg-card hover:bg-surface-hover text-neutral-300 hover:text-red-700 dark:hover:text-red-400 transition-colors cursor-pointer"
                >
                  <UserMinus size={12} aria-hidden="true" />
                  <span>{t("removeFriendBtn")}</span>
                </button>
                <button
                  type="button"
                  disabled={isMutating}
                  onClick={() => onBlockUser(conn.user.id)}
                  aria-label={t("blockBtn")}
                  title={t("blockBtn")}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-300 transition-colors cursor-pointer"
                >
                  <Ban size={12} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
