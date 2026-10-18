"use client";

import { Flag, Swords, Tag } from "lucide-react";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Select } from "@/components/ui/Select";
import {
  HABIT_IMPORTANCE_OPTIONS,
  MAX_TASK_TAGS,
  TASK_DIFFICULTY_META,
  TASK_DIFFICULTY_OPTIONS,
  TASK_PRIORITY_META,
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
    isEditing,
  } = form;

  const columnOptions = columns.map((col) => ({
    value: col.id,
    label: col.title,
  }));

  return (
    <div className="flex flex-col gap-3.5">
      {/* Lista de Destino */}
      <Select
        label={isEditing ? "Coluna / Lista atual" : "Adicionar na lista *"}
        options={columnOptions}
        value={columnId}
        onChange={setColumnId}
        disabled={isPending}
        compact
      />

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
                    : "border-primary/30 bg-surface/60 text-neutral-300 hover:text-gold hover:border-gold/40",
                )}
              >
                {imp.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <Select
          label={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1.5">
                <span className="text-body-s text-neutral-300 font-medium">
                  Dificuldade
                </span>
                <InfoTooltip
                  title="Dificuldades & Recompensas"
                  icon={<Swords size={14} className="text-gold shrink-0" />}
                  ariaLabel="Entenda como funcionam as Dificuldades e Recompensas"
                >
                  <p className="text-neutral-300 leading-relaxed text-label-g">
                    Define a exigência de esforço e o ganho matemático base de
                    Ouro (🪙) e XP creditados ao concluir a atividade:
                  </p>

                  <ul className="flex flex-col gap-1.5 py-1 text-label-g text-neutral-200">
                    <li className="flex items-start gap-1.5">
                      <span
                        className={cn(
                          "font-bold shrink-0 flex items-center gap-1",
                          TASK_DIFFICULTY_META.TRIVIAL.color,
                        )}
                      >
                        <Swords size={11} className="shrink-0" /> Trivial:
                      </span>
                      <span className="text-neutral-300">
                        <strong className="text-neutral-100">
                          +2 XP • +0,25 🪙
                        </strong>{" "}
                        — Quase automática (ex: beber água, remédio).
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span
                        className={cn(
                          "font-bold shrink-0 flex items-center gap-1",
                          TASK_DIFFICULTY_META.EASY.color,
                        )}
                      >
                        <Swords size={11} className="shrink-0" /> Fácil:
                      </span>
                      <span className="text-neutral-300">
                        <strong className="text-neutral-100">
                          +5 XP • +0,75 🪙
                        </strong>{" "}
                        — Baixa fricção (ex: e-mails, 10 min leitura).
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span
                        className={cn(
                          "font-bold shrink-0 flex items-center gap-1",
                          TASK_DIFFICULTY_META.MEDIUM.color,
                        )}
                      >
                        <Swords size={11} className="shrink-0" /> Médio:
                      </span>
                      <span className="text-neutral-300">
                        <strong className="text-neutral-100">
                          +15 XP • +2,50 🪙
                        </strong>{" "}
                        — Padrão: 30 a 60 min de esforço (ex: treino).
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span
                        className={cn(
                          "font-bold shrink-0 flex items-center gap-1",
                          TASK_DIFFICULTY_META.HARD.color,
                        )}
                      >
                        <Swords size={11} className="shrink-0" /> Difícil:
                      </span>
                      <span className="text-neutral-300">
                        <strong className="text-neutral-100">
                          +30 XP • +5,00 🪙
                        </strong>{" "}
                        — Intensa de 1 a 2 horas (ex: estudo pesado, projeto).
                      </span>
                    </li>
                  </ul>

                  <div className="text-tiny text-neutral-400 bg-white/5 rounded-md p-1.5 border border-white/10 italic">
                    💡 Dica: No modo Hardcore e com repetição ou ofensiva
                    (streak), as recompensas e penalidades escalam com a
                    dificuldade.
                  </div>
                </InfoTooltip>
              </div>
              <span className="text-tiny text-neutral-400 font-normal">
                Define o ganho de XP e Moedas
              </span>
            </div>
          }
          options={TASK_DIFFICULTY_OPTIONS.map((opt) => ({
            value: opt.id,
            label: opt.label,
            icon: (
              <Swords
                size={15}
                className={cn(
                  "shrink-0",
                  TASK_DIFFICULTY_META[opt.id]?.color || "text-neutral-400",
                )}
              />
            ),
          }))}
          value={difficulty}
          onChange={(val) => setDifficulty(val as TaskDifficultyOption)}
          disabled={isPending}
          compact
        />
      )}

      {/* Classificações: Tags e Prioridade lado a lado para todos os tipos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
        {/* Tags */}
        <div className="flex flex-col gap-1.5 w-full">
          <label
            htmlFor="taskTags"
            className="font-medium text-neutral-100 select-none text-body-s"
          >
            Tags
          </label>
          <div className="relative flex items-center">
            <Tag
              size={15}
              className="absolute left-3 text-neutral-400 pointer-events-none shrink-0"
            />
            <input
              id="taskTags"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder={`Ex: saúde, estudos (máx. ${MAX_TASK_TAGS})`}
              className={cn(
                "w-full rounded-lg text-left transition-all py-2 pl-8 pr-3 text-body-s h-[38px]",
                "bg-card border border-neutral-700 text-neutral-50 shadow-xs",
                "dark:bg-primary-dark/20 dark:border-primary/30 dark:shadow-none",
                "placeholder:text-neutral-500",
                "outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "focus:border-primary dark:focus:border-primary-light hover:border-neutral-500 dark:hover:border-primary/50",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
              disabled={isPending}
            />
          </div>
        </div>

        {/* Prioridade */}
        <Select
          label="Prioridade"
          options={TODO_PRIORITY_OPTIONS.map((prio) => ({
            value: prio.id,
            label: prio.label,
            icon: (
              <Flag
                size={15}
                className={cn(
                  "shrink-0",
                  TASK_PRIORITY_META[prio.id]?.color || "text-neutral-400",
                )}
              />
            ),
          }))}
          value={priority}
          onChange={(val) => setPriority(val as TaskPriorityOption)}
          disabled={isPending}
          compact
        />
      </div>
    </div>
  );
}
