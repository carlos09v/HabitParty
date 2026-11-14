"use client";

import { Check, Copy, KeyRound, RefreshCw, Settings } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { type FormEvent, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  getFriendsOverviewAction,
  searchSocialUsersAction,
} from "@/actions/socialActions";
import { useFriendCodeActions } from "@/hooks/useFriendCodeActions";
import { useFriendshipMutations } from "@/hooks/useFriendshipMutations";
import type { FriendsOverviewData, SearchSocialUserItem } from "@/types/social";
import { cn } from "@/utils";
import { AcceptedFriendsGrid } from "./friends/AcceptedFriendsGrid";
import { FriendRequestsSection } from "./friends/FriendRequestsSection";
import { FriendSearchSection } from "./friends/FriendSearchSection";

interface FriendsNetworkPanelProps {
  initialOverview: FriendsOverviewData | null;
}

export function FriendsNetworkPanel({
  initialOverview,
}: FriendsNetworkPanelProps) {
  const t = useTranslations("showcase.friends");

  const [overview, setOverview] = useState<FriendsOverviewData | null>(
    initialOverview,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    SearchSocialUserItem[] | null
  >(null);

  const [isSearching, startSearchTransition] = useTransition();

  useEffect(() => {
    setOverview(initialOverview);
  }, [initialOverview]);

  const refreshOverview = async () => {
    const res = await getFriendsOverviewAction();
    if (res.success && res.data) {
      setOverview(res.data);
    }
    if (searchQuery.trim().length >= 2) {
      const searchRes = await searchSocialUsersAction(searchQuery);
      if (searchRes.success) {
        setSearchResults(searchRes.results);
      }
    }
  };

  const friendCode = overview?.myFriendCode ?? "";

  const { copiedCode, isRegenerating, handleCopyCode, handleRegenerateCode } =
    useFriendCodeActions({
      friendCode,
      messages: {
        copied: t("copiedCode", { code: friendCode }),
        copyError: t("loadError"),
        regenerated: t("regenerateSuccess"),
        regenerateError: t("loadError"),
      },
      onRegenerated: (nextCode) => {
        setOverview((prev) =>
          prev ? { ...prev, myFriendCode: nextCode } : prev,
        );
      },
    });

  const {
    isMutating,
    sendFriendRequest,
    respondFriendRequest,
    removeConnection,
    blockUser,
  } = useFriendshipMutations({ onMutated: refreshOverview });

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      toast.info(t("searchMinChars"));
      return;
    }

    startSearchTransition(async () => {
      const res = await searchSocialUsersAction(trimmed);
      if (!res.success) {
        toast.error(res.error || t("searchError"));
        return;
      }
      setSearchResults(res.results);
    });
  };

  const handleSendSearchRequest = (item: SearchSocialUserItem) => {
    const normalizedCodeQuery = searchQuery.trim().toUpperCase();
    sendFriendRequest(
      item.matchedByFriendCode
        ? { friendCode: normalizedCodeQuery }
        : { username: item.user.username },
      item.user.username,
    );
  };

  const incoming = overview?.incomingRequests ?? [];
  const outgoing = overview?.outgoingRequests ?? [];
  const friends = overview?.friends ?? [];
  const blocked = overview?.blockedUsers ?? [];

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-neutral-700 dark:border-primary/30 bg-card dark:bg-surface/55 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-center text-amber-800 dark:text-gold shrink-0">
            <KeyRound size={20} aria-hidden="true" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-body-m font-extrabold text-neutral-100">
                {t("myCodeTitle")}
              </h2>
              {overview && (
                <span className="px-2 py-0.5 rounded-full bg-surface border border-neutral-700 dark:border-primary/25 text-[11px] font-bold text-neutral-300 tabular-nums">
                  {t("networkCapacity", {
                    count: overview.friendsCount,
                    max: overview.maxFriends,
                  })}
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              {t("myCodeDesc", { code: friendCode || "HP-......" })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <code className="px-3.5 py-2 rounded-xl bg-background border border-neutral-700 dark:border-primary/35 text-sm font-mono font-black tracking-widest text-amber-800 dark:text-gold select-all">
            {friendCode || "HP-......"}
          </code>

          <button
            type="button"
            onClick={handleCopyCode}
            disabled={!friendCode}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-neutral-700 dark:border-primary/30 bg-surface/80 hover:bg-surface text-neutral-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            {copiedCode ? (
              <Check
                size={14}
                className="text-emerald-700 dark:text-emerald-400"
                aria-hidden="true"
              />
            ) : (
              <Copy size={14} aria-hidden="true" />
            )}
            <span>{t("copyCode")}</span>
          </button>

          <button
            type="button"
            onClick={handleRegenerateCode}
            disabled={isRegenerating}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-gold transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw
              size={14}
              className={cn(isRegenerating && "animate-spin")}
              aria-hidden="true"
            />
            <span>{t("regenerateCode")}</span>
          </button>

          <Link
            href="/settings?tab=privacy"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-neutral-700 dark:border-primary/25 bg-surface/60 hover:bg-surface text-neutral-300 hover:text-neutral-50 transition-colors"
          >
            <Settings size={14} aria-hidden="true" />
            <span>{t("privacyShortcut")}</span>
          </Link>
        </div>
      </section>

      <FriendSearchSection
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearch={handleSearch}
        searchResults={searchResults}
        isSearching={isSearching}
        isMutating={isMutating}
        onSendRequest={handleSendSearchRequest}
        onAcceptRequest={(friendshipId) =>
          respondFriendRequest(friendshipId, true)
        }
      />

      <FriendRequestsSection
        incoming={incoming}
        outgoing={outgoing}
        blocked={blocked}
        isMutating={isMutating}
        onRespondRequest={respondFriendRequest}
        onRemoveConnection={removeConnection}
        onBlockUser={blockUser}
      />

      <AcceptedFriendsGrid
        friends={friends}
        isMutating={isMutating}
        onRemoveFriend={(friendshipId) => removeConnection(friendshipId, false)}
        onBlockUser={blockUser}
      />
    </div>
  );
}
