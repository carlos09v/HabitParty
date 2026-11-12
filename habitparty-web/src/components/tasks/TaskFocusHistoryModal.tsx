"use client";

import {
  Calendar,
  CheckCircle2,
  FileText,
  History,
  Loader2,
  Sparkles,
  Timer,
  Trash2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { getTaskFocusRecords } from "@/actions/focusActions";
import { BaseModal } from "@/components/ui/BaseModal";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Pagination } from "@/components/ui/Pagination";
import { useDateFormat } from "@/hooks/useDateFormat";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { executeDeleteFocusRecord } from "@/hooks/useFocusMutations";
import { useTimeFormat } from "@/hooks/useTimeFormat";
import type { AppLocale } from "@/i18n/config";
import type { FocusRecord } from "@/types/focus";
import type { Task } from "@/types/task";
import { formatCoins, formatDateTime } from "@/utils";
import {
  formatDurationMinutes,
  formatFocusRecordDuration,
} from "@/utils/focusFormatters";
import { mapFocusRecords } from "@/utils/focusMapper";

export interface TaskFocusHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onTaskUpdate?: (updatedTask: Task) => void;
}

export function TaskFocusHistoryModal({
  isOpen,
  onClose,
  task,
  onTaskUpdate,
}: TaskFocusHistoryModalProps) {
  const t = useTranslations("tasks.detailsPopover.focusHistoryModal");
  const locale = useLocale() as AppLocale;
  const { isGamified } = useExperienceMode();
  const { dateFormat } = useDateFormat();
  const { timeFormat } = useTimeFormat();

  const [page, setPage] = useState(0);
  const [records, setRecords] = useState<FocusRecord[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [localMinutes, setLocalMinutes] = useState(
    task?.totalFocusMinutes ?? 0,
  );
  const [localCycles, setLocalCycles] = useState(task?.focusCyclesCount ?? 0);

  const [pendingDeleteRecord, setPendingDeleteRecord] =
    useState<FocusRecord | null>(null);
  const [deleteHistory, setDeleteHistory] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (task) {
      setLocalMinutes(task.totalFocusMinutes ?? 0);
      setLocalCycles(task.focusCyclesCount ?? 0);
    }
  }, [task]);

  const loadPage = useCallback(
    async (pageToLoad: number) => {
      if (!task?.id) return;
      setIsLoading(true);
      try {
        const res = await getTaskFocusRecords(task.id, pageToLoad);
        if (res.success && res.data) {
          setRecords(mapFocusRecords(res.data.records));
          setTotalPages(res.data.totalPages);
          setTotalElements(res.data.totalElements);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [task?.id],
  );

  useEffect(() => {
    if (isOpen && task?.id) {
      setPage(0);
      void loadPage(0);
    }
  }, [isOpen, task?.id, loadPage]);

  const handlePageChange = (newPageOneBased: number) => {
    const nextZeroBased = Math.max(0, newPageOneBased - 1);
    setPage(nextZeroBased);
    void loadPage(nextZeroBased);
  };

  const handleRequestDelete = (record: FocusRecord) => {
    setDeleteHistory(false);
    setPendingDeleteRecord(record);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteRecord || !task) return;
    setIsDeleting(true);
    try {
      await executeDeleteFocusRecord(
        pendingDeleteRecord.id,
        {
          success: t("deleteRecordSuccess"),
          error: t("deleteRecordError"),
        },
        () => {
          const removedMins = pendingDeleteRecord.durationMinutes;
          const removedPomos = pendingDeleteRecord.completedPomos ?? 0;
          const nextMins = Math.max(0, localMinutes - removedMins);
          const nextCycles = Math.max(0, localCycles - removedPomos);

          setLocalMinutes(nextMins);
          setLocalCycles(nextCycles);

          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("habitparty:task-focus-recorded", {
                detail: {
                  taskId: task.id,
                  durationMinutes: -removedMins,
                  cycles: -removedPomos,
                },
              }),
            );
          }

          onTaskUpdate?.({
            ...task,
            totalFocusMinutes: nextMins,
            focusCyclesCount: nextCycles,
          });

          // Se era o único registro desta página e não é a primeira, recua
          if (records.length <= 1 && page > 0) {
            const previousPage = page - 1;
            setPage(previousPage);
            void loadPage(previousPage);
          } else {
            void loadPage(page);
          }
        },
        deleteHistory,
      );
      setPendingDeleteRecord(null);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !task) return null;

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="max-w-2xl"
        title={t("title")}
        description={task.title}
        headerExtra={
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:bg-gold/15 dark:border-gold/40 flex items-center justify-center dark:text-gold shrink-0">
            <History size={16} />
          </div>
        }
      >
        <div className="flex flex-col gap-3 mt-1">
          {/* Barra de Resumo de Esforço Acumulado */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 rounded-xl bg-surface/70 border border-neutral-700 dark:border-primary/25">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:bg-gold/15 dark:border-gold/30 dark:text-gold flex items-center justify-center shrink-0">
                <Timer size={15} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-tiny text-neutral-400">
                  {t("totalAccumulated")}
                </span>
                <span className="text-xs font-bold text-neutral-100 truncate">
                  {formatDurationMinutes(localMinutes)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 text-primary dark:bg-primary-dark/40 dark:border-primary/30 dark:text-primary-light flex items-center justify-center shrink-0">
                <CheckCircle2 size={15} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-tiny text-neutral-400">
                  {t("cyclesLabel", { cycles: localCycles })}
                </span>
                <span className="text-xs font-bold text-neutral-100 truncate">
                  {localCycles}
                </span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Calendar size={15} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-tiny text-neutral-400">
                  {t("sessionsCount", { count: totalElements })}
                </span>
                <span className="text-xs font-bold text-neutral-100 truncate">
                  {totalElements}
                </span>
              </div>
            </div>
          </div>

          {/* Lista de Registros */}
          <div className="flex flex-col gap-2 min-h-[220px] max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-neutral-400">
                <Loader2 size={24} className="animate-spin text-gold" />
                <span className="text-xs">{t("loading")}</span>
              </div>
            ) : records.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl border border-dashed border-neutral-700 dark:border-primary/30 bg-card/40">
                <History size={28} className="text-neutral-500 mb-2" />
                <span className="text-xs font-bold text-neutral-200">
                  {t("emptyTitle")}
                </span>
                <p className="text-tiny text-neutral-400 mt-1 max-w-sm">
                  {t("emptyDescription")}
                </p>
              </div>
            ) : (
              records.map((rec) => {
                const durationFormatted = formatFocusRecordDuration(
                  rec.startTime,
                  rec.endTime,
                  rec.durationMinutes,
                );

                return (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-card dark:bg-surface/60 border border-neutral-700/80 dark:border-primary/20 hover:border-amber-500/40 dark:hover:border-gold/40 transition-colors"
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-neutral-100 truncate">
                          {rec.activityName || t("directTaskFocus")}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-tiny font-bold bg-amber-500/15 border border-amber-500/35 text-amber-800 dark:bg-gold/15 dark:border-gold/30 dark:text-gold shrink-0">
                          {durationFormatted}
                        </span>
                        {rec.completedPomos && rec.completedPomos > 0 ? (
                          <span className="px-1.5 py-0.5 rounded text-tiny font-semibold bg-emerald-500/15 border border-emerald-500/35 text-emerald-700 dark:text-emerald-400 shrink-0">
                            ✓ {rec.completedPomos} Pomo
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2 text-tiny text-neutral-400 mt-0.5 flex-wrap">
                        <span>
                          {formatDateTime(rec.endTime || rec.startTime, {
                            isLocal: true,
                            locale,
                            dateFormat,
                            timeFormat,
                          })}
                        </span>

                        {((rec.xpEarned ?? 0) > 0 ||
                          (rec.coinsEarned ?? 0) > 0) && (
                          <span className="inline-flex items-center gap-1.5 text-neutral-300">
                            <span>•</span>
                            <span className="inline-flex items-center gap-0.5 text-primary-light font-semibold">
                              <Sparkles size={10} />+{rec.xpEarned ?? 0}{" "}
                              {isGamified ? "XP" : "pts"}
                            </span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-0.5 text-gold font-semibold">
                              +{formatCoins(rec.coinsEarned ?? 0, { locale })}
                              <CoinIcon size={10} />
                            </span>
                          </span>
                        )}
                      </div>

                      {rec.notes && (
                        <div className="flex items-start gap-1 mt-1 text-tiny text-neutral-300 bg-surface/70 rounded-md px-2 py-1 border border-neutral-700/60 dark:border-white/5">
                          <FileText
                            size={11}
                            className="text-neutral-400 shrink-0 mt-0.5"
                          />
                          <span className="line-clamp-2 italic">
                            "{rec.notes}"
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRequestDelete(rec)}
                      title={t("deleteRecordAria")}
                      aria-label={t("deleteRecordAria")}
                      className="p-1.5 rounded-lg border border-transparent hover:border-red-500/40 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <Pagination
              currentPage={page + 1}
              totalPages={totalPages}
              totalItems={totalElements}
              itemsPerPage={20}
              itemLabel={t("paginationItemLabel")}
              isCompact
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </BaseModal>

      {/* Confirmação de Exclusão de Registro */}
      {pendingDeleteRecord && (
        <ConfirmationModal
          isOpen={pendingDeleteRecord !== null}
          onClose={() => !isDeleting && setPendingDeleteRecord(null)}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
          title={t("deleteConfirmTitle")}
          description={
            <p>
              {t.rich("deleteConfirmDescription", {
                duration: formatDurationMinutes(
                  pendingDeleteRecord.durationMinutes,
                ),
                strong: (chunks) => (
                  <strong className="text-neutral-100">{chunks}</strong>
                ),
              })}
            </p>
          }
          confirmText={t("deleteConfirmButton")}
          variant="danger"
          checkboxLabel={t("deleteHistoryLabel")}
          checkboxHint={t("deleteHistoryHint")}
          checkboxChecked={deleteHistory}
          onCheckboxChange={setDeleteHistory}
        />
      )}
    </>
  );
}
