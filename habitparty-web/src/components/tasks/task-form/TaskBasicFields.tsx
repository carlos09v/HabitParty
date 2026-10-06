"use client";

import { ChevronDown } from "lucide-react";
import {
  HABIT_IMPORTANCE_OPTIONS,
  TASK_DIFFICULTY_OPTIONS,
  TODO_PRIORITY_OPTIONS,
} from "@/constants/task";
import type { CreateTaskFormReturn } from "@/hooks/useCreateTaskForm";
import type { TaskDifficultyOption, TaskPriorityOption } from "@/types/task";
import { cn } from "@/utils";

interface TaskBasicFieldsProps {
  form: CreateTaskFormReturn;
  columns: { id: string; title: string }[];
}

export function TaskBasicFields({ form, columns }: TaskBasicFieldsProps) {
  const {
    taskType,
    columnId,
    setColumnId,
    name,
    setName,
    description,
    setDescription,
    importanceType,
    setImportanceType,
    difficulty,
    setDifficulty,
    priority,
    setPriority,
    tagsInput,
    setTagsInput,
    nameInputRef,
    isPending,
  } = form;

  return (
    <div className="flex flex-col gap-3.5">
      {/* Lista de Destino */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="targetColumn"
          className="text-body-s text-neutral-300 font-medium"
        >
          Adicionar na lista <span className="text-gold">*</span>
        </label>
        <div className="relative">
          <select
            id="targetColumn"
            value={columnId}
            onChange={(e) => setColumnId(e.target.value)}
            className="w-full appearance-none bg-background/50 border border-primary/40 rounded-lg pl-3 pr-9 py-2 text-neutral-50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-body-s cursor-pointer"
            disabled={isPending}
          >
            {columns.map((col) => (
              <option
                key={col.id}
                value={col.id}
                className="bg-[#1a0f35] text-neutral-100"
              >
                {col.title}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white"
          />
        </div>
      </div>

      {/* Título */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="taskTitle"
          className="text-body-s text-neutral-300 font-medium"
        >
          Título <span className="text-gold">*</span>
        </label>
        <input
          ref={nameInputRef}
          id="taskTitle"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Ler 10 páginas, Beber água..."
          className="w-full bg-background/50 border border-primary/40 rounded-lg px-3 py-2 text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-body-s"
          required
          maxLength={50}
          disabled={isPending}
        />
      </div>

      {/* Descrição */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="taskDesc"
          className="text-body-s text-neutral-300 font-medium"
        >
          Descrição <span className="text-neutral-500 text-xs">(opcional)</span>
        </label>
        <textarea
          id="taskDesc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detalhes ou regras desta tarefa..."
          className="w-full bg-background/50 border border-primary/40 rounded-lg px-3 py-2 text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-body-s resize-none"
          maxLength={500}
          disabled={isPending}
        />
      </div>

      {/* Importância (Hábito) ou Dificuldade (ToDo / Daily) */}
      {taskType === "HABIT" ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-body-s text-neutral-300 font-medium">
              Importância
            </span>
            <span className="text-tiny text-neutral-400">
              Define o impacto no progresso
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {HABIT_IMPORTANCE_OPTIONS.map((imp) => (
              <button
                key={imp.id}
                type="button"
                disabled={isPending}
                onClick={() => setImportanceType(imp.id)}
                className={cn(
                  "py-1.5 px-2 rounded-lg border text-body-s font-semibold transition-all cursor-pointer disabled:opacity-50",
                  importanceType === imp.id
                    ? "border-gold bg-gold/20 text-gold shadow-glow-gold-xs font-bold"
                    : "border-primary/30 bg-primary-dark/20 text-white hover:text-gold hover:border-gold/40",
                )}
              >
                {imp.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="taskDiff"
              className="text-body-s text-neutral-300 font-medium"
            >
              Dificuldade
            </label>
            <div className="relative">
              <select
                id="taskDiff"
                value={difficulty}
                disabled={isPending}
                onChange={(e) =>
                  setDifficulty(e.target.value as TaskDifficultyOption)
                }
                className="w-full appearance-none bg-background/50 border border-primary/40 rounded-lg pl-3 pr-9 py-2 text-neutral-50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-body-s cursor-pointer"
              >
                {TASK_DIFFICULTY_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} className="bg-[#1a0f35]">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white"
              />
            </div>
          </div>

          {taskType === "TODO" && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="taskPrio"
                className="text-body-s text-neutral-300 font-medium"
              >
                Prioridade
              </label>
              <div className="relative">
                <select
                  id="taskPrio"
                  value={priority}
                  disabled={isPending}
                  onChange={(e) =>
                    setPriority(e.target.value as TaskPriorityOption)
                  }
                  className="w-full appearance-none bg-background/50 border border-primary/40 rounded-lg pl-3 pr-9 py-2 text-neutral-50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-body-s cursor-pointer"
                >
                  {TODO_PRIORITY_OPTIONS.map((prio) => (
                    <option
                      key={prio.id}
                      value={prio.id}
                      className="bg-[#1a0f35]"
                    >
                      {prio.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="taskTags"
          className="text-body-s text-neutral-300 font-medium"
        >
          Tags{" "}
          <span className="text-neutral-500 text-xs">
            (separadas por vírgula)
          </span>
        </label>
        <input
          id="taskTags"
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="Ex: saúde, estudos, trabalho"
          className="w-full bg-background/50 border border-primary/40 rounded-lg px-3 py-2 text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-body-s"
          disabled={isPending}
        />
      </div>
    </div>
  );
}
