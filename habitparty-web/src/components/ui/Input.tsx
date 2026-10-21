"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { InputProps } from "@/types/ui";
import { cn } from "@/utils";

export function Input({
  label,
  id,
  className,
  icon,
  type = "text",
  compact = false,
  error,
  hint,
  ...props
}: InputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPasswordInput = type === "password";
  const finalType = isPasswordInput && isPasswordVisible ? "text" : type;

  const errorId = id && error ? `${id}-error` : undefined;
  const hintId = id && hint ? `${id}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

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
        {icon && (
          <div
            className={cn(
              "absolute left-4 pointer-events-none transition-colors",
              "text-neutral-400 peer-focus:text-gold peer-[:not(:placeholder-shown)]:text-gold",
            )}
          >
            {icon}
          </div>
        )}

        <input
          id={id}
          type={finalType}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "peer w-full rounded-lg transition-all",
            compact ? "py-2 text-body-s" : "py-3 text-body-m",
            // Tema Claro: Fundo de card limpo, borda sutil e texto escuro de alta legibilidade
            "bg-card border border-neutral-700 text-neutral-50 focus:border-primary focus:bg-card shadow-xs",
            // Tema Escuro: 100% fiel ao original
            "dark:bg-primary-dark/20 dark:border-primary/30 dark:text-neutral-50 dark:focus:border-primary-light dark:focus:bg-primary-dark/30 dark:shadow-none",
            // Foco acessível com anel dourado de alto contraste WCAG AA
            "outline-none focus:outline-none",
            "focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:border-transparent",
            "placeholder:text-neutral-400",
            error &&
              "border-danger-500/80 focus-visible:ring-danger-500 focus:border-danger-500",
            icon ? "pl-11 pr-4" : compact ? "px-3" : "px-4",
            isPasswordInput ? "pr-11" : "",
            className,
          )}
          {...props}
        />

        {/* Alternância de Visibilidade da Senha com foco acessível */}
        {isPasswordInput && (
          <button
            type="button"
            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
            className="absolute right-3.5 text-neutral-400 hover:text-gold transition-colors p-1 rounded-md outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold cursor-pointer"
            aria-label={isPasswordVisible ? "Ocultar senha" : "Exibir senha"}
          >
            {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {/* Mensagem de Erro de Acessibilidade */}
      {error && (
        <span
          id={errorId}
          role="alert"
          className="text-xs text-danger-500 font-semibold mt-0.5"
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
