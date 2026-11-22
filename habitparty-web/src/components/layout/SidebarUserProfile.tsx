"use client";

import { Swords, Target, Trophy } from "lucide-react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useEffect } from "react";
import { SubscriptionExpirationAlert } from "@/components/subscription/SubscriptionExpirationAlert";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { FounderBadge } from "@/components/ui/FounderBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import { useActiveAvatarFrame } from "@/store/avatarFrameStore";
import { useProgressStore } from "@/store/progressStore";
import { useUserStore } from "@/store/userStore";
import type { UserResponseDTO } from "@/types/user";
import { cn, formatCoins, resolveUserLevelState } from "@/utils";
import { formatCreditsLeisureEquivalence } from "@/utils/rewardEconomy";

type User = UserResponseDTO;

interface SidebarUserProfileProps {
  initialUser?: User | null;
  onClose?: () => void;
}

interface ProfileLinkContentProps {
  isActive: boolean;
  label: string;
  children: ReactNode;
}

function ProfileLinkContent({
  isActive,
  label,
  children,
}: ProfileLinkContentProps) {
  const { pending } = useLinkStatus();
  const isHighlighted = isActive || pending;

  useEffect(() => {
    if (!pending) return;

    const taskId = "nav:/profile";
    const timerId = window.setTimeout(() => {
      useProgressStore.getState().start(taskId, label);
    }, 120);

    return () => {
      window.clearTimeout(timerId);
      useProgressStore.getState().done(taskId);
    };
  }, [pending, label]);

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg p-1.5 -m-1.5 transition-colors",
        isHighlighted
          ? "bg-primary/15 dark:bg-gold/10 ring-1 ring-primary/30 dark:ring-gold/30"
          : "group-hover:bg-surface-hover/70 dark:group-hover:bg-white/5",
      )}
    >
      {children}
    </div>
  );
}

