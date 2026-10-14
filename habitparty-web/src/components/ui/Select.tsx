"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { SelectItem, SelectProps } from "@/types/ui";
import { cn } from "@/utils";

function normalizeOption(option: SelectItem): {
  value: string;
  label: string;
} {
  if (typeof option === "string") {
    return { value: option, label: option };
  }
  return option;
}

export function Select({
  label,
  options,
  placeholder = "Selecione uma opção",
  compact = false,
  value,
  defaultValue,
  onChange,
  name,
  id,
  disabled = false,
  required = false,
  className,
}: SelectProps) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions = options.map(normalizeOption);

  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string>(
    value ?? defaultValue ?? "",
  );

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const currentOption = normalizedOptions.find(
    (opt) => opt.value === currentValue,
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    if (!isControlled) {
      setInternalValue(optionValue);
    }
    onChange?.(optionValue);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={cn("flex flex-col gap-2 w-full relative", className)}
    >
      {label && (
        <label
          htmlFor={selectId}
          className={cn(
            "text-neutral-100 font-medium",
            compact ? "text-xs" : "text-body-s",
          )}
        >
          {label}
        </label>
      )}

      {/* Input hidden para suporte nativo a FormData */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={currentValue}
          required={required}
        />
      )}

      {/* Botão disparador do Dropdown */}
      <button
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          "w-full px-4 rounded-lg text-left outline-none transition-all flex items-center justify-between cursor-pointer",
          compact ? "py-2 text-xs" : "py-3 text-body-m",
          "bg-primary-dark/20 border border-primary/30",
          isOpen
            ? "border-primary-light bg-primary-dark/30 shadow-[0_0_8px_rgba(168,99,255,0.3)]"
            : "hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed",
          currentOption ? "text-neutral-50" : "text-neutral-400",
        )}
      >
        <span className="truncate">
          {currentOption ? currentOption.label : placeholder}
        </span>
        <ChevronDown
          size={18}
          className={cn(
            "text-neutral-400 transition-transform duration-200 shrink-0",
            isOpen && "rotate-180 text-primary-light",
          )}
        />
      </button>

      {/* Caixa de Opções Flutuante */}
      {isOpen && !disabled && (
        <ul
          role="listbox"
          className="absolute top-[105%] left-0 w-full z-50 bg-popover/95 border border-primary/40 rounded-lg shadow-xl overflow-hidden backdrop-blur-xl max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100"
        >
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === currentValue;
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    "w-full text-left px-4 cursor-pointer transition-colors text-body-s",
                    compact ? "py-2 text-xs" : "py-2.5",
                    isSelected
                      ? "bg-primary/40 text-gold font-bold"
                      : "text-neutral-100 hover:bg-primary/20 hover:text-neutral-50",
                  )}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
