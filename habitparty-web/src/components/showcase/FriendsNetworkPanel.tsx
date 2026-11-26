"use client";

import { KeyRound, Settings } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import {
  getFriendsOverviewAction,
  searchSocialUsersAction,
} from "@/actions/socialActions";
import { FriendCodeCard } from "@/components/social/FriendCodeCard";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import { useFriendshipMutations } from "@/hooks/useFriendshipMutations";
import type { FriendsOverviewData, SearchSocialUserItem } from "@/types/social";
import { AcceptedFriendsGrid } from "./friends/AcceptedFriendsGrid";
import { FriendRequestsSection } from "./friends/FriendRequestsSection";
import { FriendSearchSection } from "./friends/FriendSearchSection";

const ConfirmationModal = dynamic(
  () =>
    import("@/components/ui/ConfirmationModal").then(
      (mod) => mod.ConfirmationModal,
    ),
  { ssr: false },
);

interface FriendsNetworkPanelProps {
  initialOverview: FriendsOverviewData | null;
  onOverviewUpdated?: (next: FriendsOverviewData) => void;
}

type PendingConfirmation =
  | {
      type: "remove";
      friendshipId: string;
      displayName: string;
      username: string;
    }
  | {
      type: "block";
      userId: string;
      displayName: string;
      username: string;
    };

export function FriendsNetworkPanel({
  initialOverview,
  onOverviewUpdated,
}: FriendsNetworkPanelProps) {
  const t = useTranslations("showcase.friends");

  const [overview, setOverview] = useState<FriendsOverviewData | null>(
    initialOverview,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    SearchSocialUserItem[] | null
  >(null);
  const confirmDialog = useConfirmationDialog<PendingConfirmation>();

  const [isSearching, startSearchTransition] = useTransition();
  const searchRequestIdRef = useRef(0);

  useEffect(() => {
    setOverview(initialOverview);
  }, [initialOverview]);

  const refreshOverview = async () => {
    const activeQuery = submittedSearchQuery.trim();
    const requestId =
      activeQuery.length >= 2 ? ++searchRequestIdRef.current : 0;
    const [res, searchRes] = await Promise.all([
      getFriendsOverviewAction(),
      activeQuery.length >= 2
        ? searchSocialUsersAction(activeQuery)
        : Promise.resolve(null),
    ]);
    if (res.success && res.data) {
      setOverview(res.data);
      onOverviewUpdated?.(res.data);
    }
    if (searchRes?.success && requestId === searchRequestIdRef.current) {
      setSearchResults(searchRes.data);
    }
  };

  const friendCode = overview?.myFriendCode ?? "";

  const {
    isTargetPending,
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

    const requestId = ++searchRequestIdRef.current;
    startSearchTransition(async () => {
      const res = await searchSocialUsersAction(trimmed);
      if (requestId !== searchRequestIdRef.current) return;
      if (!res.success) {
        toast.error(res.error || t("searchError"));
        return;
      }
      setSubmittedSearchQuery(trimmed);
      setSearchResults(res.data);
    });
  };

  const handleClearSearch = () => {
    searchRequestIdRef.current += 1;
    setSearchQuery("");
    setSubmittedSearchQuery("");
    setSearchResults(null);
  };

  const handleSendSearchRequest = (item: SearchSocialUserItem) => {
    const normalizedCodeQuery = submittedSearchQuery.trim().toUpperCase();
    sendFriendRequest(
      item.matchedByFriendCode
        ? { friendCode: normalizedCodeQuery }
        : { username: item.user.username },
      item.user.username,
      item.user.id,
    );
  };

  const handleConfirmDestructiveAction = () => {
    confirmDialog.confirm((action) => {
      if (action.type === "remove") {
        removeConnection(action.friendshipId, false);
      } else {
        blockUser(action.userId);
      }
    });
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
        regeneratingLabel={t("regeneratingCode")}
        confirmRegenerate={{
          title: t("confirmRegenerateTitle"),
          description: t("confirmRegenerateDesc"),
          confirmLabel: t("confirmRegenerateBtn"),
          cancelLabel: t("confirmCancelBtn"),
        }}
        messages={{
          copied: t("copiedCode", { code: friendCode }),
          copyError: t("copyCodeError"),
          regenerated: t("regenerateSuccess"),
          regenerateError: t("regenerateError"),
        }}
        onRegenerated={(nextCode) => {
          if (!overview) return;
          const next = { ...overview, myFriendCode: nextCode };
          setOverview(next);
          onOverviewUpdated?.(next);
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
        onClearSearch={handleClearSearch}
        onSearch={handleSearch}
        searchResults={searchResults}
        isSearching={isSearching}
        isTargetPending={isTargetPending}
        onSendRequest={handleSendSearchRequest}
        onAcceptRequest={(friendshipId) =>
          respondFriendRequest(friendshipId, true)
        }
      />

      <FriendRequestsSection
        incoming={incoming}
        outgoing={outgoing}
        blocked={blocked}
        isTargetPending={isTargetPending}
        onRespondRequest={respondFriendRequest}
        onRemoveConnection={removeConnection}
        onBlockUser={(user) =>
          confirmDialog.request({
            type: "block",
            userId: user.id,
            displayName: user.fullName || user.username,
            username: user.username,
          })
        }
      />

      <AcceptedFriendsGrid
        friends={friends}
        isTargetPending={isTargetPending}
        onRemoveFriend={(conn) =>
          confirmDialog.request({
            type: "remove",
            friendshipId: conn.friendshipId,
            displayName: conn.user.fullName || conn.user.username,
            username: conn.user.username,
          })
        }
        onBlockUser={(user) =>
          confirmDialog.request({
            type: "block",
            userId: user.id,
            displayName: user.fullName || user.username,
            username: user.username,
          })
        }
      />

      {confirmDialog.pending && (
        <ConfirmationModal
          isOpen
          onClose={confirmDialog.close}
          onConfirm={handleConfirmDestructiveAction}
          variant="danger"
          title={
            confirmDialog.pending.type === "block"
              ? t("confirmBlockTitle", {
                  username: confirmDialog.pending.username,
                })
              : t("confirmRemoveTitle", {
                  name: confirmDialog.pending.displayName,
                })
          }
          description={
            confirmDialog.pending.type === "block"
              ? t("confirmBlockDesc", {
                  username: confirmDialog.pending.username,
                })
              : t("confirmRemoveDesc", {
                  username: confirmDialog.pending.username,
                })
          }
          confirmText={
            confirmDialog.pending.type === "block"
              ? t("blockBtn")
              : t("removeFriendBtn")
          }
          cancelText={t("confirmCancelBtn")}
        />
      )}
    </div>
  );
}
