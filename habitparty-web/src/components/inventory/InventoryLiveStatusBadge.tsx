import { Radio } from "lucide-react";
import { useTranslations } from "next-intl";
import { useIsClient } from "@/hooks/useIsClient";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import { cn } from "@/utils";
import { formatFocusTime } from "@/utils/focusFormatters";

interface InventoryLiveStatusBadgeProps {
  itemIds: string[];
  variant?: "card" | "row";
}

/**
 * Leaf isolado que assina o `useFocusTimerStore` apenas para itens `IN_FOCUS`,
 * diferenciando visualmente um cupom estacionado no palco ("No palco") de um cupom
 * em contagem regressiva ativa ("Rodando agora · MM:SS") sem re-renderizar o resto do catálogo.
 */
export function InventoryLiveStatusBadge({
  itemIds,
  variant = "card",
}: InventoryLiveStatusBadgeProps) {
  const t = useTranslations("inventory.card");
  const isClient = useIsClient();

  const storeIsRunning = useFocusTimerStore((state) =>
    Boolean(
      state.target?.type === "inventory" &&
        state.target.id &&
        itemIds.includes(state.target.id) &&
        state.isActive &&
        !state.isPaused,
    ),
  );

  const storeIsPaused = useFocusTimerStore((state) =>
    Boolean(
      state.target?.type === "inventory" &&
        state.target.id &&
        itemIds.includes(state.target.id) &&
        state.isActive &&
        state.isPaused,
    ),
  );

  const storeLiveSeconds = useFocusTimerStore((state) =>
    state.target?.type === "inventory" &&
    state.target.id &&
    itemIds.includes(state.target.id) &&
    state.isActive
      ? state.secondsRemaining
      : null,
  );

  const isRunning = isClient && storeIsRunning;
  const isPaused = isClient && storeIsPaused;
  const liveSeconds = isClient ? storeLiveSeconds : null;

  if (isRunning || isPaused) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 font-bold rounded-md border leading-none shrink-0 whitespace-nowrap tabular-nums",
          variant === "row"
            ? "text-label-m px-2 py-0.5"
            : "text-tiny px-1.5 py-0.5",
          isRunning
            ? "border-emerald-500/45 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
            : "border-amber-500/45 bg-amber-500/15 text-amber-800 dark:text-amber-300",
        )}
      >
        <Radio
          size={10}
          className={cn("shrink-0", isRunning && "animate-pulse")}
          aria-hidden="true"
        />
        <span>
          {isRunning ? t("runningNow") : t("pausedInFocus")}
          {typeof liveSeconds === "number"
            ? ` · ${formatFocusTime(liveSeconds)}`
            : ""}
        </span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-bold rounded-md border border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-300 leading-none shrink-0 whitespace-nowrap",
        variant === "row"
          ? "text-label-m px-2 py-0.5"
          : "text-tiny px-1.5 py-0.5",
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
      <span>{t("stagedInFocus")}</span>
    </span>
  );
}
