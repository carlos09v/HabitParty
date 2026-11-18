import { cn } from "@/utils";

export interface ProgressBarProps {
  /** Percentual de 0 a 100 (clamp automático). */
  percent: number;
  /** Piso visual opcional para manter preenchimento mínimo visível (ex.: cotas > 0). */
  minVisualPercent?: number;
  /** Classes do trilho externo (altura, fundo, borda, margem). */
  className?: string;
  /** Classes do preenchimento interno (cor, gradiente, sombra, transição). */
  fillClassName?: string;
  /** Tag HTML raiz ("span" para contextos inline ou dentro de botões). */
  as?: "div" | "span";
  /** Quando verdadeiro, oculta a barra da árvore de acessibilidade (barra puramente decorativa). */
  decorative?: boolean;
  ariaValueNow?: number;
  ariaValueMin?: number;
  ariaValueMax?: number;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  title?: string;
}

/**
 * Barra de progresso reutilizável com preenchimento via transform (`scaleX`)
 * para animações compostas na GPU sem causar reflow.
 */
export function ProgressBar({
  percent,
  minVisualPercent,
  className,
  fillClassName,
  as = "div",
  decorative = false,
  ariaValueNow,
  ariaValueMin = 0,
  ariaValueMax = 100,
  ariaLabel,
  ariaLabelledBy,
  title,
}: ProgressBarProps) {
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const visualPercent =
    minVisualPercent !== undefined
      ? Math.min(100, Math.max(clampedPercent, minVisualPercent))
      : clampedPercent;

  const TrackTag = as;
  const FillTag = as;

  const ariaProps = decorative
    ? { "aria-hidden": true as const }
    : {
        role: "progressbar" as const,
        "aria-valuenow": ariaValueNow ?? clampedPercent,
        "aria-valuemin": ariaValueMin,
        "aria-valuemax": ariaValueMax,
        ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
        ...(ariaLabelledBy ? { "aria-labelledby": ariaLabelledBy } : {}),
      };

  return (
    <TrackTag
      title={title}
      className={cn(
        "w-full rounded-full overflow-hidden",
        as === "span" && "block",
        className,
      )}
      {...ariaProps}
    >
      <FillTag
        className={cn(
          "h-full w-full origin-left motion-reduce:transition-none",
          as === "span" && "block",
          fillClassName,
        )}
        style={{ transform: `scaleX(${visualPercent / 100})` }}
      />
    </TrackTag>
  );
}
