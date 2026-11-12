"use client";

import {
  Backpack,
  Check,
  Clock,
  FileText,
  Flame,
  History,
  Hourglass,
  ListTodo,
  Minus,
  Plus,
  Sparkles,
  Target,
  Timer,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { BaseModal } from "@/components/ui/BaseModal";
import { DatePicker } from "@/components/ui/DatePicker";
import { Input } from "@/components/ui/Input";
import { RewardPreview } from "@/components/ui/reward/RewardPreview";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { TimePicker } from "@/components/ui/TimePicker";
import {
  FOCUS_MANUAL_PRESETS,
  getFocusIcon,
  MAX_FOCUS_ACTIVITIES_FREE,
} from "@/constants/focus";
import { useFocusManualRecordForm } from "@/hooks/useFocusManualRecordForm";
import type {
  FocusActivity,
  FocusableTaskItem,
  FocusRecord,
} from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { cn } from "@/utils";
import { getTodayDateString } from "@/utils/date";
import { getItemRemainingMinutes } from "@/utils/focusFormatters";

interface FocusManualRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: FocusActivity[];
  backpackItems: InventoryItemResponseDTO[];
  focusableTasks?: FocusableTaskItem[];
  records?: FocusRecord[];
  initialActivityId?: string;
  initialItemId?: string;
  initialTaskId?: string;
  onSuccess?: () => void;
}