export function SidebarUserProfile({
  initialUser,
  onClose,
}: SidebarUserProfileProps) {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const isProfileActive = pathname === "/profile";
  const t = useTranslations("userProfile");
  const { isGamified } = useExperienceMode();
  const storeUser = useUserStore((s) => s.user);
  const user = storeUser || initialUser;
  const activeFrameId = useActiveAvatarFrame();
  const achievementPoints = user?.achievementPoints ?? 0;

  const { currentXp, progress, levelTitle, nextLevelTitle, remainingXp } =
    resolveUserLevelState(user, locale, isGamified);
  const defaultFallbackName = isGamified
    ? t("defaultNameGamified")
    : t("defaultNameProductivity");
  const displayName = user?.fullName || user?.username || defaultFallbackName;

  const targetXp = progress.targetXp;
  const xpPercent = progress.percent;
  const coins = user?.currentCoins ?? 0;
  const formattedCoins = formatCoins(coins, { locale });

  return (
    <footer className="px-3.5 pt-3.5 pb-4 border-t border-neutral-700 dark:border-primary/30 bg-surface/40 dark:bg-primary-dark/20 z-10">
      <Link
        href="/profile"
        onClick={onClose}
        aria-current={isProfileActive ? "page" : undefined}
        className="block mb-2 group rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
        title={t("showcaseTitle", { name: displayName })}
      >
        <ProfileLinkContent isActive={isProfileActive} label={displayName}>
          <UserAvatar
            src={user?.profilePhotoUrl}
            name={displayName}
            size="sm"
            hasRing={Boolean(user?.isPremium)}
            frameId={activeFrameId}
            presetId={user?.avatarPreset}
            className="group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="text-body-s font-bold text-neutral-50 truncate group-hover:text-primary dark:group-hover:text-gold transition-colors"
                title={displayName}
              >
                {displayName}
              </span>
              {achievementPoints > 0 && (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-gold/15 border border-gold/35 text-[10px] font-bold text-amber-800 dark:text-gold shrink-0 ml-auto"
                  title={t("achievementPointsTitle", {
                    points: achievementPoints,
                  })}
                >
                  <Trophy size={9} className="shrink-0" />
                  <span>{achievementPoints}</span>
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 min-w-0 mt-0.5">
              <div className="flex items-center gap-1.5 min-w-0 max-w-full shrink-0">
                <span className="text-tiny text-neutral-300 truncate">
                  {levelTitle}
                </span>
                <span className="text-neutral-500 text-tiny shrink-0">•</span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-1.5 py-0.2 rounded border text-[10px] font-bold leading-tight shrink-0",
                    isGamified
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:bg-gold/10 dark:border-gold/30 dark:text-gold"
                      : "bg-sky-500/10 border-sky-500/30 text-sky-700 dark:bg-cyan-500/10 dark:border-cyan-500/30 dark:text-cyan-400",
                  )}
                  title={
                    isGamified
                      ? t("modeGamifiedTitle")
                      : t("modeProductivityTitle")
                  }
                >
                  {isGamified ? (
                    <Swords size={10} className="shrink-0" />
                  ) : (
                    <Target size={10} className="shrink-0" />
                  )}
                  <span>
                    {isGamified
                      ? t("modeGamifiedBadge")
                      : t("modeProductivityBadge")}
                  </span>
                </span>
              </div>
              {user?.isFounder && (
                <FounderBadge size="sm" className="shrink-0" />
              )}
            </div>
          </div>
        </ProfileLinkContent>
      </Link>

      <div className="flex flex-col gap-1.5 mt-2.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-tiny font-semibold text-neutral-300 tabular-nums leading-none truncate"
            title={
              !progress.isMaxLevel
                ? isGamified
                  ? t("remainingXpTitle", {
                      xp: remainingXp,
                      nextTitle: nextLevelTitle,
                    })
                  : t("remainingPtsTitle", {
                      xp: remainingXp,
                      nextTitle: nextLevelTitle,
                    })
                : t("maxLevelTitle")
            }
          >
            {!progress.isMaxLevel
              ? `${currentXp} / ${targetXp} ${isGamified ? "XP" : "pts"}`
              : isGamified
                ? t("xpMaxLabel", { xp: currentXp })
                : t("ptsMaxLabel", { xp: currentXp })}
          </span>

          <div
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/10 border border-gold/25 shrink-0 max-w-[105px]"
            title={
              isGamified
                ? t("coinsTitle", { coins: formattedCoins })
                : coins > 0
                  ? t("creditsTitleWithLeisure", {
                      coins: formattedCoins,
                      duration: formatCreditsLeisureEquivalence(coins),
                    })
                  : t("creditsTitle", { coins: formattedCoins })
            }
          >
            <CoinIcon size={13} withGlow className="shrink-0" />
            <span className="text-xs font-bold text-neutral-50 leading-none tabular-nums truncate">
              {formatCoins(coins, { compact: true, locale })}
            </span>
          </div>
        </div>

        <ProgressBar
          percent={xpPercent}
          className="h-2 bg-neutral-700 dark:bg-neutral-900 border border-neutral-600/70 dark:border-white/5"
          fillClassName="bg-gold transition-transform duration-500 ease-out shadow-glow-gold-xs"
          ariaValueNow={currentXp}
          ariaValueMin={0}
          ariaValueMax={targetXp}
          title={
            !progress.isMaxLevel
              ? isGamified
                ? t("progressTitle", {
                    currentXp,
                    targetXp,
                    percent: xpPercent,
                    remainingXp,
                    nextTitle: nextLevelTitle,
                  })
                : t("progressPtsTitle", {
                    currentXp,
                    targetXp,
                    percent: xpPercent,
                    remainingXp,
                    nextTitle: nextLevelTitle,
                  })
              : isGamified
                ? t("progressMaxTitle", { currentXp, levelTitle })
                : t("progressPtsMaxTitle", { currentXp, levelTitle })
          }
        />
      </div>

      {user?.isPremium && (
        <SubscriptionExpirationAlert user={user} className="mt-2.5" />
      )}
    </footer>
  );
}
