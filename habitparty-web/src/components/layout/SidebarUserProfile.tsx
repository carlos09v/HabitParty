"use client";

import Link from "next/link";
import type { components } from "@/api/schema";
import { SubscriptionExpirationAlert } from "@/components/subscription/SubscriptionExpirationAlert";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { FounderBadge } from "@/components/ui/FounderBadge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useUserStore } from "@/store/userStore";
import { formatCoins } from "@/utils";
import { getLevelProgress } from "@/utils/levels";

type User = components["schemas"]["UserResponseDTO"];

interface SidebarUserProfileProps {
  initialUser?: User | null;
  onClose?: () => void;
}

export function SidebarUserProfile({
  initialUser,
  onClose,
}: SidebarUserProfileProps) {
  const storeUser = useUserStore((s) => s.user);
  const user = storeUser || initialUser;

  const currentXp = user?.totalXp ?? 0;
  const progress = getLevelProgress(currentXp);
  const displayName = user?.fullName || user?.username || "Aventureiro";
  const levelTitle =
    user?.currentLevelTitle ||
    progress.currentLevel.title ||
    (user?.isPremium ? "Membro Premium" : "Novato");

  const targetXp = progress.targetXp;
  const remainingXp = progress.remainingXp;
  const xpPercent = progress.percent;
  const nextLevelTitle = progress.nextLevel.title;
  const coins = user?.currentCoins ?? 0;

  return (
    <footer className="p-3.5 border-t border-primary/30 bg-primary-dark/20 z-10">
      <Link
        href="/settings"
        onClick={onClose}
        className="flex items-center gap-2.5 mb-2 group rounded-lg p-1 -m-1 hover:bg-surface-hover/70 dark:hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
        title={`Ver configurações de perfil (${displayName})`}
      >
        <UserAvatar
          src={user?.profilePhotoUrl}
          name={displayName}
          size="sm"
          hasRing={Boolean(user?.isPremium)}
          className="group-hover:scale-105 transition-transform"
        />
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="text-body-s font-bold text-neutral-50 truncate group-hover:text-gold transition-colors"
              title={displayName}
            >
              {displayName}
            </span>
            {user?.isFounder && <FounderBadge size="sm" />}
          </div>
          <span className="text-tiny text-neutral-300 truncate">
            {levelTitle}
          </span>
        </div>
      </Link>

      <div className="flex items-center justify-between gap-2 mt-2">
        <div className="flex-1 min-w-0">
          <div
            className="h-1.5 w-full bg-surface-hover/80 dark:bg-neutral-900 border border-primary/10 dark:border-transparent rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={currentXp}
            aria-valuemin={0}
            aria-valuemax={targetXp}
            title={
              !progress.isMaxLevel
                ? `Progresso: ${currentXp}/${targetXp} XP (${xpPercent}%). Faltam ${remainingXp} XP para ${nextLevelTitle}.`
                : `Progresso: ${currentXp} XP (Nível Máximo - ${progress.currentLevel.title})`
            }
          >
            <div
              className="h-full bg-gold rounded-full transition-all duration-500 ease-out"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
          <p
            className="text-tiny text-neutral-300 text-center mt-0.5"
            title={
              !progress.isMaxLevel
                ? `Faltam ${remainingXp} XP para ${nextLevelTitle}`
                : "Nível Máximo"
            }
          >
            {!progress.isMaxLevel
              ? `(${currentXp}/${targetXp} XP)`
              : `(${currentXp} XP - Nível Máximo)`}
          </p>
        </div>

        <div
          className="flex items-center gap-1 shrink-0 max-w-[90px]"
          title={`${formatCoins(coins)} moedas`}
        >
          <CoinIcon size={15} withGlow />
          <span className="text-body-s font-bold text-neutral-50 truncate">
            {formatCoins(coins, { compact: true })}
          </span>
        </div>
      </div>

      {user?.isPremium && (
        <SubscriptionExpirationAlert user={user} className="mt-2.5" />
      )}
    </footer>
  );
}
