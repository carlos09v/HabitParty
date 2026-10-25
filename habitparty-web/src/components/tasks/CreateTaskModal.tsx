"use client";

import { Loader2 } from "lucide-react";
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
import { useCreateTaskForm } from "@/hooks/useCreateTaskForm";
import type { CreateTaskModalProps } from "@/types/task-ui";
import { isTaskHardcoreLocked } from "@/utils/date";
import { getTaskRewardBreakdown, toTaskRewardEstimate } from "@/utils/economy";

export function CreateTaskModal({
  isOpen,
  onClose,
  columns,
  defaultColumnId,
  defaultTaskType,
  initialTitle,
  taskToEdit,
  onSuccess,
}: CreateTaskModalProps) {
  const form = useCreateTaskForm({
    isOpen,
    columns,
    defaultColumnId,
    defaultTaskType,
    initialTitle,
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
    });
    return toTaskRewardEstimate(breakdown, {
      isHardcore: form.isHardcore,
      taskType: form.taskType,
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
  ]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar Tarefa" : "Criar Tarefa"}
      description={
        isEditing
          ? "Atualize as configurações e regras da sua atividade."
          : "Personalize o tipo, hábitos e detalhes da sua atividade."
      }
      maxWidth="max-w-3xl"
      preventClose={form.isPending}
    >
      <form onSubmit={form.handleSubmit} className="flex flex-col gap-5">
        {/* ABAS SUPERIORES DE TIPO DE TAREFA */}
        <div>
          <TaskTypeTabs
            taskType={form.taskType}
            onChange={form.setTaskType}
            disabled={form.isPending || isEditing}
            isEditing={isEditing}
          />
          {isEditing && (
            <p className="mt-1.5 px-1 text-caption text-neutral-400">
              O tipo da atividade (Hábito, Diária, To-Do) não pode ser alterado
              após criada. Para mudar de tipo, duplique ou crie uma nova tarefa.
            </p>
          )}
        </div>

        {/* CORPO DO FORMULÁRIO EM 2 COLUNAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:h-[480px] items-stretch">
          {/* COLUNA ESQUERDA: DADOS BÁSICOS */}
          <div className="flex flex-col h-full min-h-0 overflow-y-auto custom-scrollbar pr-1">
            <TaskBasicFields form={form} columns={columns} />
          </div>

          {/* COLUNA DIREITA: CONFIGURAÇÕES ESPECÍFICAS DO TIPO */}
          <div className="flex flex-col justify-between gap-3.5 bg-primary-dark/15 border border-primary/25 rounded-xl p-4 h-full min-h-0 overflow-hidden">
            <div className="flex flex-col gap-3.5 min-h-0 flex-1 overflow-hidden">
              <div className="shrink-0">
                {form.taskType === "HABIT" && <HabitFields form={form} />}
                {form.taskType === "DAILY" && <DailyFields form={form} />}
                {form.taskType === "TODO" && <TodoFields form={form} />}
              </div>

              {/* CHECKLIST / SUBTAREFAS (Para ToDo e Daily) */}
              {(form.taskType === "TODO" || form.taskType === "DAILY") && (
                <TaskChecklistSection form={form} />
              )}
            </div>

            {/* MODO HARDCORE (Switch Toggle posicionado no fim) */}
            <div className="pt-2 border-t border-white/5 shrink-0">
              <HardcoreModeToggle
                isHardcore={form.isHardcore}
                onChange={form.setIsHardcore}
                disabled={form.isPending || isOverdueHardcoreLocked}
                taskType={form.taskType}
              />
            </div>
          </div>
        </div>

        {/* RODAPÉ DO MODAL COM CONTROLE DISCRETO DE RECOMPENSAS */}
        <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
          <RewardPreview
            estimate={rewardEstimate}
            label="Recompensas da Tarefa"
          />

          <div className="flex items-center gap-3 ml-auto w-full sm:w-auto justify-end shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={form.isPending}
              className="px-4 py-2 text-body-s text-neutral-300 hover:text-neutral-50 transition-colors focus:outline-none rounded-lg cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={form.isPending || !form.name.trim() || !form.columnId}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-linear-to-r from-gold to-gold-pressed text-neutral-900 font-bold text-body-s rounded-lg hover:brightness-110 transition-all focus:outline-none focus:ring-2 focus:ring-gold/50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {form.isPending ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin text-neutral-900"
                  />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>{isEditing ? "Salvar Alterações" : "Criar Tarefa"}</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </BaseModal>
  );
}
