import {
  Check,
  Clock,
  ExternalLink,
  Search,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { FormEvent } from "react";
import type { SearchSocialUserItem } from "@/types/social";
import { FriendIdentityCell } from "./FriendIdentityCell";

interface FriendSearchSectionProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onClearSearch: () => void;
  onSearch: (e: FormEvent) => void;
  searchResults: SearchSocialUserItem[] | null;
  isSearching: boolean;
  isTargetPending: (targetId?: string | null) => boolean;
  onSendRequest: (item: SearchSocialUserItem) => void;
  onAcceptRequest: (friendshipId: string) => void;
}

export function FriendSearchSection({
  searchQuery,
  onSearchQueryChange,
  onClearSearch,
  onSearch,
  searchResults,
  isSearching,
  isTargetPending,
  onSendRequest,
  onAcceptRequest,
}: FriendSearchSectionProps) {
  const t = useTranslations("showcase.friends");

  return (
    <section className="rounded-2xl border border-neutral-700 dark:border-primary/25 bg-card dark:bg-surface/45 p-5 flex flex-col gap-4">
      <h2 className="text-body-m font-extrabold text-neutral-100 flex items-center gap-2">
        <UserPlus
          size={18}
          className="text-amber-700 dark:text-gold"
          aria-hidden="true"
        />
        <span>{t("searchTitle")}</span>
      </h2>

      <search>
        <form onSubmit={onSearch} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchTitle")}
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              className="w-full h-10 pl-10 pr-9 rounded-xl bg-surface/70 border border-neutral-700 dark:border-primary/25 text-base sm:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-gold"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={onClearSearch}
                aria-label={t("clearSearchAria")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-neutral-400 hover:text-neutral-100 cursor-pointer"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="h-10 px-5 rounded-xl text-xs font-extrabold bg-gold text-on-gold hover:bg-amber-300 shadow-glow-gold-xs transition-colors cursor-pointer disabled:opacity-60 shrink-0"
          >
            {isSearching ? t("searching") : t("searchButton")}
          </button>
        </form>
      </search>

      {searchResults !== null && (
        <div className="flex flex-col gap-2">
          {searchResults.length === 0 ? (
            <p className="text-xs text-neutral-400 py-2">{t("searchEmpty")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {searchResults.map((item) => {
                const isItemBusy =
                  isTargetPending(item.user.id) ||
                  isTargetPending(item.friendshipId);
                const targetName =
                  item.user.fullName || `@${item.user.username}`;

                return (
                  <li
                    key={item.user.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-neutral-700/80 dark:border-primary/20 bg-surface/55 p-3"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FriendIdentityCell user={item.user} />
                      {item.matchedByFriendCode && (
                        <span className="px-2 py-0.5 rounded-full bg-gold/15 border border-gold/40 text-[10px] font-bold text-amber-800 dark:text-gold shrink-0">
                          {t("matchedCodeBadge")}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/profile/${encodeURIComponent(item.user.username)}`}
                        aria-label={t("viewProfileAria", { name: targetName })}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-neutral-700 bg-card hover:bg-surface-hover text-neutral-200 transition-colors"
                      >
                        <ExternalLink size={12} aria-hidden="true" />
                        <span>{t("viewProfileBtn")}</span>
                      </Link>

                      {item.relationshipStatus === "FRIENDS" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          <UserCheck size={13} aria-hidden="true" />
                          <span>{t("statusFriends")}</span>
                        </span>
                      ) : item.relationshipStatus === "PENDING_SENT" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface border border-neutral-600 text-xs font-bold text-neutral-300">
                          <Clock size={13} aria-hidden="true" />
                          <span>{t("statusPendingSent")}</span>
                        </span>
                      ) : item.relationshipStatus === "PENDING_RECEIVED" &&
                        item.friendshipId ? (
                        <button
                          type="button"
                          disabled={isItemBusy}
                          aria-label={t("acceptUserAria", { name: targetName })}
                          onClick={() =>
                            onAcceptRequest(item.friendshipId as string)
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-extrabold bg-emerald-700 text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors cursor-pointer disabled:opacity-55"
                        >
                          <Check size={13} aria-hidden="true" />
                          <span>{t("acceptBtn")}</span>
                        </button>
                      ) : item.canSendRequest ? (
                        <button
                          type="button"
                          disabled={isItemBusy}
                          aria-label={t("addUserAria", { name: targetName })}
                          onClick={() => onSendRequest(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-extrabold bg-gold text-on-gold hover:bg-amber-300 transition-colors cursor-pointer disabled:opacity-55"
                        >
                          <UserPlus size={13} aria-hidden="true" />
                          <span>{t("addButton")}</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-medium text-neutral-400">
                          {item.user.friendRequestPolicy === "FRIEND_CODE_ONLY"
                            ? t("requestsCodeOnly")
                            : t("requestsCannotSend")}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
