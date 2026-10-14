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
  ...props
}: InputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPasswordInput = type === "password";
  const finalType = isPasswordInput && isPasswordVisible ? "text" : type;

  return (
    <div className="flex flex-col gap-2 w-full">
      <label
        htmlFor={id}
        className={cn("text-neutral-100", compact ? "text-xs" : "text-body-s")}
      >
        {label}
      </label>
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
          className={cn(
            "peer w-full rounded-lg text-neutral-50 outline-none transition-all",
            compact ? "py-2 text-xs" : "py-3 text-body-m",
            "bg-primary-dark/20 border border-primary/30",
            "focus:border-primary-light focus:bg-primary-dark/30 focus:shadow-[0_0_8px_rgba(168,99,255,0.3)]",
            "placeholder:text-neutral-400",
            icon ? "pl-11 pr-4" : "px-4",
            type === "date" &&
              "[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer",
            className,
          )}
          {...props}
        />

        {/* Alternância de Visibilidade da Senha */}
        {isPasswordInput && (
          <button
            type="button"
            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
            className="absolute right-4 text-neutral-400 hover:text-gold transition-colors focus:outline-none cursor-pointer"
            aria-label={isPasswordVisible ? "Ocultar senha" : "Exibir senha"}
          >
            {isPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
    </div>
  );
}
