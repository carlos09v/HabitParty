"use client";

import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { InputProps } from "@/types/ui";
import { cn } from "@/utils";

export function Input({
  label,
  id,
  className,
  icon,
  endAdornment,
  type = "text",
  compact = false,
  error,
  hint,
  "aria-describedby": externalDescribedBy,
  ...props
}: InputProps) {
  const t = useTranslations("ui.input");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPasswordInput = type === "password";
  const finalType = isPasswordInput && isPasswordVisible ? "text" : type;

  const errorId = id && error ? `${id}-error` : undefined;
  const hintId = id && hint ? `${id}-hint` : undefined;
  const describedBy =
    [externalDescribedBy, errorId, hintId].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={id}
          className="font-medium text-neutral-100 select-none text-body-s"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center transition-colors">
        <input
          id={id}
          type={finalType}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(
            "peer w-full rounded-lg transition-colors",
            compact ? "py-2 text-base sm:text-body-s" : "py-3 text-body-m",
            // Tema Claro: Fundo de card limpo, borda nítida (>= 3:1) e texto escuro de alta legibilidade
            "bg-card border border-neutral-500/80 hover:border-neutral-400 text-neutral-50 focus:border-primary focus:ring-2 focus:ring-primary/15 focus:bg-card shadow-xs",
            // Tema Escuro: Borda legível (>= 3:1) com identidade cósmica
            "dark:bg-primary-dark/20 dark:border-primary-light/40 dark:hover:border-primary-light/60 dark:text-neutral-50 dark:focus:border-primary-light dark:focus:ring-0 dark:focus:bg-primary-dark/30 dark:shadow-none",
            // Foco acessível com anel de alto contraste WCAG AA em todos os temas
            "outline-none focus:outline-none",
            "focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background dark:focus-visible:ring-offset-2 dark:focus-visible:border-transparent",
            "placeholder:text-neutral-400",
            finalType === "number" &&
              "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            error &&
              "border-danger-500/90 dark:border-danger-400 focus-visible:ring-danger-500 dark:focus-visible:ring-danger-400 focus:border-danger-500 dark:focus:border-danger-400",
            icon ? "pl-11 pr-4" : compact ? "px-3" : "px-4",
            isPasswordInput ? "pr-11" : endAdornment ? "pr-10" : "",
            className,
          )}
          {...props}
        />

        {/* Ícone renderizado após o <input className="peer"> para que peer-focus funcione via seletor ~ */}
        {icon && (
          <div
            aria-hidden="true"
            className={cn(
              "absolute left-4 pointer-events-none transition-colors",
              "text-neutral-400 peer-focus:text-primary dark:peer-focus:text-gold dark:peer-[:not(:placeholder-shown)]:text-gold",
            )}
          >
            {icon}
          </div>
        )}

        {/* Alternância de Visibilidade da Senha com foco acessível */}
        {isPasswordInput && (
          <button
            type="button"
            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
            className="absolute right-3.5 text-neutral-400 hover:text-primary dark:hover:text-gold transition-colors p-1 rounded-md outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring cursor-pointer"
            aria-label={
              isPasswordVisible ? t("hidePassword") : t("showPassword")
            }
          >
            {isPasswordVisible ? (
              <EyeOff size={18} aria-hidden="true" />
            ) : (
              <Eye size={18} aria-hidden="true" />
            )}
          </button>
        )}

        {!isPasswordInput && endAdornment && (
          <div className="absolute right-1.5 flex items-center gap-0.5">
            {endAdornment}
          </div>
        )}
      </div>

      {/* Mensagem de Erro de Acessibilidade */}
      {error && (
        <span
          id={errorId}
          role="alert"
          className="text-xs text-danger-400 font-semibold mt-0.5"
        >
          {error}
        </span>
      )}

      {/* Dica do Campo */}
      {hint && !error && (
        <span id={hintId} className="text-xs text-neutral-400 mt-0.5">
          {hint}
        </span>
      )}
    </div>
  );
}
