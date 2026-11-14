import { ArrowRight, Flame, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { getAvatarFrame } from "@/constants/avatarFrames";
import { getFriendsOverview } from "@/services/socialService";
import type { PartyWidgetProps } from "@/types/dashboard";
import { cn } from "@/utils";

/**
 * Widget de Rede Social / Party no painel direito do Dashboard.
 * Server Component conectado ao backend de amizades com atalho direto para `/profile?tab=friends`.
 */
export async function PartyWidget({
  isCompact = false,
  experienceMode = "PRODUCTIVITY",
}: PartyWidgetProps) {
  const [t, overview] = await Promise.all([
    getTranslations("dashboard.sidebarRight.partyWidget"),
    getFriendsOverview(),
  ]);

  const isGamified = experienceMode === "GAMIFIED";
  const friends = overview?.friends ?? [];
  const pendingCount = overview?.incomingRequests.length ?? 0;
  const visibleFriends = friends.slice(0, 4);

  return (
    <section
      aria-label={isGamified ? t("titleGamified") : t("titleProductivity")}
      className={cn(
        "w-full flex flex-col gap-2.5 rounded-xl border border-neutral-700 dark:border-primary/25 bg-card/85 dark:bg-surface/40 shadow-2xs dark:shadow-none transition-colors",
        isCompact ? "p-2.5" : "p-3",
      )}
    >
      <div className="flex items-center justify-between gap-2 min-w-0">
        <Link
          href="/profile?tab=friends"
          aria-label={t("openProfileAria")}
          className="flex items-center gap-2 min-w-0 group"
        >
          <Users
            size={isCompact ? 14 : 16}
            className="text-amber-700 dark:text-gold shrink-0"
            aria-hidden="true"
          />
          <span className="text-xs font-extrabold text-neutral-100 group-hover:text-amber-700 dark:group-hover:text-gold transition-colors truncate">
            {isGamified ? t("titleGamified") : t("titleProductivity")}
          </span>
        </Link>

        <div className="flex items-center gap-1.5 shrink-0">
          {pendingCount > 0 && (
            <Link
              href="/profile?tab=friends"
              className="px-2 py-0.5 rounded-full bg-amber-500/20 dark:bg-gold/20 border border-amber-500/40 dark:border-gold/40 text-amber-800 dark:text-gold text-[10px] font-bold hover:bg-amber-500/30 transition-colors"
            >
              {t("pendingBadge", { count: pendingCount })}
            </Link>
          )}
          <Link
            href="/profile?tab=friends"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-300 hover:text-neutral-50 transition-colors"
          >
            <span>{t("viewNetwork")}</span>
            <ArrowRight size={11} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {visibleFriends.length === 0 ? (
        <Link
          href="/profile?tab=friends"
          className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-neutral-700 dark:border-primary/25 bg-surface/50 hover:border-amber-500/45 dark:hover:border-gold/45 px-2.5 py-2 transition-colors group"
        >
          <span className="text-[11px] text-neutral-400 group-hover:text-neutral-200 truncate">
            {isGamified ? t("emptyTitleGamified") : t("emptyTitleProductivity")}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/15 border border-gold/35 text-[10px] font-bold text-amber-800 dark:text-gold shrink-0">
            <UserPlus size={11} aria-hidden="true" />
            <span>{t("emptyCta")}</span>
          </span>
        </Link>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span>
              {t("friendsCount", {
                count: overview?.friendsCount ?? visibleFriends.length,
              })}
            </span>
          </div>
          <ul className="flex flex-col gap-1.5">
            {visibleFriends.map((connection) => {
              const friend = connection.user;
              const displayName = friend.fullName || friend.username;

              return (
                <li key={connection.friendshipId}>
                  <Link
                    href={`/profile/${encodeURIComponent(friend.username)}`}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 bg-surface/50 hover:bg-card-hover/90 border border-neutral-700/70 dark:border-primary/15 hover:border-amber-500/40 dark:hover:border-gold/40 transition-colors group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <UserAvatar
                        src={friend.profilePhotoUrl}
                        name={displayName}
                        size="sm"
                        hasRing={friend.isPremium}
                        frameId={
                          getAvatarFrame(friend.avatarFrame ?? undefined).id
                        }
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-neutral-100 group-hover:text-amber-700 dark:group-hover:text-gold transition-colors truncate">
                          {displayName}
                        </span>
                        <span className="text-[10px] text-neutral-400 truncate">
                          @{friend.username}
                        </span>
                      </div>
                    </div>

                    {friend.currentStreak > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-[10px] font-bold text-orange-600 dark:text-orange-300 shrink-0 tabular-nums">
                        <Flame size={10} aria-hidden="true" />
                        <span>
                          {t("streakLabel", { streak: friend.currentStreak })}
                        </span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
