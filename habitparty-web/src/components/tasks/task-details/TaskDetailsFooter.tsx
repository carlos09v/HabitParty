"use client";

import { Baseline, MoreHorizontal, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils";

interface TaskDetailsFooterProps {
  columnTitle?: string;
  showFormatToolbar: boolean;
  onToggleFormatToolbar: () => void;
  onDeleteTask: () => void;
}

export function TaskDetailsFooter({
  columnTitle,
  showFormatToolbar,
  onToggleFormatToolbar,
  onDeleteTask,
}: TaskDetailsFooterProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(e.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  return (
    <div className="flex items-center justify-between pt-0.5 border-t border-white/8 mt-0.5">
      {columnTitle ? (
        <span className="px-2 py-0.5 rounded-md bg-white/6 border border-white/10 text-neutral-300 text-tiny font-medium truncate max-w-[170px]">
          {columnTitle}
        </span>
      ) : (
        <div />
      )}

      <div
        ref={menuContainerRef}
        className="relative flex items-center gap-1.5"
      >
        {/* Botão de Formatação de Texto (A com linha) */}
        <button
          type="button"
          onClick={onToggleFormatToolbar}
          title="Formatação de texto (Negrito, Destacar, Lista)"
          className={cn(
            "p-1.5 rounded-md transition-colors cursor-pointer",
            showFormatToolbar
              ? "bg-gold text-neutral-900 shadow-glow-gold-xs font-bold"
              : "text-neutral-300 hover:text-gold hover:bg-white/8",
          )}
          aria-label="Alternar barra de formatação de texto"
        >
          <Baseline size={15} />
        </button>

        {/* Menu de Mais Opções */}
        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          title="Mais opções"
          className="p-1.5 rounded-md text-neutral-300 hover:text-gold hover:bg-white/8 transition-colors cursor-pointer"
        >
          <MoreHorizontal size={15} />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 bottom-full mb-1.5 w-32 bg-[#160b2b] border border-primary/40 rounded-lg shadow-xl py-1 z-50 animate-in fade-in duration-100">
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onDeleteTask();
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-danger-500 hover:bg-danger-500/10 cursor-pointer"
            >
              <Trash2 size={12} />
              <span>Excluir tarefa</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