export function FocusManualRecordModal({
  isOpen,
  onClose,
  activities,
  backpackItems,
  focusableTasks = [],
  records = [],
  initialActivityId,
  initialItemId,
  initialTaskId,
  onSuccess,
}: FocusManualRecordModalProps) {
  const t = useTranslations("focus.manualRecord");
  const form = useFocusManualRecordForm({
    isOpen,
    activities,
    backpackItems,
    focusableTasks,
    records,
    initialActivityId,
    initialItemId,
    initialTaskId,
    onSuccess,
    onClose,
  });

  const SelectedActivityIcon = form.selectedActivity
    ? getFocusIcon(form.selectedActivity.icon || "book")
    : Target;

  const averageMinutesPerPomo =
    form.completedPomos > 0
      ? Math.floor(form.durationMinutes / form.completedPomos)
      : form.durationMinutes;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-3xl"
      preventClose={form.isSubmitting}
      headerIcon={<History size={20} />}
      title={t("title")}
      headerBadge={
        <span className="text-tiny uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 border border-amber-500/30 dark:bg-gold/15 dark:text-gold dark:border-gold/30">
          {t("manualBadge")}
        </span>
      }
      description={t("description")}
    >
      <form onSubmit={form.handleSubmit} className="flex flex-col gap-4 mt-1">
        {/* FORMULÁRIO EM 2 COLUNAS EQUILIBRADAS: ESQUERDA (VÍNCULO/NOTAS) E DIREITA (TEMPO/DATA/HORA) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
          {/* ========================================================
              COLUNA 1 (ESQUERDA): O QUE VOCÊ FOCOU?
              ======================================================== */}
          <div className="flex flex-col gap-3.5 justify-between">
            <div className="flex flex-col gap-3.5">
              {/* Seletor de Vínculo (Atividade vs Mochila) */}
              <div className="flex flex-col gap-1.5">
                <span className="text-body-s text-neutral-100 font-medium">
                  {t("linkSessionLabel")}
                </span>
                <SegmentedControl
                  value={form.targetType}
                  onChange={form.handleTargetTypeChange}
                  options={[
                    {
                      value: "ACTIVITY",
                      label: t("activityOption"),
                      icon: Sparkles,
                      badge: form.selectableActivities.length,
                    },
                    {
                      value: "ITEM",
                      label: t("backpackOption"),
                      icon: Backpack,
                      badge: backpackItems.length,
                    },
                  ]}
                />
              </div>

              {/* Atividade ou Item (Com meta/saldo integrado no próprio cabeçalho, sem card duplicado) */}
              {form.targetType === "ACTIVITY" ? (
                <div className="flex flex-col gap-1.5">
                  <Select
                    id="select-activity"
                    compact
                    icon={<SelectedActivityIcon size={16} />}
                    label={
                      <span className="flex items-center justify-between w-full">
                        <span>{t("activitySelectLabel")}</span>
                        {form.selectedActivity?.targetTimeMinutes && (
                          <span className="text-tiny font-semibold text-amber-800 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30 dark:text-gold dark:bg-gold/10 dark:border-gold/25">
                            {t("targetBadge", {
                              minutes: form.selectedActivity.targetTimeMinutes,
                            })}
                          </span>
                        )}
                      </span>
                    }
                    placeholder={
                      form.selectableActivities.length === 0
                        ? t("noActivitiesAvailable")
                        : t("selectActivityPlaceholder")
                    }
                    emptyMessage={t("noActivitiesAvailable")}
                    value={form.selectedActivityId}
                    onChange={form.handleSelectActivity}
                    options={form.selectableActivities.map((act) => ({
                      value: act.id,
                      label: act.name,
                    }))}
                  />

                  {!form.isPremium &&
                    activities.length > MAX_FOCUS_ACTIVITIES_FREE && (
                      <span className="text-label-g text-amber-700 dark:text-gold/90 font-medium px-1 flex items-center gap-1.5">
                        <span>👑</span>
                        <span>
                          {t("pausedFreePlanNotice", {
                            count:
                              activities.length - MAX_FOCUS_ACTIVITIES_FREE,
                          })}
                        </span>
                      </span>
                    )}

                  {focusableTasks.length > 0 && (
                    <Select
                      id="select-task"
                      compact
                      icon={<ListTodo size={16} />}
                      label={t("taskSelectLabel")}
                      placeholder={t("noTaskLinkedOption")}
                      value={form.selectedTaskId}
                      onChange={form.setSelectedTaskId}
                      options={[
                        { value: "", label: t("noTaskLinkedOption") },
                        ...focusableTasks.map((task) => ({
                          value: task.id,
                          label: task.title,
                        })),
                      ]}
                    />
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <Select
                    id="select-item"
                    compact
                    icon={<Backpack size={16} />}
                    label={
                      <span className="flex items-center justify-between w-full">
                        <span>{t("backpackItemSelectLabel")}</span>
                        {form.selectedItem && (
                          <span className="text-tiny font-semibold text-amber-800 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30 dark:text-gold dark:bg-gold/10 dark:border-gold/25">
                            {t("balanceBadge", {
                              minutes: form.selectedItemMinutes,
                            })}
                          </span>
                        )}
                      </span>
                    }
                    placeholder={
                      backpackItems.length === 0
                        ? t("noItemsAvailable")
                        : t("selectItemPlaceholder")
                    }
                    emptyMessage={t("noItemsAvailable")}
                    value={form.selectedItemId}
                    onChange={form.handleSelectBackpackItem}
                    options={backpackItems.map((item) => {
                      const mins = getItemRemainingMinutes(
                        item.remainingSeconds,
                      );
                      return {
                        value: item.inventoryItemId || "",
                        label: `${item.rewardName || t("defaultFocusItemName")}${mins > 0 ? ` (${mins}m)` : ""}`,
                      };
                    })}
                  />
                </div>
              )}

              {/* Modo Pomodoro ou Cronômetro (quando atividade) */}
              {form.targetType !== "ITEM" && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-body-s text-neutral-100 font-medium">
                    {t("sessionModeLabel")}
                  </span>
                  <SegmentedControl
                    value={form.recordType}
                    onChange={form.setRecordType}
                    options={[
                      {
                        value: "POMO",
                        label: t("modePomoOption"),
                        icon: Timer,
                      },
                      {
                        value: "STOPWATCH",
                        label: t("modeStopwatchOption"),
                        icon: Hourglass,
                      },
                    ]}
                  />
                </div>
              )}
            </div>

            {/* Anotações / Observações */}
            <Textarea
              id="record-notes"
              label={t("notesLabel")}
              icon={<FileText size={14} />}
              rows={form.targetType === "ITEM" ? 4 : 2}
              value={form.notes}
              onChange={(e) => form.setNotes(e.target.value)}
              placeholder={t("notesPlaceholder")}
              maxLength={250}
            />
          </div>

          {/* ========================================================
              COLUNA 2 (DIREITA): PAINEL UNIFICADO DE TEMPO & HORÁRIO
              ======================================================== */}
          <div className="p-3.5 rounded-xl border border-neutral-700 bg-background dark:border-primary/25 dark:bg-primary-dark/15 flex flex-col justify-between gap-3">
            <div className="flex flex-col gap-3">
              {form.targetType === "ITEM" ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-body-s text-neutral-100 font-semibold flex items-center gap-1.5">
                      <Clock
                        size={14}
                        className="text-primary dark:text-gold"
                      />
                      {t("focusTimeLabel")}
                    </span>
                    <div className="flex items-center gap-1">
                      {FOCUS_MANUAL_PRESETS.filter(
                        (mins) =>
                          form.selectedItemMinutes <= 0 ||
                          mins <= form.selectedItemMinutes,
                      ).map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => form.handlePresetSelect(mins)}
                          className={cn(
                            "px-2 py-0.5 rounded-md text-tiny font-semibold border transition-colors cursor-pointer",
                            form.durationMinutes === mins
                              ? "bg-amber-500/20 border-amber-500 text-amber-800 dark:bg-gold/25 dark:border-gold dark:text-gold font-bold shadow-glow-gold-xs"
                              : "bg-card dark:bg-surface/60 border-neutral-600 dark:border-primary/25 text-neutral-400 hover:text-amber-700 dark:hover:text-gold hover:border-amber-500/40 dark:hover:border-gold/40",
                          )}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative flex items-end">
                    <Input
                      id="duration-minutes"
                      label={t("durationToDeductLabel", {
                        minutes: form.selectedItemMinutes,
                      })}
                      type="number"
                      compact
                      min={0}
                      max={
                        form.selectedItemMinutes > 0
                          ? form.selectedItemMinutes
                          : undefined
                      }
                      value={form.durationInput}
                      onChange={(e) =>
                        form.handleDurationInputChange(e.target.value)
                      }
                      icon={<Clock size={16} />}
                      className="pr-16 font-bold tabular-nums"
                    />
                    <div className="absolute right-1.5 bottom-1.5 flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          form.setDurationMinutes(
                            Math.max(1, form.durationMinutes - 5),
                          )
                        }
                        disabled={form.durationMinutes <= 1}
                        className="p-1 rounded-md text-neutral-400 hover:text-primary dark:hover:text-gold hover:bg-neutral-700/50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        aria-label="-5m"
                      >
                        <Minus size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          form.setDurationMinutes(
                            form.selectedItemMinutes > 0
                              ? Math.min(
                                  form.selectedItemMinutes,
                                  form.durationMinutes + 5,
                                )
                              : form.durationMinutes + 5,
                          )
                        }
                        disabled={
                          form.selectedItemMinutes > 0 &&
                          form.durationMinutes >= form.selectedItemMinutes
                        }
                        className="p-1 rounded-md text-neutral-400 hover:text-primary dark:hover:text-gold hover:bg-neutral-700/50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        aria-label="+5m"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-card dark:bg-white/5 border border-neutral-700 dark:border-white/10 text-caption text-neutral-300">
                    <span>{t("remainingBalanceAfterLog")}</span>
                    <strong className="text-amber-700 dark:text-gold font-semibold tabular-nums">
                      {Math.max(
                        0,
                        form.selectedItemMinutes - form.durationMinutes,
                      )}
                      m
                    </strong>
                  </div>
                </div>
              ) : (
                <>
                  {/* Cabeçalho de Duração + Presets rápidos */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-body-s text-neutral-100 font-semibold flex items-center gap-1.5">
                      <Clock
                        size={14}
                        className="text-primary dark:text-gold"
                      />
                      {t("focusTimeLabel")}
                    </span>
                    <div className="flex items-center gap-1">
                      {FOCUS_MANUAL_PRESETS.map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => form.handlePresetSelect(mins)}
                          className={cn(
                            "px-2 py-0.5 rounded-md text-tiny font-semibold border transition-colors cursor-pointer",
                            form.durationMinutes === mins
                              ? "bg-amber-500/20 border-amber-500 text-amber-800 dark:bg-gold/25 dark:border-gold dark:text-gold font-bold shadow-glow-gold-xs"
                              : "bg-card dark:bg-surface/60 border-neutral-600 dark:border-primary/25 text-neutral-400 hover:text-amber-700 dark:hover:text-gold hover:border-amber-500/40 dark:hover:border-gold/40",
                          )}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Linha com Minutos Totais e Stepper de Ciclos */}
                  <div
                    className={cn(
                      "grid gap-2.5 items-end",
                      form.recordType === "POMO"
                        ? "grid-cols-1 sm:grid-cols-2"
                        : "grid-cols-1",
                    )}
                  >
                    <div className="relative flex items-end">
                      <Input
                        id="duration-minutes"
                        label={t("totalMinutesLabel")}
                        type="number"
                        compact
                        min={0}
                        max={600}
                        value={form.durationInput}
                        onChange={(e) =>
                          form.handleDurationInputChange(e.target.value)
                        }
                        icon={<Clock size={16} />}
                        className="pr-16 font-bold tabular-nums"
                      />
                      <div className="absolute right-1.5 bottom-1.5 flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            form.setDurationMinutes(
                              Math.max(1, form.durationMinutes - 5),
                            )
                          }
                          disabled={form.durationMinutes <= 1}
                          className="p-1 rounded-md text-neutral-400 hover:text-primary dark:hover:text-gold hover:bg-neutral-700/50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          aria-label="-5m"
                        >
                          <Minus size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            form.setDurationMinutes(
                              Math.min(600, form.durationMinutes + 5),
                            )
                          }
                          disabled={form.durationMinutes >= 600}
                          className="p-1 rounded-md text-neutral-400 hover:text-primary dark:hover:text-gold hover:bg-neutral-700/50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          aria-label="+5m"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>

                    {form.recordType === "POMO" && (
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="pomo-stepper"
                          className="font-medium text-neutral-100 select-none text-body-s flex items-center justify-between"
                        >
                          <span className="flex items-center gap-1">
                            <Flame
                              size={13}
                              className="text-orange-500 dark:text-gold"
                            />
                            {t("cyclesLabel")}
                          </span>
                          <span className="text-tiny text-neutral-400 font-normal">
                            {t("avgMinutesPerCycle", {
                              minutes: averageMinutesPerPomo,
                            })}
                          </span>
                        </label>

                        <div
                          id="pomo-stepper"
                          className="flex items-center justify-between py-2 px-2.5 rounded-lg border border-neutral-600 bg-card shadow-xs dark:bg-primary-dark/20 dark:border-primary/30 dark:shadow-none"
                        >
                          <button
                            type="button"
                            onClick={() => form.handleCompletedPomosStep(-1)}
                            disabled={form.completedPomos <= 1}
                            className="p-0.5 rounded-md text-neutral-400 hover:text-primary dark:hover:text-gold hover:bg-neutral-700/50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            aria-label={t("decreaseCyclesAria")}
                          >
                            <Minus size={14} />
                          </button>

                          <span className="text-body-s font-bold text-neutral-100 tabular-nums">
                            {t("cyclesCount", { count: form.completedPomos })}
                          </span>

                          <button
                            type="button"
                            onClick={() => form.handleCompletedPomosStep(1)}
                            disabled={form.completedPomos >= 50}
                            className="p-0.5 rounded-md text-neutral-400 hover:text-primary dark:hover:text-gold hover:bg-neutral-700/50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            aria-label={t("increaseCyclesAria")}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Divisor sutil integrando Data e Janela de Horário apenas para Atividades */}
              {form.targetType !== "ITEM" && (
                <div className="border-t border-neutral-700 dark:border-white/10 pt-3 flex flex-col gap-2.5">
                  <DatePicker
                    id="session-date"
                    label={t("sessionDateLabel")}
                    value={form.sessionDate}
                    onChange={form.setSessionDate}
                    maxDate={getTodayDateString()}
                    placeholder={t("todayPlaceholder")}
                    compact
                    allowClear={false}
                    align="left"
                  />

                  <div className="grid grid-cols-2 gap-2.5 items-start">
                    <TimePicker
                      id="session-start-time"
                      label={t("startTimeLabel")}
                      value={form.startTimeStr}
                      onChange={form.handleStartTimeChange}
                      compact
                      align="left"
                    />

                    <TimePicker
                      id="session-end-time"
                      label={t("endTimeLabel")}
                      value={form.endTimeStr}
                      onChange={form.handleEndTimeChange}
                      compact
                      align="right"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Resumo sincronizado compacto na base do painel de tempo (apenas para Atividades) */}
            {form.targetType !== "ITEM" && (
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-card dark:bg-white/5 border border-neutral-700 dark:border-white/10 text-tiny text-neutral-300">
                <span>{t("syncedWindowLabel")}</span>
                <strong className="text-amber-700 dark:text-gold font-semibold tabular-nums">
                  {t("syncedWindowSummary", {
                    start: form.startTimeStr,
                    end: form.endTimeStr,
                    minutes: form.durationMinutes,
                  })}
                </strong>
              </div>
            )}
          </div>
        </div>

        {/* ESTIMATIVA DE RECOMPENSA EM LARGURA TOTAL (Sem desbalancear as colunas) */}
        <RewardPreview
          estimate={form.rewardEstimate}
          label={t("rewardEstimateLabel")}
        />

        {/* ========================================================
            RODAPÉ DE AÇÕES DO MODAL
            ======================================================== */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-700 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={form.isSubmitting}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-300 hover:bg-surface dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <X size={14} />
            {t("cancelButton")}
          </button>
          <button
            type="submit"
            disabled={
              form.isSubmitting ||
              form.durationMinutes <= 0 ||
              (form.targetType === "ACTIVITY" &&
                !form.selectedActivityId &&
                !form.selectedTaskId) ||
              (form.targetType === "ITEM" && !form.selectedItemId)
            }
            className="px-5 py-2.5 rounded-lg text-xs font-bold bg-gold text-on-gold hover:bg-gold-hover shadow-glow-gold-xs transition-colors cursor-pointer disabled:bg-neutral-700 disabled:text-neutral-400 disabled:border disabled:border-neutral-600 disabled:shadow-none disabled:opacity-100 dark:disabled:bg-gold dark:disabled:text-on-gold dark:disabled:border-transparent dark:disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {form.isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-on-gold border-t-transparent rounded-full animate-spin" />
                <span>{t("submittingButton")}</span>
              </>
            ) : (
              <>
                <Check size={15} />
                <span>{t("submitButton")}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
