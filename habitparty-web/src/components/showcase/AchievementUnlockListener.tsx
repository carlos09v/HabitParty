"use client";

import { Sparkles, Trophy } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  fetchUnseenAchievementsAction,
  markAchievementsSeenAction,
} from "@/actions/showcaseActions";
import { AchievementIcon } from "@/components/showcase/AchievementIcon";
import { RARITY_THEMES } from "@/constants/achievements";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useUserStore } from "@/store/userStore";
import type { AchievementRarity } from "@/types/showcase";
import { cn, resolveAchievementCopy } from "@/utils";
import { soundEffects } from "@/utils/soundEffects";

const RARITY_PRIORITY: Record<AchievementRarity, number> = {
  COMMON: 1,
  UNCOMMON: 2,
  RARE: 3,
  EPIC: 4,
  LEGENDARY: 5,
};

export function AchievementUnlockListener() {
  const router = useRouter();
  const pathname = usePathname();
  const tToast = useTranslations("showcase.unlockToast");
  const tRarities = useTranslations("showcase.rarities");
  const tCatalog = useTranslations("showcase.catalog");
  const { isGamified } = useExperienceMode();

  const checkTriggerKey = useUserStore((s) =>
    s.user?.id
      ? `${s.user.id}:${s.user.totalXp ?? 0}:${s.user.currentCoins ?? 0}:${s.user.achievementPoints ?? 0}`
      : null,
  );
  const shownCodesRef = useRef<Set<string>>(new Set());
  const isCheckingRef = useRef(false);

  useEffect(() => {
    if (!checkTriggerKey || isCheckingRef.current || pathname === "/profile") {
      return;
    }

    let cancelled = false;
    let idleId: number | null = null;
    const win = window as Window & {
      requestIdleCallback?: (
        cb: () => void,
        opts?: { timeout: number },
      ) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    const runCheck = async () => {
      if (isCheckingRef.current || cancelled) return;
      isCheckingRef.current = true;

      try {
        const res = await fetchUnseenAchievementsAction();
        if (cancelled || !res.success || !res.data || res.data.length === 0) {
          return;
        }

        const freshUnseen = res.data.filter(
          (item) => !shownCodesRef.current.has(item.code),
        );

        if (freshUnseen.length === 0) {
          return;
        }

        let highestRarity: AchievementRarity = "COMMON";
        for (const item of freshUnseen) {
          shownCodesRef.current.add(item.code);
          if (RARITY_PRIORITY[item.rarity] > RARITY_PRIORITY[highestRarity]) {
            highestRarity = item.rarity;
          }
        }

        // Toca o novo efeito sonoro cristalino de conquista desbloqueada
        soundEffects.playAchievementUnlockSound(highestRarity);

        // Marca como vistas no servidor
        void markAchievementsSeenAction();

        // Exibe toast celebratório para até 3 conquistas simultâneas
        freshUnseen.slice(0, 3).forEach((achievement) => {
          const theme =
            RARITY_THEMES[achievement.rarity] || RARITY_THEMES.COMMON;
          const { title, description } = resolveAchievementCopy(
            achievement,
            isGamified,
            tCatalog,
          );
          const rarityLabel = tRarities(achievement.rarity);

          toast.custom(
            (toastId) => (
              <div
                className={cn(
                  "w-full max-w-sm rounded-2xl border p-4 shadow-card-active dark:shadow-2xl transition-colors",
                  "bg-card dark:bg-neutral-900/95",
                  theme.cardBorder,
                  theme.cardGlow,
                )}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl border flex items-center justify-center shrink-0",
                      theme.iconBg,
                      theme.iconText,
                    )}
                  >
                    <AchievementIcon iconKey={achievement.iconName} size={24} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-gold">
                        <Sparkles size={11} />
                        {isGamified
                          ? tToast("headerGamified")
                          : tToast("headerEssential")}
                      </span>
                      <span
                        className={cn(
                          "px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase border",
                          theme.badgeBg,
                          theme.badgeText,
                          theme.badgeBorder,
                        )}
                      >
                        {rarityLabel}
                      </span>
                    </div>

                    <p className="text-body-s font-bold text-neutral-50 mt-0.5 truncate">
                      {title}
                    </p>
                    <p className="text-tiny text-neutral-300 line-clamp-2 mt-0.5">
                      {description}
                    </p>

                    <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-neutral-700 dark:border-primary/15">
                      <span className="inline-flex items-center gap-1 text-tiny font-bold text-amber-700 dark:text-gold">
                        <Trophy size={12} />
                        {tToast("pointsEarned", { points: achievement.points })}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          toast.dismiss(toastId);
                          router.push("/profile");
                        }}
                        className="text-tiny font-bold text-primary dark:text-gold hover:underline cursor-pointer"
                      >
                        {tToast("viewShowcase")} →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ),
            { duration: 6500 },
          );
        });
      } finally {
        isCheckingRef.current = false;
      }
    };

    const timer = window.setTimeout(() => {
      if (cancelled) return;
      if (typeof win.requestIdleCallback === "function") {
        idleId = win.requestIdleCallback(() => void runCheck(), {
          timeout: 2500,
        });
      } else {
        void runCheck();
      }
    }, 600);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (idleId !== null && typeof win.cancelIdleCallback === "function") {
        win.cancelIdleCallback(idleId);
      }
    };
  }, [
    checkTriggerKey,
    isGamified,
    pathname,
    router,
    tCatalog,
    tRarities,
    tToast,
  ]);

  return null;
}
