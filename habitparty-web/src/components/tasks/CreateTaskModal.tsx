"use client";

import { Loader2 } from "lucide-react";
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
import type { Task } from "@/types/task";

export interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: { id: string; title: string }[];
  defaultColumnId?: string;
  taskToEdit?: Task | null;
  onSuccess?: (task: Task, columnId: string) => void;
}

export function CreateTaskModal({
  isOpen,
  onClose,
  columns,
  defaultColumnId,
  taskToEdit,
  onSuccess,
}: CreateTaskModalProps) {
  const form = useCreateTaskForm({
    isOpen,
    columns,
    defaultColumnId,
    taskToEdit,
    onSuccess,
    onClose,
  });

  const isEditing = form.isEditing;

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
        <TaskTypeTabs
          taskType={form.taskType}
          onChange={form.setTaskType}
          disabled={form.isPending}
        />

        {/* CORPO DO FORMULÁRIO EM 2 COLUNAS (Altura padronizada para evitar layout shift) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 min-h-[440px] items-stretch">
          {/* COLUNA ESQUERDA: DADOS BÁSICOS */}
          <div className="flex flex-col">
            <TaskBasicFields form={form} columns={columns} />
          </div>

          {/* COLUNA DIREITA: CONFIGURAÇÕES ESPECÍFICAS DO TIPO */}
          <div className="flex flex-col justify-between gap-3.5 bg-primary-dark/15 border border-primary/25 rounded-xl p-4 h-full">
            <div className="flex flex-col gap-3.5">
              {form.taskType === "HABIT" && <HabitFields form={form} />}
              {form.taskType === "DAILY" && <DailyFields form={form} />}
              {form.taskType === "TODO" && <TodoFields form={form} />}

              {/* CHECKLIST / SUBTAREFAS (Para ToDo e Daily) */}
              {(form.taskType === "TODO" || form.taskType === "DAILY") && (
                <TaskChecklistSection form={form} />
              )}
            </div>

            {/* MODO HARDCORE (Switch Toggle posicionado no fim) */}
            <div className="pt-2 border-t border-white/5">
              <HardcoreModeToggle
                isHardcore={form.isHardcore}
                onChange={form.setIsHardcore}
                disabled={form.isPending}
              />
            </div>
          </div>
        </div>

        {/* RODAPÉ DO MODAL */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
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
                <Loader2 size={16} className="animate-spin text-neutral-900" />
                <span>Salvando...</span>
              </>
            ) : (
              <span>{isEditing ? "Salvar Alterações" : "Criar Tarefa"}</span>
            )}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
