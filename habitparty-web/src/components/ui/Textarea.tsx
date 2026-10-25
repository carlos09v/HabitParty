import type { ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/utils";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  id?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  compact?: boolean;
}

/**
 * Campo de texto multiline acessível padronizado com os tokens visuais do HabitParty.
 */
export function Textarea({
  label,
  id,
  className,
  icon,
  compact = false,
  error,
  hint,
  rows = 3,
  ...props
}: TextareaProps) {
  const errorId = id && error ? `${id}-error` : undefined;
  const hintId = id && hint ? `${id}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={id}
          className="font-medium text-neutral-100 select-none text-body-s flex items-center gap-1.5"
        >
          {icon && <span className="text-neutral-400">{icon}</span>}
          <span>{label}</span>
        </label>
      )}

      <div className="relative flex transition-colors">
        <textarea
          id={id}
          rows={rows}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "peer w-full rounded-lg transition-all resize-none",
            compact ? "py-2 px-3 text-body-s" : "py-2.5 px-3.5 text-body-s",
            "bg-card border border-neutral-700 text-neutral-50 focus:border-primary focus:bg-card shadow-xs",
            "dark:bg-primary-dark/20 dark:border-primary/30 dark:text-neutral-50 dark:focus:border-primary-light dark:focus:bg-primary-dark/30",
            "outline-none focus:outline-none",
            "focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:border-transparent",
            "placeholder:text-neutral-500",
            error &&
              "border-danger-500/80 focus-visible:ring-danger-500 focus:border-danger-500",
            className,
          )}
          {...props}
        />
      </div>

      {error && (
        <span
          id={errorId}
          role="alert"
          className="text-xs text-danger-500 font-semibold mt-0.5"
        >
          {error}
        </span>
      )}

      {hint && !error && (
        <span id={hintId} className="text-xs text-neutral-400 mt-0.5">
          {hint}
        </span>
      )}
    </div>
  );
}
