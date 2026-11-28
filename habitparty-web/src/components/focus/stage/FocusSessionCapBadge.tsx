import { useTranslations } from "next-intl";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { cn } from "@/utils";

export interface FocusSessionCapBadgeViewProps {
  visible: boolean;
  label: string;
  title: string;
  isGamified: boolean;
  size?: "xs" | "sm" | "md";
  className?: string;
}

/**
 * Componente puramente apresentacional do selo de teto de recompensa por sessão (120 min).
 * Usado diretamente no Document PiP (`FocusPipWidget`) para evitar dependência de `focus.hero`.
 */
export function FocusSessionCapBadgeView({
  visible,
  label,
  title,
  isGamified,
  size = "sm",
  className,
}: FocusSessionCapBadgeViewProps) {
  if (!visible) return null;

  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold text-center leading-tight",
        size === "xs"
          ? "text-[10px] font-bold px-1.5 py-0.5 leading-none"
          : size === "md"
            ? "gap-1.5 px-3 py-1 text-xs shadow-2xs"
            : "px-2.5 py-0.5 text-[11px] max-w-[240px]",
        isGamified
          ? "border-amber-500/40 bg-amber-500/12 text-amber-800 dark:text-amber-300"
          : "border-sky-500/40 bg-sky-500/12 text-sky-800 dark:text-sky-300",
        className,
      )}
    >
      <span>{label}</span>
    </span>
  );
}

interface FocusSessionCapBadgeProps {
  visible: boolean;
  size?: "xs" | "sm" | "md";
  className?: string;
}

/**
 * Selo unificado de teto de recompensa por sessão (120 min) reutilizado
 * no Palco principal (`FocusHeroStage`) e no Modo Zen (`FocusZenModeModal`).
 */
export function FocusSessionCapBadge({
  visible,
  size = "sm",
  className,
}: FocusSessionCapBadgeProps) {
  const t = useTranslations("focus.hero");
  const { isGamified } = useExperienceMode();

  if (!visible) return null;

  const title = isGamified
    ? t("sessionCapReachedTitle")
    : t("sessionCapReachedTitleProductivity");
  const label = isGamified
    ? t("sessionCapReachedBadge")
    : t("sessionCapReachedBadgeProductivity");

  return (
    <FocusSessionCapBadgeView
      visible={visible}
      label={label}
      title={title}
      isGamified={isGamified}
      size={size}
      className={className}
    />
  );
}
