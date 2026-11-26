import { Ban, Check, ShieldBan, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FriendConnectionItem, SocialUserSummary } from "@/types/social";
import { FriendIdentityCell } from "./FriendIdentityCell";

interface FriendRequestsSectionProps {
  incoming: FriendConnectionItem[];
  outgoing: FriendConnectionItem[];
  blocked: FriendConnectionItem[];
  isTargetPending: (targetId?: string | null) => boolean;
  onRespondRequest: (friendshipId: string, accept: boolean) => void;
  onRemoveConnection: (friendshipId: string, wasBlocked?: boolean) => void;
  onBlockUser: (user: SocialUserSummary) => void;
}

export function FriendRequestsSection({
  incoming,
  outgoing,
  blocked,
  isTargetPending,
  onRespondRequest,
  onRemoveConnection,
  onBlockUser,
}: FriendRequestsSectionProps) {
  const t = useTranslations("showcase.friends");

  return (
    <>
      {incoming.length > 0 && (
        <section className="rounded-2xl border border-amber-500/40 dark:border-gold/35 bg-amber-500/[0.04] dark:bg-surface/55 p-5 flex flex-col gap-3">
          <h2 className="text-body-m font-extrabold text-neutral-100">
            {t("incomingTitle", { count: incoming.length })}
          </h2>
          <ul className="flex flex-col gap-2.5">
            {incoming.map((conn) => {
              const isItemBusy =
                isTargetPending(conn.friendshipId) ||
                isTargetPending(conn.user.id);
              const targetName = conn.user.fullName || `@${conn.user.username}`;
              return (
                <li
                  key={conn.friendshipId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-neutral-700/80 dark:border-primary/20 bg-card/80 p-3.5"
                >
                  <FriendIdentityCell user={conn.user} />
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={isItemBusy}
                      aria-label={t("acceptUserAria", { name: targetName })}
                      onClick={() => onRespondRequest(conn.friendshipId, true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-extrabold bg-emerald-700 text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors cursor-pointer disabled:opacity-55"
                    >
                      <Check size={14} aria-hidden="true" />
                      <span>{t("acceptBtn")}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isItemBusy}
                      aria-label={t("declineUserAria", { name: targetName })}
                      onClick={() => onRespondRequest(conn.friendshipId, false)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-neutral-700 bg-surface hover:bg-surface-hover text-neutral-200 transition-colors cursor-pointer disabled:opacity-55"
                    >
                      <X size={14} aria-hidden="true" />
                      <span>{t("declineBtn")}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isItemBusy}
                      onClick={() => onBlockUser(conn.user)}
                      aria-label={t("blockUserAria", { name: targetName })}
                      title={t("blockUserAria", { name: targetName })}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-red-500/35 bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-300 transition-colors cursor-pointer disabled:opacity-55"
                    >
                      <Ban size={13} aria-hidden="true" />
                      <span>{t("blockBtn")}</span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {outgoing.length > 0 && (
        <section className="rounded-2xl border border-neutral-700 dark:border-primary/20 bg-card dark:bg-surface/45 p-5 flex flex-col gap-3">
          <h2 className="text-body-m font-extrabold text-neutral-100">
            {t("outgoingTitle", { count: outgoing.length })}
          </h2>
          <ul className="flex flex-col gap-2.5">
            {outgoing.map((conn) => {
              const isItemBusy = isTargetPending(conn.friendshipId);
              const targetName = conn.user.fullName || `@${conn.user.username}`;
              return (
                <li
                  key={conn.friendshipId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-neutral-700/80 dark:border-primary/15 bg-surface/45 p-3.5"
                >
                  <FriendIdentityCell user={conn.user} />
                  <button
                    type="button"
                    disabled={isItemBusy}
                    aria-label={t("cancelRequestUserAria", {
                      name: targetName,
                    })}
                    onClick={() => onRemoveConnection(conn.friendshipId, false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-neutral-700 bg-card hover:bg-surface-hover text-neutral-300 hover:text-red-700 dark:hover:text-red-400 transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-55"
                  >
                    <X size={14} aria-hidden="true" />
                    <span>{t("cancelRequestBtn")}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {blocked.length > 0 && (
        <section className="rounded-2xl border border-red-500/25 bg-card dark:bg-surface/40 p-5 flex flex-col gap-3">
          <h2 className="text-body-m font-extrabold text-neutral-200 flex items-center gap-2">
            <ShieldBan
              size={17}
              className="text-red-700 dark:text-red-400"
              aria-hidden="true"
            />
            <span>{t("blockedTitle", { count: blocked.length })}</span>
          </h2>
          <ul className="flex flex-col gap-2">
            {blocked.map((conn) => {
              const isItemBusy = isTargetPending(conn.friendshipId);
              const targetName = conn.user.fullName || `@${conn.user.username}`;
              return (
                <li
                  key={conn.friendshipId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-neutral-700/80 bg-surface/40 p-3"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-neutral-200 block truncate">
                      {conn.user.fullName || conn.user.username}
                    </span>
                    <span className="text-[11px] text-neutral-400 truncate block">
                      @{conn.user.username}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={isItemBusy}
                    aria-label={t("unblockUserAria", { name: targetName })}
                    onClick={() => onRemoveConnection(conn.friendshipId, true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border border-neutral-700 bg-card hover:bg-surface-hover text-neutral-200 transition-colors cursor-pointer shrink-0 disabled:opacity-55"
                  >
                    {t("unblockBtn")}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}
