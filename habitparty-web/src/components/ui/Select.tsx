"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { SelectProps } from "@/types/ui";
import { cn } from "@/utils";

export function Select({
  label,
  options,
  placeholder,
  compact = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2 w-full relative">
      <span
        className={cn("text-neutral-100", compact ? "text-xs" : "text-body-s")}
      >
        {label}
      </span>

      {/* Botão que simula o Input */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 rounded-lg text-left outline-none transition-all flex items-center justify-between",
          compact ? "py-2 text-xs" : "py-3 text-body-m",
          "bg-primary-dark/20 border border-primary/30",
          isOpen
            ? "border-primary-light bg-primary-dark/30 shadow-[0_0_8px_rgba(168,99,255,0.3)]"
            : "",
          selected ? "text-neutral-50" : "text-neutral-500",
        )}
      >
        {selected || placeholder}
        <ChevronDown
          size={20}
          className={cn(
            "transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Caixa de Opções (Listbox / Menu) */}
      {isOpen && (
        <ul className="absolute top-[105%] left-0 w-full z-50 bg-background border border-primary/40 rounded-lg shadow-xl overflow-hidden backdrop-blur-xl">
          {options.map((option) => (
            <li key={option}>
              <button
                type="button"
                onClick={() => {
                  setSelected(option);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left px-4 text-neutral-50 cursor-pointer hover:bg-primary/30 transition-colors",
                  compact ? "py-2 text-xs" : "py-3 text-body-m",
                )}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
