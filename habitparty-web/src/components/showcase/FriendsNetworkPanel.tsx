"use client";

import { KeyRound, Settings } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { type FormEvent, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  getFriendsOverviewAction,
  searchSocialUsersAction,
} from "@/actions/socialActions";
import { FriendCodeCard } from "@/components/social/FriendCodeCard";
import { useFriendshipMutations } from "@/hooks/useFriendshipMutations";
import type { FriendsOverviewData, SearchSocialUserItem } from "@/types/social";
import { AcceptedFriendsGrid } from "./friends/AcceptedFriendsGrid";
import { FriendRequestsSection } from "./friends/FriendRequestsSection";
import { FriendSearchSection } from "./friends/FriendSearchSection";

interface FriendsNetworkPanelProps {
  initialOverview: FriendsOverviewData | null;
  onOverviewUpdated?: (next: FriendsOverviewData) => void;
}

export function FriendsNetworkPanel({
  initialOverview,
  onOverviewUpdated,
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
    const trimmedQuery = searchQuery.trim();
    const [res, searchRes] = await Promise.all([
      getFriendsOverviewAction(),
      trimmedQuery.length >= 2
        ? searchSocialUsersAction(searchQuery)
        : Promise.resolve(null),
    ]);
    if (res.success && res.data) {
      setOverview(res.data);
      onOverviewUpdated?.(res.data);
    }
    if (searchRes?.success) {
      setSearchResults(searchRes.results);
    }
  };

  const friendCode = overview?.myFriendCode ?? "";

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
      <FriendCodeCard
        variant="card"
        friendCode={friendCode}
        title={t("myCodeTitle")}
        description={t("myCodeDesc", { code: friendCode || "HP-......" })}
        copyLabel={t("copyCode")}
        regenerateLabel={t("regenerateCode")}
        messages={{
          copied: t("copiedCode", { code: friendCode }),
          copyError: t("loadError"),
          regenerated: t("regenerateSuccess"),
          regenerateError: t("loadError"),
        }}
        onRegenerated={(nextCode) => {
          setOverview((prev) => {
            if (!prev) return prev;
            const next = { ...prev, myFriendCode: nextCode };
            onOverviewUpdated?.(next);
            return next;
          });
        }}
        leadingIcon={
          <div className="w-11 h-11 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-center text-amber-800 dark:text-gold shrink-0">
            <KeyRound size={20} aria-hidden="true" />
          </div>
        }
        titleBadge={
          overview ? (
            <span className="px-2 py-0.5 rounded-full bg-surface border border-neutral-700 dark:border-primary/25 text-[11px] font-bold text-neutral-300 tabular-nums">
              {t("networkCapacity", {
                count: overview.friendsCount,
                max: overview.maxFriends,
              })}
            </span>
          ) : undefined
        }
        extraActions={
          <Link
            href="/settings?tab=privacy"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-neutral-700 dark:border-primary/25 bg-surface/60 hover:bg-surface text-neutral-300 hover:text-neutral-50 transition-colors"
          >
            <Settings size={14} aria-hidden="true" />
            <span>{t("privacyShortcut")}</span>
          </Link>
        }
      />

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
