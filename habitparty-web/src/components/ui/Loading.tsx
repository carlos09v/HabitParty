import type { LoadingProps, LoadingSize } from "@/types/ui";
import { cn } from "@/utils";

const SPINNER_SIZE_MAP: Record<LoadingSize, string> = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-10 h-10 border-[3px]",
  xl: "w-14 h-14 border-4",
};

const DOT_SIZE_MAP: Record<LoadingSize, string> = {
  sm: "w-1.5 h-1.5",
  md: "w-2.5 h-2.5",
  lg: "w-3.5 h-3.5",
  xl: "w-4.5 h-4.5",
};

const LABEL_TEXT_SIZE_MAP: Record<LoadingSize, string> = {
  sm: "text-label-g",
  md: "text-xs",
  lg: "text-sm",
  xl: "text-base font-semibold",
};

const ROUNDED_MAP = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

/**
 * Componente de Loading reutilizável para o HabitParty.
 * Suporta as cores da marca (roxo primário ou amarelo gold) e quatro variantes:
 * spinner circular com glow, dots pulsantes, skeleton shimmer e overlay de tela cheia.
 */
export function Loading({
  variant = "spinner",
  color = "primary",
  size = "md",
  label,
  width,
  height,
  rounded = "lg",
  className,
  style,
  ...props
}: LoadingProps) {
  const isPrimary = color === "primary";

  // 1. VARIANTE: SKELETON
  if (variant === "skeleton") {
    const customStyle = {
      ...(width !== undefined && {
        width: typeof width === "number" ? `${width}px` : width,
      }),
      ...(height !== undefined && {
        height: typeof height === "number" ? `${height}px` : height,
      }),
      ...style,
    };

    return (
      <div
        aria-busy="true"
        style={customStyle}
        className={cn(
          "animate-pulse transition-all",
          isPrimary
            ? "bg-primary-dark/30 border border-primary/20"
            : "bg-gold/10 border border-gold/20",
          ROUNDED_MAP[rounded],
          !width && "w-full",
          !height && "h-6",
          className,
        )}
        {...props}
      >
        <span className="sr-only">{label || "Carregando..."}</span>
      </div>
    );
  }

  // 2. CONTEÚDO PRINCIPAL (SPINNER OU DOTS)
  const spinnerElement = (
    <div
      className={cn(
        "rounded-full border-solid border-t-transparent animate-spin transition-all",
        SPINNER_SIZE_MAP[size],
        isPrimary
          ? "border-primary/25 border-t-primary shadow-[0_0_12px_rgba(124,58,237,0.35)]"
          : "border-gold/25 border-t-gold shadow-[0_0_12px_rgba(237,229,57,0.35)]",
      )}
      aria-hidden="true"
    />
  );

  const dotsElement = (
    <div
      className={cn(
        "flex items-center",
        size === "sm" ? "gap-1" : size === "md" ? "gap-1.5" : "gap-2",
      )}
      aria-hidden="true"
    >
      <span
        className={cn(
          "rounded-full animate-bounce [animation-delay:-0.3s]",
          DOT_SIZE_MAP[size],
          isPrimary
            ? "bg-primary shadow-[0_0_8px_rgba(124,58,237,0.45)]"
            : "bg-gold shadow-[0_0_8px_rgba(237,229,57,0.45)]",
        )}
      />
      <span
        className={cn(
          "rounded-full animate-bounce [animation-delay:-0.15s]",
          DOT_SIZE_MAP[size],
          isPrimary
            ? "bg-primary shadow-[0_0_8px_rgba(124,58,237,0.45)]"
            : "bg-gold shadow-[0_0_8px_rgba(237,229,57,0.45)]",
        )}
      />
      <span
        className={cn(
          "rounded-full animate-bounce",
          DOT_SIZE_MAP[size],
          isPrimary
            ? "bg-primary shadow-[0_0_8px_rgba(124,58,237,0.45)]"
            : "bg-gold shadow-[0_0_8px_rgba(237,229,57,0.45)]",
        )}
      />
    </div>
  );

  const activeLoader = variant === "dots" ? dotsElement : spinnerElement;

  const content = (
    <div
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex flex-col items-center justify-center",
        label
          ? size === "sm"
            ? "gap-1.5"
            : size === "md"
              ? "gap-2"
              : "gap-3"
          : "gap-0",
        className,
      )}
      style={style}
      {...props}
    >
      {activeLoader}

      {label ? (
        <span
          className={cn(
            "text-neutral-300 font-medium tracking-wide select-none text-center",
            LABEL_TEXT_SIZE_MAP[size],
          )}
        >
          {label}
        </span>
      ) : (
        <span className="sr-only">Carregando...</span>
      )}
    </div>
  );

  // 3. VARIANTE: OVERLAY (TELA CHEIA OU CONTAINER BLOQUEADO)
  if (variant === "overlay") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in duration-200"
        aria-modal="true"
        role="dialog"
      >
        {content}
      </div>
    );
  }

  return content;
}
