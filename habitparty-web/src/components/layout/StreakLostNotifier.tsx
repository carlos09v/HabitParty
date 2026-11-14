"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useUserStore } from "@/store/userStore";
import { getTodayDateString } from "@/utils/date";

const STREAK_TRACKER_STORAGE_PREFIX = "habitparty_streak_tracker_";

interface StreakLostNotifierProps {
  userId?: string | null;
  currentStreak?: number | null;
  timezone?: string | null;
}

export function StreakLostNotifier({
  userId,
  currentStreak: rawStreak,
  timezone: propTimezone,
}: StreakLostNotifierProps) {
  const t = useTranslations("streakLost");
  const storeTimeZone = useUserStore((s) => s.user?.timezone);
  const userTimeZone = storeTimeZone ?? propTimezone;
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!userId) return;

    try {
      const todayStr = getTodayDateString(new Date(), userTimeZone);
      const storageKey = `${STREAK_TRACKER_STORAGE_PREFIX}${userId}`;
      const raw = localStorage.getItem(storageKey);
      const currentStreak = rawStreak ?? 0;

      if (!checkedRef.current) {
        checkedRef.current = true;
        if (raw) {
          const parsed = JSON.parse(raw) as {
            lastDate: string;
            lastStreak: number;
          };
          if (
            parsed.lastDate < todayStr &&
            currentStreak === 0 &&
            parsed.lastStreak > 0
          ) {
            toast.warning(t("title"), {
              description: t("description", { count: parsed.lastStreak }),
              duration: 7000,
            });
          }
        }
      }

      // Mantém o streak atualizado no storage
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          lastDate: todayStr,
          lastStreak: currentStreak,
        }),
      );
    } catch {
      // Ignora falhas em ambientes restritos de storage
    }
  }, [userId, rawStreak, userTimeZone, t]);

  return null;
}
