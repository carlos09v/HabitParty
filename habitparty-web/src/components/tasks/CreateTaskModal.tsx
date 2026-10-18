"use client";

import { Info, Loader2, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
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
import { useCreateTaskForm } from "@/hooks/useCreateTaskForm";
import type { Task, TaskTypeOption } from "@/types/task";
import { cn } from "@/utils";
import { formatCoins, getTaskRewardBreakdown } from "@/utils/economy";

export interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: { id: string; title: string }[];
  defaultColumnId?: string;
  defaultTaskType?: TaskTypeOption;
  initialTitle?: string;
  taskToEdit?: Task | null;
  onSuccess?: (task: Task, columnId: string) => void;
}

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

  const [isRewardsOpen, setIsRewardsOpen] = useState(false);
  const isEditing = form.isEditing;

  const isOverdueHardcoreLocked = Boolean(
    isEditing &&
      taskToEdit?.isHardcoreModeEnabled &&
      taskToEdit?.dueDate &&
      new Date(`${taskToEdit.dueDate}T23:59:59`) < new Date(),
  );

  const rewardBreakdown = useMemo(() => {
    return getTaskRewardBreakdown({
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
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/10 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {/* Botão Gatilho Discreto */}
            <button
              type="button"
              onClick={() => setIsRewardsOpen((prev) => !prev)}
              title={
                isRewardsOpen
                  ? "Ocultar recompensas"
                  : "Exibir valores e cálculo de recompensas da tarefa"
              }
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer select-none active:scale-95 shrink-0",
                isRewardsOpen
                  ? "bg-gold/15 border-gold/50 text-gold shadow-glow-gold-xs font-bold"
                  : "bg-surface border-white/15 text-neutral-300 hover:text-gold hover:border-gold/40 hover:bg-surface-hover",
              )}
            >
              <Sparkles
                size={13}
                className={isRewardsOpen ? "text-gold" : "text-neutral-400"}
              />
              <span>Recompensas</span>
            </button>

            {/* Exibição Discreta Inline ao lado do botão */}
            {isRewardsOpen && (
              <div className="flex items-center gap-1.5 flex-wrap animate-in fade-in zoom-in-95 duration-150">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gold/15 border border-gold/40 text-gold font-bold text-xs shadow-glow-gold-xs shrink-0">
                  🪙 +{formatCoins(rewardBreakdown.finalReward.gold)}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-info/15 border border-info/40 text-info font-bold text-xs shrink-0">
                  ⚡ +{rewardBreakdown.finalReward.xp} XP
                </span>

                {rewardBreakdown.hasDecay && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/40 text-purple-300 font-bold text-label-g cursor-help shrink-0"
                    title={rewardBreakdown.explanation}
                  >
                    🏆 {rewardBreakdown.stageLabel} (-
                    {rewardBreakdown.decayPercentage}%)
                  </span>
                )}

                {!rewardBreakdown.hasDecay && form.taskType !== "TODO" && (
                  <span
                    className="inline-flex items-center gap-1 text-label-g text-neutral-400 hover:text-neutral-200 cursor-help transition-colors select-none shrink-0"
                    title="A recompensa inicial é 100%. Conforme você consolidar o hábito/rotina (7 e 21 repetições/dias), o ganho ajustará gradualmente para 75% e 50% para incentivar novos desafios."
                  >
                    <Info size={12} className="opacity-70" />
                    <span>Base 100%</span>
                  </span>
                )}

                {form.isHardcore && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-danger-500/15 border border-danger-500/40 text-danger-400 font-bold text-label-g shrink-0">
                    ⚠️ -50% ao falhar
                  </span>
                )}
              </div>
            )}
          </div>

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
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-gold to-gold-pressed text-neutral-900 font-bold text-body-s rounded-lg hover:brightness-110 transition-all focus:outline-none focus:ring-2 focus:ring-gold/50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
