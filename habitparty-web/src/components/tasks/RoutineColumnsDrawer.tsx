"use client";

import {
  Columns3,
  Crown,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { UpgradePremiumModal } from "@/components/subscription/UpgradePremiumModal";
import { Switch } from "@/components/ui/Switch";
import { getColumnIcon } from "@/constants/routine";
import type { BoardColumn } from "@/types/task";
import { cn } from "@/utils";

interface RoutineColumnsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  columns: BoardColumn[];
  visibleColumnIds: string[];
  maxColumns: number;
  isPremium: boolean;
  onToggleVisibility: (columnId: string) => void;
  onShowAll: () => void;
  onOpenCreateColumn: () => void;
  onEditColumn: (column: BoardColumn) => void;
  onDeleteColumn: (column: BoardColumn) => void;
}

export function RoutineColumnsDrawer({
  isOpen,
  onClose,
  columns,
  visibleColumnIds,
  maxColumns,
  isPremium,
  onToggleVisibility,
  onShowAll,
  onOpenCreateColumn,
  onEditColumn,
  onDeleteColumn,
}: RoutineColumnsDrawerProps) {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const canCreateMore = columns.length < maxColumns;
  const allVisible =
    columns.length > 0 &&
    columns.every((c) => visibleColumnIds.includes(c.id)) &&
    visibleColumnIds.length <= maxColumns;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Gerenciador de Colunas do Quadro"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Fechar gaveta de colunas"
        onClick={onClose}
        className="fixed inset-0 bg-neutral-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 cursor-default border-none p-0 m-0 w-full h-full"
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] max-w-full bg-surface border-l border-white/10 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 ease-out">
        {/* Header */}
        <header className="p-5 border-b border-white/10 flex items-start justify-between gap-3 bg-surface-hover/30">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-light/15 border border-primary-light/30 flex items-center justify-center text-primary-light shrink-0">
                <Columns3 size={17} />
              </div>
              <div>
                <h2 className="text-body-m font-bold text-neutral-50 leading-tight">
                  Gerenciar Colunas
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-tiny font-bold text-gold">
                    {visibleColumnIds.length}/{maxColumns} ativas
                  </span>
                  <span className="text-neutral-500">•</span>
                  <span className="text-tiny text-neutral-400">
                    {columns.length} criadas
                  </span>
                </div>
              </div>
            </div>
            <p className="text-label-s text-neutral-400 mt-1 leading-snug">
              Ative ou oculte colunas para personalizar seu foco. Usuários{" "}
              {isPremium ? "Premium" : "Free"} podem manter até {maxColumns}{" "}
              colunas ativas ao mesmo tempo.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </header>

        {/* Toolbar de Ações Rápidas */}
        <div className="px-5 py-3 border-b border-white/8 bg-surface/50 flex items-center justify-between gap-2">
          {!allVisible && columns.length > 0 && (
            <button
              type="button"
              onClick={onShowAll}
              className="text-xs font-semibold text-primary-light hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Eye size={13} />
              <span>Exibir todas ({Math.min(columns.length, maxColumns)})</span>
            </button>
          )}

          <div className="ml-auto">
            <button
              type="button"
              onClick={() => {
                onOpenCreateColumn();
                onClose();
              }}
              disabled={!canCreateMore}
              title={
                canCreateMore
                  ? "Criar nova lista"
                  : `Limite máximo de ${maxColumns} colunas atingido`
              }
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                canCreateMore
                  ? "bg-gold hover:bg-gold-hover text-neutral-900 shadow-glow-gold-xs active:scale-98"
                  : "bg-white/5 text-neutral-500 cursor-not-allowed border border-white/10",
              )}
            >
              <Plus size={14} className="stroke-3" />
              <span>Nova Coluna</span>
            </button>
          </div>
        </div>

        {/* Lista de Colunas */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-2.5">
          {columns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-400 gap-2">
              <Columns3 size={32} className="opacity-40 text-neutral-500" />
              <p className="text-body-s font-medium">
                Nenhuma coluna cadastrada neste workspace.
              </p>
              <button
                type="button"
                onClick={() => {
                  onOpenCreateColumn();
                  onClose();
                }}
                className="mt-2 px-3 py-1.5 rounded-lg bg-gold text-neutral-900 font-bold text-xs"
              >
                Criar primeira coluna
              </button>
            </div>
          ) : (
            columns.map((col) => {
              const isVisible = visibleColumnIds.includes(col.id);
              const isOnlyVisible = isVisible && visibleColumnIds.length === 1;
              const ColumnIconComponent = getColumnIcon(col.icon);
              const taskCount = col.tasks.length;

              return (
                // biome-ignore lint/a11y/useKeyWithClickEvents: Card clicavel para alternar visibilidade da coluna
                // biome-ignore lint/a11y/noStaticElementInteractions: Card clicavel com botoes internos de acao
                <div
                  key={col.id}
                  onClick={() => {
                    if (!isOnlyVisible) {
                      onToggleVisibility(col.id);
                    }
                  }}
                  className={cn(
                    "p-3 rounded-xl border transition-all flex items-center justify-between gap-3 select-none",
                    isOnlyVisible
                      ? "cursor-not-allowed"
                      : "cursor-pointer hover:border-gold/50 hover:bg-surface-hover/70 active:scale-[0.99]",
                    isVisible
                      ? "bg-card border-white/15 shadow-sm"
                      : "bg-surface/40 border-white/5 opacity-70 hover:opacity-100",
                  )}
                >
                  {/* Ícone e Título da Coluna */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                        isVisible
                          ? "bg-primary-light/15 border-primary-light/30 text-gold"
                          : "bg-white/5 border-white/10 text-neutral-500",
                      )}
                    >
                      <ColumnIconComponent size={18} />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-body-s font-bold text-neutral-100 truncate">
                          {col.title}
                        </span>
                      </div>
                      <span className="text-tiny text-neutral-400 flex items-center gap-1 mt-0.5">
                        <span>
                          {taskCount} {taskCount === 1 ? "tarefa" : "tarefas"}
                        </span>
                        <span>•</span>
                        <span
                          className={
                            isVisible
                              ? "text-success-500 font-medium"
                              : "text-neutral-400"
                          }
                        >
                          {isVisible ? "Visível no quadro" : "Oculta do quadro"}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Switch e Ações */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditColumn(col);
                        onClose();
                      }}
                      title="Editar nome ou ícone"
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteColumn(col);
                        onClose();
                      }}
                      title="Excluir coluna"
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-danger-500 hover:bg-danger-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>

                    <div
                      title={
                        isOnlyVisible
                          ? "Pelo menos uma coluna precisa ficar visível"
                          : isVisible
                            ? "Ocultar do quadro"
                            : "Exibir no quadro"
                      }
                    >
                      <Switch
                        size="sm"
                        checked={isVisible}
                        disabled={isOnlyVisible}
                        onCheckedChange={() => onToggleVisibility(col.id)}
                        thumbContent={
                          isVisible ? (
                            <Eye size={10} className="text-neutral-900" />
                          ) : (
                            <EyeOff size={10} className="text-neutral-500" />
                          )
                        }
                        aria-label={`Alternar visibilidade da coluna ${col.title}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé Informativo */}
        <footer className="p-4 border-t border-white/10 bg-surface-hover/20 flex flex-col gap-3">
          {!isPremium && columns.length > maxColumns && (
            <div className="rounded-xl bg-gold/10 border border-gold/30 p-3 flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <Crown size={16} className="text-gold shrink-0 mt-0.5" />
                <div className="flex flex-col text-label-s">
                  <span className="font-bold text-gold">
                    {columns.length - maxColumns}{" "}
                    {columns.length - maxColumns === 1
                      ? "coluna guardada na mochila"
                      : "colunas guardadas na mochila"}
                  </span>
                  <p className="text-neutral-400 text-tiny leading-relaxed">
                    No plano Free, até {maxColumns} colunas ficam ativas no
                    quadro. Suas listas e tarefas estão 100% preservadas! Faça
                    upgrade para exibir todas ao mesmo tempo.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(true)}
                className="w-full py-1.5 px-3 rounded-lg bg-gold hover:bg-gold-hover text-neutral-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
              >
                <Crown size={13} className="shrink-0 stroke-2" />
                <span>Exibir todas com Premium 👑</span>
              </button>
            </div>
          )}

          <div className="rounded-xl bg-card border border-white/10 p-3 flex items-start gap-2.5">
            <Sparkles size={16} className="text-gold shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5 text-label-s text-neutral-300">
              <span className="font-bold text-neutral-100">
                {isPremium ? "Benefício Premium Ativo" : "Quadro de Rotinas"}
              </span>
              <p className="text-neutral-400 text-tiny leading-relaxed">
                {isPremium
                  ? "Você pode manter até 6 colunas ativas ao mesmo tempo! O quadro ajusta o scroll horizontal suavemente para navegar entre elas."
                  : "No plano Free você pode alternar até 4 colunas ativas. Faça upgrade para Premium para desbloquear até 6 colunas simultâneas!"}
              </p>
            </div>
          </div>
        </footer>
      </div>

      <UpgradePremiumModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </div>
  );
}
