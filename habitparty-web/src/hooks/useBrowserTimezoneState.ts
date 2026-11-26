"use client";

import { useEffect, useState } from "react";
import {
  areTimeZonesClockEquivalent,
  DEFAULT_TIMEZONE,
  detectBrowserTimeZone,
  getTimeZoneCooldownRemainingMs,
  isValidIanaTimeZone,
} from "@/utils/date";

export interface UseBrowserTimezoneStateOptions {
  accountTimezone?: string | null;
  timezoneUpdatedAt?: string | null;
  serverNowMs?: number;
  /** Quando `true`, agenda atualização periódica (1 min) enquanto o cooldown estiver ativo. */
  tickCooldown?: boolean;
}

/**
 * Centraliza a detecção de fuso do navegador, verificação de divergência de relógio
 * e cálculo de cooldown entre `TimezoneSettings` e `TimezoneMismatchBanner`.
 */
export function useBrowserTimezoneState({
  accountTimezone,
  timezoneUpdatedAt,
  serverNowMs,
  tickCooldown = false,
}: UseBrowserTimezoneStateOptions) {
  const [browserTimezone, setBrowserTimezone] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number | null>(serverNowMs ?? null);

  useEffect(() => {
    setBrowserTimezone(detectBrowserTimeZone(DEFAULT_TIMEZONE));
  }, []);

  useEffect(() => {
    setNowMs(Date.now());
    if (!tickCooldown || !timezoneUpdatedAt) return;
    if (getTimeZoneCooldownRemainingMs(timezoneUpdatedAt) <= 0) return;

    const timer = window.setInterval(() => {
      const nextNow = Date.now();
      setNowMs(nextNow);
      if (
        getTimeZoneCooldownRemainingMs(timezoneUpdatedAt, new Date(nextNow)) <=
        0
      ) {
        window.clearInterval(timer);
      }
    }, 60_000);

    return () => window.clearInterval(timer);
  }, [tickCooldown, timezoneUpdatedAt]);

  const cooldownRemainingMs =
    nowMs !== null
      ? getTimeZoneCooldownRemainingMs(timezoneUpdatedAt, new Date(nowMs))
      : 0;
  const isCooldownActive = cooldownRemainingMs > 0;
  const cooldownTotalMinutes = Math.ceil(cooldownRemainingMs / 60_000);
  const cooldownHours = Math.floor(cooldownTotalMinutes / 60);
  const cooldownMinutes = cooldownTotalMinutes % 60;

  const hasBrowserMismatch = Boolean(
    browserTimezone &&
      isValidIanaTimeZone(accountTimezone) &&
      !areTimeZonesClockEquivalent(accountTimezone, browserTimezone),
  );

  return {
    browserTimezone,
    nowMs,
    refreshNow: () => setNowMs(Date.now()),
    cooldownRemainingMs,
    isCooldownActive,
    cooldownHours,
    cooldownMinutes,
    hasBrowserMismatch,
  };
}
