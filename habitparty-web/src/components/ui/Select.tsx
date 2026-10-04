"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils";

interface SelectProps {
  label: string;
  options: string[];
  placeholder: string;
}

export function Select({ label, options, placeholder }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2 w-full relative">
      <label className="text-body-s text-neutral-100">{label}</label>

      {/* Botão que simula o Input */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 py-3 rounded-lg text-left text-body-m outline-none transition-all flex items-center justify-between",
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
            <li
              key={option}
              onClick={() => {
                setSelected(option);
                setIsOpen(false);
              }}
              className="px-4 py-3 text-body-m text-neutral-50 cursor-pointer hover:bg-primary/30 transition-colors"
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
