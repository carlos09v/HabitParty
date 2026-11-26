import { Minus, Plus } from "lucide-react";
import type { InputProps } from "@/types/ui";
import { cn } from "@/utils";
import { Input } from "./Input";

export interface NumberStepperInputProps
  extends Omit<InputProps, "type" | "endAdornment"> {
  /** Incremento/decremento aplicado pelos botões `-` e `+` (padrão: 5). */
  stepAmount?: number;
  /** Callback disparado com delta negativo ou positivo ao clicar nos botões. */
  onStep: (delta: number) => void;
  decrementDisabled?: boolean;
  incrementDisabled?: boolean;
  decrementAriaLabel?: string;
  incrementAriaLabel?: string;
  iconSize?: number;
}

/**
 * Input numérico com controles integrados de decremento e incremento (`-` / `+`)
 * à direita, reutilizado nos campos de minutos em Foco e Recompensas.
 */
export function NumberStepperInput({
  stepAmount = 5,
  onStep,
  decrementDisabled = false,
  incrementDisabled = false,
  decrementAriaLabel,
  incrementAriaLabel,
  iconSize = 14,
  disabled = false,
  className,
  ...props
}: NumberStepperInputProps) {
  const isDecrementDisabled = disabled || decrementDisabled;
  const isIncrementDisabled = disabled || incrementDisabled;

  return (
    <Input
      type="number"
      disabled={disabled}
      className={cn("pr-20 tabular-nums", className)}
      endAdornment={
        <>
          <button
            type="button"
            onClick={() => onStep(-stepAmount)}
            disabled={isDecrementDisabled}
            className="p-1.5 pointer-coarse:p-2 rounded-md text-neutral-400 hover:text-primary dark:hover:text-gold hover:bg-neutral-700/50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:focus-visible:ring-gold"
            aria-label={decrementAriaLabel ?? `-${stepAmount}m`}
          >
            <Minus size={iconSize} />
          </button>
          <button
            type="button"
            onClick={() => onStep(stepAmount)}
            disabled={isIncrementDisabled}
            className="p-1.5 pointer-coarse:p-2 rounded-md text-neutral-400 hover:text-primary dark:hover:text-gold hover:bg-neutral-700/50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:focus-visible:ring-gold"
            aria-label={incrementAriaLabel ?? `+${stepAmount}m`}
          >
            <Plus size={iconSize} />
          </button>
        </>
      }
      {...props}
    />
  );
}
