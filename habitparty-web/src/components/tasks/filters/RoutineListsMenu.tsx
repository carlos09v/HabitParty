"use client";

import { ChevronDown, Columns3, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { RoutineListsMenuProps } from "@/types/task";
import { cn } from "@/utils";

export function RoutineListsMenu({
  columnsCount = 4,
  maxColumns = 4,
  columnsList = [],
  visibleColumnIds = [],
  onToggleColumnVisibility,
  isCompact = false,
}: RoutineListsMenuProps) {
  const [showListMenu, setShowListMenu] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowListMenu(!showListMenu)}
        title="Gerenciar quais listas estão visíveis na tela"
        className={cn(
          "flex items-center gap-1.5 rounded-lg bg-surface border border-white/15 text-neutral-200 font-semibold shadow-xs hover:border-gold/50 hover:bg-surface-hover transition-all cursor-pointer select-none",
          isCompact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2.5 text-body-s",
        )}
      >
        <Columns3 size={isCompact ? 14 : 15} className="text-primary-light" />
        <span>Lista</span>
        <span className="text-gold font-bold">
          {columnsCount}/{maxColumns}
        </span>
        <ChevronDown
          size={isCompact ? 12 : 14}
          className={cn(
            "text-neutral-400 transition-transform",
            showListMenu && "rotate-180",
          )}
        />
      </button>

      {showListMenu && (
        <>
          <button
            type="button"
            aria-label="Fechar menu de listas"
            className="fixed inset-0 z-40 cursor-default bg-transparent border-none p-0 m-0"
            onClick={() => setShowListMenu(false)}
          />

          <div className="absolute right-0 top-full mt-2 w-72 rounded-xl bg-popover border border-white/20 p-3 shadow-popover-dark z-50 animate-in fade-in zoom-in-95 backdrop-blur-md">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10 mb-2">
              <span className="text-xs font-bold text-neutral-100">
                Listas de Rotina
              </span>
              <span className="text-tiny font-bold text-gold">
                {visibleColumnIds.length}/4 visíveis
              </span>
            </div>

            <p className="text-label-g text-neutral-400 mb-2 leading-snug">
              Até 4 listas ocupam a tela toda. As demais permanecem salvas aqui:
            </p>

            <div className="flex flex-col gap-1 max-h-56 overflow-y-auto custom-scrollbar">
              {columnsList.map((col) => {
                const isVisible = visibleColumnIds.includes(col.id);
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => onToggleColumnVisibility?.(col.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer",
                      isVisible
                        ? "bg-white/10 text-neutral-50 border border-white/15"
                        : "bg-white/3 text-neutral-400 hover:text-neutral-200 hover:bg-white/6",
                    )}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {isVisible ? (
                        <Eye size={13} className="text-gold shrink-0" />
                      ) : (
                        <EyeOff
                          size={13}
                          className="text-neutral-500 shrink-0"
                        />
                      )}
                      <span className="truncate">{col.title}</span>
                    </div>

                    <span className="text-tiny font-bold px-1.5 py-0.5 rounded-full bg-white/8 text-neutral-300 shrink-0">
                      {col.tasksCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
