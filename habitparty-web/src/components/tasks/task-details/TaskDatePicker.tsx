"use client";

import { Calendar } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface TaskDatePickerProps {
  dueDate: string;
  onDateChange: (newDate: string) => void;
}

export function TaskDatePicker({ dueDate, onDateChange }: TaskDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelectDate = (dateVal: string) => {
    onDateChange(dateVal);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 text-gold hover:text-gold-hover transition-colors font-medium text-xs px-1.5 py-0.5 rounded hover:bg-white/5 cursor-pointer"
        title="Clique para alterar a data"
      >
        <Calendar size={13} className="text-gold shrink-0" />
        <span>{dueDate || "Sem prazo"}</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 bg-[#160b2b] border border-primary/40 rounded-lg p-2.5 shadow-xl flex flex-col gap-2 min-w-[200px] animate-in fade-in duration-100">
          <span className="text-tiny font-bold text-neutral-300">
            Data de Entrega / Prazo
          </span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => handleSelectDate(e.target.value)}
            className="bg-background/80 border border-primary/40 rounded px-2 py-1 text-xs text-neutral-100 focus:outline-none focus:border-gold"
          />
          <div className="flex justify-between items-center pt-1 border-t border-white/10">
            <button
              type="button"
              onClick={() => handleSelectDate("")}
              className="text-tiny text-neutral-400 hover:text-danger-500 cursor-pointer"
            >
              Sem data
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-tiny text-gold font-bold hover:underline cursor-pointer"
            >
              Concluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
