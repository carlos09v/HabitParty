"use client";

import { useEffect, useRef, useState } from "react";
import { triggerMidnightRolloverAction } from "@/actions/taskActions";
import { subscribeMinuteTicker } from "@/hooks/useMinuteTicker";
import { getTodayDateString } from "@/utils/date";

let lastCompletedRolloverKey: string | null = null;
let pendingRetryRolloverKey: string | null = null;
let inFlightRolloverKey: string | null = null;

function triggerSharedMidnightRollover(rolloverKey: string) {
  if (
    lastCompletedRolloverKey === rolloverKey ||
    inFlightRolloverKey === rolloverKey
  ) {
    return;
  }
  inFlightRolloverKey = rolloverKey;

  void triggerMidnightRolloverAction()
    .then((res) => {
      if (res?.success !== false) {
        lastCompletedRolloverKey = rolloverKey;
        if (pendingRetryRolloverKey === rolloverKey) {
          pendingRetryRolloverKey = null;
        }
      } else {
        pendingRetryRolloverKey = rolloverKey;
      }
    })
    .catch(() => {
      // Mantém elegível para nova tentativa no próximo tick caso offline
      pendingRetryRolloverKey = rolloverKey;
    })
    .finally(() => {
      if (inFlightRolloverKey === rolloverKey) {
        inFlightRolloverKey = null;
      }
    });
}

/**
 * Monitora a virada da meia-noite no fuso horário do usuário assinando imperativamente o
 * ticker compartilhado (`subscribeMinuteTicker`) — sem disparar re-renders a cada minuto.
 * Só atualiza o estado React quando o dia local (`YYYY-MM-DD`) realmente vira, acionando
 * `onRollover` em cada consumidor e `triggerMidnightRolloverAction()` (que invalida via `updateTag`) uma única vez.
 */
export function useMidnightRollover(
  timeZone?: string | null,
  onRollover?: (newDateIso: string) => void,
): string {
  const [todayIso, setTodayIso] = useState<string>(() =>
    getTodayDateString(new Date(), timeZone),
  );
  const prevDateRef = useRef<string>(todayIso);
  const prevTimeZoneRef = useRef<string | null | undefined>(timeZone);
  const onRolloverRef = useRef(onRollover);

  useEffect(() => {
    onRolloverRef.current = onRollover;
  }, [onRollover]);

  useEffect(() => {
    if (prevTimeZoneRef.current !== timeZone) {
      prevTimeZoneRef.current = timeZone;
      const alignedDate = getTodayDateString(new Date(), timeZone);
      prevDateRef.current = alignedDate;
      setTodayIso(alignedDate);
    }
  }, [timeZone]);

  useEffect(() => {
    const checkDateChange = () => {
      const nextIso = getTodayDateString(new Date(), timeZone);
      const rolloverKey = `${timeZone ?? "local"}|${nextIso}`;
      if (nextIso !== prevDateRef.current) {
        prevDateRef.current = nextIso;
        setTodayIso(nextIso);
        onRolloverRef.current?.(nextIso);
        pendingRetryRolloverKey = rolloverKey;
        triggerSharedMidnightRollover(rolloverKey);
      } else if (
        pendingRetryRolloverKey === rolloverKey &&
        lastCompletedRolloverKey !== rolloverKey
      ) {
        // Retry se o rollover anterior falhou (ex: dispositivo offline à meia-noite)
        triggerSharedMidnightRollover(rolloverKey);
      }
    };

    checkDateChange();
    return subscribeMinuteTicker(checkDateChange);
  }, [timeZone]);

  return todayIso;
}
