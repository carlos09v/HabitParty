import {
  TASK_DESCRIPTION_COUNTER_THRESHOLD,
  TASK_DESCRIPTION_MAX_LENGTH,
} from "@/constants/task";
import { cn } from "@/utils";

interface DescriptionCharCounterProps {
  length: number;
  max?: number;
  className?: string;
}

/**
 * Contador de caracteres da descrição exibido apenas quando o texto se aproxima do limite
 * (a partir de TASK_DESCRIPTION_COUNTER_THRESHOLD), evitando poluição visual no uso comum.
 */
export function DescriptionCharCounter({
  length,
  max = TASK_DESCRIPTION_MAX_LENGTH,
  className,
}: DescriptionCharCounterProps) {
  if (length < max * TASK_DESCRIPTION_COUNTER_THRESHOLD) return null;

  const isAtLimit = length >= max;

  return (
    <span
      aria-live="polite"
      className={cn(
        "text-tiny tabular-nums font-semibold transition-colors",
        isAtLimit ? "text-danger-500" : "text-amber-700 dark:text-gold",
        className,
      )}
    >
      {length}/{max}
    </span>
  );
}
