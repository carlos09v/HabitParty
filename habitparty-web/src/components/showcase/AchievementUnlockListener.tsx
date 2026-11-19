"use client";

import { Sparkles, Trophy, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  fetchUnseenAchievementsAction,
  markAchievementsSeenAction,
} from "@/actions/showcaseActions";
import { AchievementIcon } from "@/components/showcase/AchievementIcon";
import { getRarityTheme } from "@/constants/achievements";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useUserStore } from "@/store/userStore";
import type { AchievementRarity } from "@/types/showcase";
import { cn, resolveAchievementCopy, resolveArtifactCopy } from "@/utils";
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
  const tArtifacts = useTranslations("showcase.artifacts");
  const { isGamified } = useExperienceMode();

  const achievementCheckSeq = useUserStore((s) => s.achievementCheckSeq);
  const achievementSessionEpoch = useUserStore(
    (s) => s.achievementSessionEpoch,
  );
  const checkTriggerKey = useUserStore((s) =>
    s.user?.id
      ? `${s.user.id}:${s.user.totalXp ?? 0}:${s.user.currentCoins ?? 0}:${s.user.achievementPoints ?? 0}:${s.achievementCheckSeq}`
      : null,
  );
  const shownCodesRef = useRef<Set<string>>(new Set());
  const isCheckingRef = useRef(false);
  const pendingRecheckRef = useRef(false);
  const lastHandledSeqRef = useRef(0);
  const lastSessionEpochRef = useRef(achievementSessionEpoch);

  useEffect(() => {
    if (lastSessionEpochRef.current !== achievementSessionEpoch) {
      lastSessionEpochRef.current = achievementSessionEpoch;
      shownCodesRef.current.clear();
    }
  }, [achievementSessionEpoch]);

  useEffect(() => {
    if (lastSessionEpochRef.current !== achievementSessionEpoch) {
      lastSessionEpochRef.current = achievementSessionEpoch;
      shownCodesRef.current.clear();
    }

    const isExplicitCheck = achievementCheckSeq > lastHandledSeqRef.current;

    if (!checkTriggerKey) {
      return;
    }

    // Visita passiva à /profile delega ao ShowcaseContainer; checagens explícitas após ações seguem mostrando toast
    if (pathname === "/profile" && !isExplicitCheck) {
      return;
    }

    if (isCheckingRef.current) {
      if (isExplicitCheck) {
        pendingRecheckRef.current = true;
      }
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
      if (cancelled) return;
      if (isCheckingRef.current) {
        if (isExplicitCheck) {
          pendingRecheckRef.current = true;
        }
        return;
      }
      isCheckingRef.current = true;
      if (isExplicitCheck) {
        lastHandledSeqRef.current = achievementCheckSeq;
      }

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

        // Exibe toast celebratório para até 3 conquistas simultâneas
        freshUnseen.slice(0, 3).forEach((achievement) => {
          const theme = getRarityTheme(achievement.rarity);
          const { title, description } = resolveAchievementCopy(
            achievement,
            isGamified,
            tCatalog,
          );
          const rarityLabel = tRarities(achievement.rarity);
          const grantedArtifact = achievement.grantedArtifact;
          const artifactTheme = grantedArtifact
            ? getRarityTheme(grantedArtifact.rarity)
            : null;
          const artifactCopy = grantedArtifact
            ? resolveArtifactCopy(grantedArtifact, isGamified, tArtifacts)
            : null;

          toast.custom(
            (toastId) => (
              <article
                className={cn(
                  "w-full max-w-md rounded-2xl border p-4 shadow-card-active dark:shadow-2xl transition-colors motion-reduce:transition-none",
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
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-gold">
                          <Sparkles size={11} aria-hidden="true" />
                          {isGamified
                            ? tToast("headerGamified")
                            : tToast("headerEssential")}
                        </span>
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border",
                            theme.badgeBg,
                            theme.badgeText,
                            theme.badgeBorder,
                          )}
                        >
                          {rarityLabel}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => toast.dismiss(toastId)}
                        aria-label={tToast("dismiss")}
                        className="p-1 -mr-1 -mt-1 rounded-lg text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800/60 transition-colors shrink-0 cursor-pointer"
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    </div>

                    <p className="text-body-s font-bold text-neutral-50 mt-0.5 break-words">
                      {title}
                    </p>
                    <p className="text-tiny text-neutral-300 mt-0.5 break-words">
                      {description}
                    </p>

                    {grantedArtifact && artifactTheme && artifactCopy && (
                      <div
                        className={cn(
                          "mt-2.5 flex items-center gap-2.5 rounded-xl border px-2.5 py-2",
                          "bg-neutral-800/50 dark:bg-neutral-950/60",
                          artifactTheme.cardBorder,
                        )}
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg border flex items-center justify-center shrink-0",
                            artifactTheme.iconBg,
                            artifactTheme.iconText,
                          )}
                        >
                          <AchievementIcon
                            iconKey={grantedArtifact.iconName}
                            size={16}
                            fallback="sparkles"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-gold break-words">
                              {tToast("artifactGrantedLabel")}
                            </span>
                            <span
                              className={cn(
                                "px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border",
                                artifactTheme.badgeBg,
                                artifactTheme.badgeText,
                                artifactTheme.badgeBorder,
                              )}
                            >
                              {tRarities(grantedArtifact.rarity)}
                            </span>
                          </div>
                          <p className="text-tiny font-bold text-neutral-50 break-words">
                            {artifactCopy.name}
                          </p>
                          <p className="text-[11px] text-neutral-300 break-words">
                            {tToast("artifactAddedHint")}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 pt-2 border-t border-neutral-700 dark:border-primary/15">
                      <span className="inline-flex items-center gap-1 text-tiny font-bold text-amber-700 dark:text-gold">
                        <Trophy size={12} aria-hidden="true" />
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
              </article>
            ),
            { duration: 6500 },
          );
        });

        await markAchievementsSeenAction();
        if (!cancelled && pathname === "/profile") {
          router.refresh();
        }
      } finally {
        isCheckingRef.current = false;
        if (pendingRecheckRef.current) {
          pendingRecheckRef.current = false;
          useUserStore.getState().triggerAchievementCheck();
        }
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
    achievementCheckSeq,
    achievementSessionEpoch,
    checkTriggerKey,
    isGamified,
    pathname,
    router,
    tArtifacts,
    tCatalog,
    tRarities,
    tToast,
  ]);

  return null;
}
