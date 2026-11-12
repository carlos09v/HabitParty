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
import { useTranslations } from "next-intl";
import { useState } from "react";
import { UpgradePremiumModal } from "@/components/subscription/UpgradePremiumModal";
import { SlideOverDrawer } from "@/components/ui/SlideOverDrawer";
import { Switch } from "@/components/ui/Switch";
import { getColumnIcon } from "@/constants/routine";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { RoutineColumnsDrawerProps } from "@/types/task-ui";
import { cn } from "@/utils";

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
  const t = useTranslations("tasks.columnsDrawer");
  const { isGamified } = useExperienceMode();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  if (!isOpen) return null;

  const canCreateMore = columns.length < maxColumns;
  const allVisible =
    columns.length > 0 &&
    columns.every((c) => visibleColumnIds.includes(c.id)) &&
    visibleColumnIds.length <= maxColumns;

  return (
    <>
      <SlideOverDrawer
        isOpen={isOpen}
        onClose={onClose}
        ariaLabel={t("dialogAria")}
        backdropAriaLabel={t("backdropAria")}
        panelClassName="w-full sm:w-[420px]"
      >
        {/* Header */}
        <header className="p-5 border-b border-neutral-700 dark:border-white/10 flex items-start justify-between gap-3 bg-surface/60 dark:bg-surface-hover/30">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 text-primary dark:bg-primary-light/15 dark:border-primary-light/30 flex items-center justify-center dark:text-primary-light shrink-0">
                <Columns3 size={17} />
              </div>
              <div>
                <h2 className="text-body-m font-bold text-neutral-50 leading-tight">
                  {t("title")}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-tiny font-bold text-amber-700 dark:text-gold">
                    {t("activeCount", {
                      visible: visibleColumnIds.length,
                      max: maxColumns,
                    })}
                  </span>
                  <span className="text-neutral-500">•</span>
                  <span className="text-tiny text-neutral-400">
                    {t("createdCount", { total: columns.length })}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-label-s text-neutral-400 mt-1 leading-snug">
              {t("description", {
                plan: isPremium ? "Premium" : "Free",
                max: maxColumns,
              })}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t("closeAria")}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </header>

        {/* Toolbar de Ações Rápidas */}
        <div className="px-5 py-3 border-b border-neutral-700 dark:border-white/8 bg-surface/80 dark:bg-surface/50 flex items-center justify-between gap-2">
          {!allVisible && columns.length > 0 && (
            <button
              type="button"
              onClick={onShowAll}
              className="text-xs font-semibold text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Eye size={13} />
              <span>
                {t("showAllCountButton", {
                  count: Math.min(columns.length, maxColumns),
                })}
              </span>
            </button>
          )}

          <div className="ml-auto">
            {!canCreateMore && !isPremium ? (
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(true)}
                title={t("maxColumnsReachedTitle", { max: maxColumns })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-800 dark:bg-gold/15 dark:hover:bg-gold/25 dark:border-gold/40 dark:text-gold shadow-xs dark:shadow-glow-gold-xs transition-[transform,background-color,color,border-color] active:scale-98 cursor-pointer"
              >
                <Crown size={14} className="shrink-0" />
                <span>{t("unlockMoreColumnsButton")}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onOpenCreateColumn();
                  onClose();
                }}
                disabled={!canCreateMore}
                title={
                  canCreateMore
                    ? t("createNewListTitle")
                    : t("maxColumnsReachedTitle", { max: maxColumns })
                }
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-[transform,background-color,color,border-color] cursor-pointer",
                  canCreateMore
                    ? "bg-gold hover:bg-gold-hover text-on-gold shadow-xs dark:shadow-glow-gold-xs active:scale-98"
                    : "bg-neutral-700 text-neutral-400 cursor-not-allowed border border-neutral-600 dark:bg-white/5 dark:text-neutral-500 dark:border-white/10",
                )}
              >
                <Plus size={14} className="stroke-3" />
                <span>{t("newColumnButton")}</span>
              </button>
            )}
          </div>
        </div>

        {/* Lista de Colunas */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-2.5">
          {columns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-400 gap-2">
              <Columns3 size={32} className="opacity-40 text-neutral-500" />
              <p className="text-body-s font-medium">{t("emptyState")}</p>
              <button
                type="button"
                onClick={() => {
                  onOpenCreateColumn();
                  onClose();
                }}
                className="mt-2 px-3 py-1.5 rounded-lg bg-gold text-on-gold font-bold text-xs"
              >
                {t("createFirstColumnButton")}
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
                    "p-3 rounded-xl border transition-[transform,background-color,border-color,opacity] flex items-center justify-between gap-3 select-none",
                    isOnlyVisible
                      ? "cursor-not-allowed"
                      : "cursor-pointer hover:border-primary/40 dark:hover:border-gold/50 hover:bg-card-hover dark:hover:bg-surface-hover/70 active:scale-[0.99]",
                    isVisible
                      ? "bg-card border-neutral-700 dark:border-white/15 shadow-xs dark:shadow-sm"
                      : "bg-surface/60 dark:bg-surface/40 border-neutral-700/60 dark:border-white/5 opacity-75 hover:opacity-100",
                  )}
                >
                  {/* Ícone e Título da Coluna */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                        isVisible
                          ? "bg-primary/10 border-primary/25 text-primary dark:bg-primary-light/15 dark:border-primary-light/30 dark:text-gold"
                          : "bg-surface border-neutral-700/60 text-neutral-400 dark:bg-white/5 dark:border-white/10 dark:text-neutral-500",
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
                          {taskCount}{" "}
                          {taskCount === 1
                            ? t("taskSingular")
                            : t("taskPlural")}
                        </span>
                        <span>•</span>
                        <span
                          className={
                            isVisible
                              ? "text-success-500 font-medium"
                              : "text-neutral-400"
                          }
                        >
                          {isVisible
                            ? t("visibleOnBoard")
                            : t("hiddenFromBoard")}
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
                      title={t("editColumnTitle")}
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
                      title={t("deleteColumnTitle")}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-danger-500 hover:bg-danger-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>

                    <div
                      title={
                        isOnlyVisible
                          ? t("onlyVisibleTitle")
                          : isVisible
                            ? t("toggleHideTitle")
                            : t("toggleShowTitle")
                      }
                    >
                      <Switch
                        size="sm"
                        checked={isVisible}
                        disabled={isOnlyVisible}
                        onCheckedChange={() => onToggleVisibility(col.id)}
                        thumbContent={
                          isVisible ? (
                            <Eye size={10} className="text-white" />
                          ) : (
                            <EyeOff size={10} className="text-neutral-500" />
                          )
                        }
                        aria-label={t("toggleSwitchAria", { title: col.title })}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé Informativo */}
        <footer className="p-4 border-t border-neutral-700 dark:border-white/10 bg-surface/60 dark:bg-surface-hover/20 flex flex-col gap-3">
          {!isPremium && columns.length > maxColumns && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 dark:bg-gold/10 dark:border-gold/30 p-3 flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <Crown
                  size={16}
                  className="text-amber-700 dark:text-gold shrink-0 mt-0.5"
                />
                <div className="flex flex-col text-label-s">
                  <span className="font-bold text-amber-800 dark:text-gold">
                    {columns.length - maxColumns === 1
                      ? isGamified
                        ? t("storedInBackpackSingular", {
                            count: columns.length - maxColumns,
                          })
                        : t("storedInBackpackSingularProductivity", {
                            count: columns.length - maxColumns,
                          })
                      : isGamified
                        ? t("storedInBackpackPlural", {
                            count: columns.length - maxColumns,
                          })
                        : t("storedInBackpackPluralProductivity", {
                            count: columns.length - maxColumns,
                          })}
                  </span>
                  <p className="text-neutral-400 text-tiny leading-relaxed">
                    {isGamified
                      ? t("storedInBackpackDesc", { max: maxColumns })
                      : t("storedInBackpackDescProductivity", {
                          max: maxColumns,
                        })}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(true)}
                className="w-full py-1.5 px-3 rounded-lg bg-gold hover:bg-gold-hover text-on-gold font-bold text-xs flex items-center justify-center gap-1.5 transition-[transform,background-color] shadow-xs cursor-pointer active:scale-98"
              >
                <Crown size={13} className="shrink-0 stroke-2" />
                <span>{t("showAllWithPremium")}</span>
              </button>
            </div>
          )}

          <div className="rounded-xl bg-card border border-neutral-700 dark:border-white/10 p-3 flex items-start gap-2.5">
            <Sparkles size={16} className="text-gold shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5 text-label-s text-neutral-300">
              <span className="font-bold text-neutral-100">
                {isPremium ? t("premiumBenefitTitle") : t("routineBoardTitle")}
              </span>
              <p className="text-neutral-400 text-tiny leading-relaxed">
                {isPremium ? t("premiumBenefitDesc") : t("freeBenefitDesc")}
              </p>
            </div>
          </div>
        </footer>
      </SlideOverDrawer>

      {isUpgradeModalOpen && (
        <UpgradePremiumModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
        />
      )}
    </>
  );
}
