import {
  Ban,
  Check,
  Clock,
  Edit3,
  Lock,
  ShieldCheck,
  UserCheck,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { PublicUserShowcaseData } from "@/types/social";

interface PublicFriendActionButtonsProps {
  data: PublicUserShowcaseData;
  isMutating: boolean;
  onSendRequest: () => void;
  onRespondRequest: (accept: boolean) => void;
  onRemoveConnection: (wasBlocked?: boolean) => void;
  onBlockUser: () => void;
}

export function PublicFriendActionButtons({
  data,
  isMutating,
  onSendRequest,
  onRespondRequest,
  onRemoveConnection,
  onBlockUser,
}: PublicFriendActionButtonsProps) {
  const t = useTranslations("showcase.publicProfile");
  const tFriends = useTranslations("showcase.friends");
  const targetName = data.user.fullName || `@${data.user.username}`;

  const blockButton = (
    <button
      type="button"
      disabled={isMutating}
      onClick={onBlockUser}
      aria-label={tFriends("blockUserAria", { name: targetName })}
      title={tFriends("blockUserAria", { name: targetName })}
      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border border-red-500/35 bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-300 transition-colors cursor-pointer"
    >
      <Ban size={13} aria-hidden="true" />
    </button>
  );

  switch (data.relationshipStatus) {
    case "SELF":
      return (
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-gold text-on-gold hover:bg-amber-300 shadow-glow-gold-xs transition-colors"
        >
          <Edit3 size={13} aria-hidden="true" />
          <span>{t("openOwnEditor")}</span>
        </Link>
      );

    case "NONE":
      return (
        <>
          {data.user.friendRequestPolicy === "EVERYONE" ? (
            <button
              type="button"
              disabled={isMutating}
              onClick={onSendRequest}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-gold text-on-gold hover:bg-amber-300 shadow-glow-gold-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              <UserPlus size={13} aria-hidden="true" />
              <span>{tFriends("addButton")}</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-neutral-700 bg-surface/60 text-neutral-300">
              <Lock size={12} aria-hidden="true" />
              <span>
                {data.user.friendRequestPolicy === "FRIEND_CODE_ONLY"
                  ? tFriends("requestsCodeOnly")
                  : tFriends("requestsCannotSend")}
              </span>
            </span>
          )}
          {blockButton}
        </>
      );

    case "PENDING_SENT":
      return (
        <>
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border border-neutral-700 bg-surface text-neutral-300">
            <Clock size={13} aria-hidden="true" />
            <span>{tFriends("statusPendingSent")}</span>
          </span>
          <button
            type="button"
            disabled={isMutating}
            onClick={() => onRemoveConnection(false)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-neutral-700 bg-card hover:bg-surface-hover text-neutral-200 transition-colors cursor-pointer"
          >
            <X size={13} aria-hidden="true" />
            <span>{tFriends("cancelRequestBtn")}</span>
          </button>
        </>
      );

    case "PENDING_RECEIVED":
      return (
        <>
          <button
            type="button"
            disabled={isMutating}
            onClick={() => onRespondRequest(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-700 text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors cursor-pointer"
          >
            <Check size={13} aria-hidden="true" />
            <span>{tFriends("acceptBtn")}</span>
          </button>
          <button
            type="button"
            disabled={isMutating}
            onClick={() => onRespondRequest(false)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-neutral-700 bg-surface hover:bg-surface-hover text-neutral-200 transition-colors cursor-pointer"
          >
            <X size={13} aria-hidden="true" />
            <span>{tFriends("declineBtn")}</span>
          </button>
          {blockButton}
        </>
      );

    case "FRIENDS":
      return (
        <>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-500/35 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
            <UserCheck size={13} aria-hidden="true" />
            <span>{tFriends("statusFriends")}</span>
          </span>
          <button
            type="button"
            disabled={isMutating}
            onClick={() => onRemoveConnection(false)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-neutral-700 bg-surface/80 hover:bg-surface text-neutral-300 hover:text-red-700 dark:hover:text-red-400 transition-colors cursor-pointer"
          >
            <UserMinus size={13} aria-hidden="true" />
            <span>{tFriends("removeFriendBtn")}</span>
          </button>
          {blockButton}
        </>
      );

    case "BLOCKED_BY_VIEWER":
      return (
        <button
          type="button"
          disabled={isMutating}
          onClick={() => onRemoveConnection(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-red-500/40 bg-red-500/15 text-red-700 dark:text-red-300 hover:bg-red-500/25 transition-colors cursor-pointer"
        >
          <ShieldCheck size={13} aria-hidden="true" />
          <span>{tFriends("unblockBtn")}</span>
        </button>
      );

    default:
      return null;
  }
}
