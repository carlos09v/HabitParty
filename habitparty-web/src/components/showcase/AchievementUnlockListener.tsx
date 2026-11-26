"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import {
  fetchUnseenAchievementsAction,
  markAchievementsSeenAction,
} from "@/actions/showcaseActions";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import { useUserStore } from "@/store/userStore";

export function AchievementUnlockListener() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale() as AppLocale;
  const tToast = useTranslations("showcase.unlockToast");
  const tRarities = useTranslations("showcase.rarities");
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
    const isExplicitCheck = achievementCheckSeq > lastHandledSeqRef.current;

    if (!checkTriggerKey) {
      return;
    }

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

        // Carrega o renderizador do toast, mapa de ícones e catálogo de textos sob demanda
        const { renderAchievementUnlockToasts } = await import(
          "./AchievementUnlockToastRenderer"
        );
        if (cancelled) return;

        for (const item of freshUnseen) {
          shownCodesRef.current.add(item.code);
        }

        await renderAchievementUnlockToasts({
          achievements: freshUnseen,
          locale,
          isGamified,
          onNavigateProfile: () => router.push("/profile"),
          tToast: (key, values) =>
            tToast(
              key as Parameters<typeof tToast>[0],
              values as Parameters<typeof tToast>[1],
            ),
          tRarities: (rarity) => tRarities(rarity),
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
    checkTriggerKey,
    isGamified,
    locale,
    pathname,
    router,
    tRarities,
    tToast,
  ]);

  return null;
}
