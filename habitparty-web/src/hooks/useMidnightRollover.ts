"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { triggerMidnightRolloverAction } from "@/actions/taskActions";
import { getTodayDateString } from "@/utils/date";

/**
 * Monitora a virada da meia-noite no fuso horário do usuário (a cada 60s e ao retornar à aba).
 * Quando o dia local muda (`YYYY-MM-DD`), executa o callback `onRollover` para resetar o estado
 * otimista de Diárias/Hábitos no cliente, invalida o cache do servidor e aciona `router.refresh()`.
 */
export function useMidnightRollover(
  timeZone?: string | null,
  onRollover?: (newDateIso: string) => void,
): string {
  const router = useRouter();
  const [todayIso, setTodayIso] = useState<string>(() =>
    getTodayDateString(new Date(), timeZone),
  );
  const prevDateRef = useRef<string>(todayIso);
  const prevTimeZoneRef = useRef<string | null | undefined>(timeZone);
  const onRolloverRef = useRef(onRollover);
  onRolloverRef.current = onRollover;

  useEffect(() => {
    if (prevTimeZoneRef.current !== timeZone) {
      prevTimeZoneRef.current = timeZone;
      const alignedDate = getTodayDateString(new Date(), timeZone);
      prevDateRef.current = alignedDate;
      setTodayIso(alignedDate);
    }
  }, [timeZone]);

  useEffect(() => {
    const checkRollover = () => {
      const nextIso = getTodayDateString(new Date(), timeZone);
      if (nextIso !== prevDateRef.current) {
        prevDateRef.current = nextIso;
        setTodayIso(nextIso);
        onRolloverRef.current?.(nextIso);
        void triggerMidnightRolloverAction().finally(() => {
          router.refresh();
        });
      }
    };

    const interval = setInterval(checkRollover, 60_000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkRollover();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [timeZone, router]);

  return todayIso;
}
