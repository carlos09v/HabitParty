import { CoinIcon } from "@/components/ui/CoinIcon";
import { cn, formatCoins } from "@/utils";

export interface CoinAmountProps {
  amount: number;
  size?: "xs" | "sm" | "md" | "lg";
  showSign?: boolean;
  showZeroAsDash?: boolean;
  withGlow?: boolean;
  className?: string;
}

const TEXT_SIZE_MAP = {
  xs: "text-label-g",
  sm: "text-xs",
  md: "text-body-s font-bold",
  lg: "text-base font-extrabold",
};

const COIN_SIZE_MAP = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
};

/**
 * Exibe um valor monetário de HabitCoins estilizado, com cores automáticas de ganho/gasto
 * e ícone gamificado CoinIcon padronizado em todo o sistema.
 */
export function CoinAmount({
  amount,
  size = "sm",
  showSign = true,
  showZeroAsDash = false,
  withGlow,
  className,
}: CoinAmountProps) {
  const isPositive = amount > 0;
  const isNegative = amount < 0;
  const isZero = amount === 0;

  if (isZero && showZeroAsDash) {
    return (
      <span className={cn("text-neutral-500", TEXT_SIZE_MAP[size], className)}>
        −
      </span>
    );
  }

  const glow = withGlow ?? isPositive;
  const formattedValue = formatCoins(Math.abs(amount));
  const signPrefix = showSign ? (isPositive ? "+" : isNegative ? "−" : "") : "";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 select-none font-bold whitespace-nowrap",
        TEXT_SIZE_MAP[size],
        isPositive && "text-success-500",
        isNegative && "text-danger-500",
        isZero && "text-neutral-400 font-normal",
        className,
      )}
    >
      <span>
        {signPrefix}
        {formattedValue}
      </span>
      <CoinIcon
        size={COIN_SIZE_MAP[size]}
        withGlow={glow}
        className={isZero ? "opacity-50" : undefined}
      />
    </span>
  );
}
