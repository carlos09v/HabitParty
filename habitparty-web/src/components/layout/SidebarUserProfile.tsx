"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { components } from "@/api/schema";
import { SubscriptionExpirationAlert } from "@/components/subscription/SubscriptionExpirationAlert";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { FounderBadge } from "@/components/ui/FounderBadge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import { useUserStore } from "@/store/userStore";
import { formatCoins } from "@/utils";
import { getLevelProgress, localizeLevelTitle } from "@/utils/levels";

type User = components["schemas"]["UserResponseDTO"];

interface SidebarUserProfileProps {
  initialUser?: User | null;
  onClose?: () => void;
}

export function SidebarUserProfile({
  initialUser,
  onClose,
}: SidebarUserProfileProps) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("userProfile");
  const { isGamified } = useExperienceMode();
  const storeUser = useUserStore((s) => s.user);
  const user = storeUser || initialUser;

  const currentXp = user?.totalXp ?? 0;
  const progress = getLevelProgress(currentXp);
  const defaultFallbackName = isGamified
    ? t("defaultNameGamified")
    : t("defaultNameProductivity");
  const displayName = user?.fullName || user?.username || defaultFallbackName;
  const rawLevelTitle =
    user?.currentLevelTitle ||
    progress.currentLevel.title ||
    (user?.isPremium ? "PREMIUM_MEMBER" : "NOVICE");
  const levelTitle = localizeLevelTitle(rawLevelTitle, locale);

  const targetXp = progress.targetXp;
  const remainingXp =
    user?.xpToNextLevel !== undefined
      ? user.xpToNextLevel
      : progress.remainingXp;
  const xpPercent = progress.percent;
  const nextLevelTitle = localizeLevelTitle(
    user?.nextLevelTitle || progress.nextLevel.title,
    locale,
  );
  const coins = user?.currentCoins ?? 0;

  return (
    <footer className="p-3.5 border-t border-primary/30 bg-primary-dark/20 z-10">
      <Link
        href="/settings"
        onClick={onClose}
        className="flex items-center gap-2.5 mb-2 group rounded-lg p-1 -m-1 hover:bg-surface-hover/70 dark:hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
        title={t("settingsTitle", { name: displayName })}
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

      <div className="flex flex-col gap-1.5 mt-2.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-tiny font-semibold text-neutral-300 tabular-nums leading-none truncate"
            title={
              !progress.isMaxLevel
                ? t("remainingXpTitle", {
                    xp: remainingXp,
                    nextTitle: nextLevelTitle,
                  })
                : t("maxLevelTitle")
            }
          >
            {!progress.isMaxLevel
              ? `${currentXp} / ${targetXp} XP`
              : t("xpMaxLabel", { xp: currentXp })}
          </span>

          <div
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/10 border border-gold/25 shrink-0 max-w-[105px]"
            title={t("coinsTitle", {
              coins: formatCoins(coins, { locale }),
            })}
          >
            <CoinIcon size={13} withGlow className="shrink-0" />
            <span className="text-xs font-bold text-neutral-50 leading-none tabular-nums truncate">
              {formatCoins(coins, { compact: true, locale })}
            </span>
          </div>
        </div>

        <div
          className="h-2 w-full bg-surface-hover/80 dark:bg-neutral-900 border border-primary/15 dark:border-white/5 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={currentXp}
          aria-valuemin={0}
          aria-valuemax={targetXp}
          title={
            !progress.isMaxLevel
              ? t("progressTitle", {
                  currentXp,
                  targetXp,
                  percent: xpPercent,
                  remainingXp,
                  nextTitle: nextLevelTitle,
                })
              : t("progressMaxTitle", { currentXp, levelTitle })
          }
        >
          <div
            className="h-full bg-gold rounded-full transition-all duration-500 ease-out shadow-glow-gold-xs"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
      </div>

      {user?.isPremium && (
        <SubscriptionExpirationAlert user={user} className="mt-2.5" />
      )}
    </footer>
  );
}
