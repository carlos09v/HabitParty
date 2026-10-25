import { Sparkles } from "lucide-react";
import { cn } from "@/utils";

export interface XpAmountProps {
  amount: number;
  size?: "xs" | "sm" | "md" | "lg";
  showSign?: boolean;
  showZeroAsDash?: boolean;
  withIcon?: boolean;
  className?: string;
}

const TEXT_SIZE_MAP = {
  xs: "text-label-g",
  sm: "text-xs",
  md: "text-body-s font-bold",
  lg: "text-base font-extrabold",
};

const ICON_SIZE_MAP = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
};

/**
 * Exibe um valor de experiência (XP) com a cor e tipografia padronizadas do HabitParty.
 */
export function XpAmount({
  amount,
  size = "sm",
  showSign = true,
  showZeroAsDash = false,
  withIcon = false,
  className,
}: XpAmountProps) {
  const isPositive = amount > 0;
  const isNegative = amount < 0;
  const isZero = amount === 0;

  if (isZero && (showZeroAsDash || !showSign)) {
    return (
      <span className={cn("text-neutral-500", TEXT_SIZE_MAP[size], className)}>
        −
      </span>
    );
  }

  const signPrefix = showSign ? (isPositive ? "+" : isNegative ? "−" : "") : "";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 select-none font-bold whitespace-nowrap",
        TEXT_SIZE_MAP[size],
        isPositive && "text-magenta",
        isNegative && "text-danger-500",
        isZero && "text-neutral-500 font-normal",
        className,
      )}
    >
      {withIcon && isPositive && (
        <Sparkles
          size={ICON_SIZE_MAP[size]}
          className="shrink-0 text-magenta"
        />
      )}
      <span>
        {signPrefix}
        {Math.abs(amount)}
      </span>
      <span className="text-tiny font-semibold opacity-90">XP</span>
    </span>
  );
}
