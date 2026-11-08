"use client";

import {
  Calendar,
  Check,
  FileText,
  Loader2,
  Repeat,
  SlidersHorizontal,
  Target,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  DailyFields,
  HabitFields,
  HardcoreModeToggle,
  TaskBasicFields,
  TaskChecklistSection,
  TaskTypeTabs,
  TodoFields,
} from "@/components/tasks/task-form";
import { BaseModal } from "@/components/ui/BaseModal";
import { RewardPreview } from "@/components/ui/reward/RewardPreview";
import { TASK_TYPE_META } from "@/constants/task";
import { useCreateTaskForm } from "@/hooks/useCreateTaskForm";
import type { AppLocale } from "@/i18n/config";
import type { CreateTaskModalProps } from "@/types/task-ui";
import { cn } from "@/utils";
import { isTaskHardcoreLocked } from "@/utils/date";
import { getTaskRewardBreakdown, toTaskRewardEstimate } from "@/utils/economy";

export function CreateTaskModal({
  isOpen,
  onClose,
  columns,
  defaultColumnId,
  defaultTaskType,
  initialTitle,
  initialValues,
  taskToEdit,
  onSuccess,
}: CreateTaskModalProps) {
  const t = useTranslations("tasks.taskModal");
  const tOptions = useTranslations("tasks.options.types");
  const locale = useLocale() as AppLocale;

  const form = useCreateTaskForm({
    isOpen,
    columns,
    defaultColumnId,
    defaultTaskType,
    initialTitle,
    initialValues,
    taskToEdit,
    onSuccess,
    onClose,
  });

  const isEditing = form.isEditing;

  const isOverdueHardcoreLocked = Boolean(
    isEditing && isTaskHardcoreLocked(taskToEdit),
  );

  const rewardEstimate = useMemo(() => {
    const breakdown = getTaskRewardBreakdown({
      taskType: form.taskType,
      difficulty: form.difficulty,
      importanceType: form.importanceType,
      resetCounter: form.resetCounter,
      repeatType: form.repeatType,
      currentStreak:
        taskToEdit?.currentStreak ??
        taskToEdit?.streak ??
        taskToEdit?.positiveCount ??
        0,
      isHardcoreModeEnabled: form.isHardcore,
      dueDate: form.dueDate,
      isPenaltyApplied: taskToEdit?.isPenaltyApplied,
      locale,
    });
    return toTaskRewardEstimate(breakdown, {
      isHardcore: form.isHardcore,
      taskType: form.taskType,
      locale,
    });
  }, [
    form.taskType,
    form.difficulty,
    form.importanceType,
    form.resetCounter,
    form.repeatType,
    form.isHardcore,
    form.dueDate,
    taskToEdit,
    locale,
  ]);

  const TypeHeaderIcon =
    form.taskType === "HABIT"
      ? Repeat
      : form.taskType === "DAILY"
        ? Calendar
        : Target;

  const typeMeta = TASK_TYPE_META[form.taskType] || TASK_TYPE_META.TODO;
  const headerIconClassName =
    form.taskType === "HABIT"
      ? "bg-sky-500/10 border-sky-500/30 text-sky-600 shadow-none dark:bg-info/15 dark:border-info/30 dark:text-info"
      : form.taskType === "DAILY"
        ? "bg-purple-500/10 border-purple-500/30 text-purple-600 shadow-none dark:bg-magenta/15 dark:border-magenta/30 dark:text-magenta"
        : "bg-amber-500/10 border-amber-500/30 text-amber-600 shadow-none dark:bg-gold/15 dark:border-gold/30 dark:text-gold dark:shadow-glow-gold-xs";

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      onOpenAnimationEnd={form.handleModalAnimationEnd}
      title={isEditing ? t("editTitle") : t("createTitle")}
      headerIcon={<TypeHeaderIcon size={20} />}
      headerIconClassName={headerIconClassName}
      headerBadge={
        <span
          className={cn(
            "text-tiny uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border",
            typeMeta.color,
          )}
        >
          {tOptions(form.taskType)}
        </span>
      }
      description={isEditing ? t("editDescription") : t("createDescription")}
      maxWidth="max-w-3xl"
      preventClose={form.isPending}
    >
      <form onSubmit={form.handleSubmit} className="flex flex-col gap-4 mt-1">
        {/* ABAS SUPERIORES DE TIPO DE TAREFA (Exibidas apenas na criação) */}
        {!isEditing && (
          <div>
            <TaskTypeTabs
              taskType={form.taskType}
              onChange={form.setTaskType}
              disabled={form.isPending}
              isEditing={false}
            />
          </div>
        )}

        {/* CORPO DO FORMULÁRIO EM 2 COLUNAS PADRONIZADO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
          {/* COLUNA 1 (ESQUERDA): DADOS BÁSICOS */}
          <div className="flex flex-col gap-3.5">
            <div className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-white/10">
              <FileText size={14} className="text-gold" />
              <span>{t("section1Title")}</span>
            </div>

            <TaskBasicFields form={form} columns={columns} />
          </div>

          {/* COLUNA 2 (DIREITA): CONFIGURAÇÕES ESPECÍFICAS DO TIPO & RECOMPENSA */}
          <div className="flex flex-col gap-3.5">
            <div className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-white/10">
              <SlidersHorizontal size={14} className="text-gold" />
              <span>{t("section2Title")}</span>
            </div>

            <div className="flex flex-col justify-between gap-3.5 bg-primary-dark/15 border border-primary/25 rounded-xl p-3.5">
              <div className="flex flex-col gap-3.5">
                <div>
                  {form.taskType === "HABIT" && <HabitFields form={form} />}
                  {form.taskType === "DAILY" && <DailyFields form={form} />}
                  {form.taskType === "TODO" && <TodoFields form={form} />}
                </div>

                {/* CHECKLIST / SUBTAREFAS (Para ToDo e Daily) */}
                {(form.taskType === "TODO" || form.taskType === "DAILY") && (
                  <TaskChecklistSection form={form} />
                )}
              </div>

              {/* MODO HARDCORE */}
              <HardcoreModeToggle
                isHardcore={form.isHardcore}
                onChange={form.setIsHardcore}
                disabled={form.isPending || isOverdueHardcoreLocked}
                taskType={form.taskType}
              />
            </div>

            {/* Estimativa de Recompensa padronizada na coluna direita */}
            <div className="pt-0.5">
              <RewardPreview
                estimate={rewardEstimate}
                label={t("rewardPreviewLabel")}
              />
            </div>
          </div>
        </div>

        {/* RODAPÉ DE AÇÕES PADRONIZADO */}
        <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-white/10 mt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={form.isPending}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-300 hover:text-neutral-50 hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            <X size={14} />
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={form.isPending || !form.name.trim() || !form.columnId}
            className="px-5 py-2.5 rounded-lg text-xs font-bold bg-gold text-on-gold hover:bg-gold-hover shadow-glow-gold-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {form.isPending ? (
              <>
                <Loader2 size={15} className="animate-spin text-on-gold" />
                <span>{t("saving")}</span>
              </>
            ) : (
              <>
                <Check size={15} />
                <span>{isEditing ? t("saveChanges") : t("createButton")}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
