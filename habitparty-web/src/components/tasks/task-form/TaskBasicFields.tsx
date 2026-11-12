import { Flag, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import { DescriptionCharCounter } from "@/components/ui/DescriptionCharCounter";
import { Select } from "@/components/ui/Select";
import {
  MAX_TASK_TAGS,
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_PRIORITY_META,
  TODO_PRIORITY_OPTIONS,
  toPriorityMessageKey,
} from "@/constants/task";
import type { CreateTaskFormReturn } from "@/hooks/useCreateTaskForm";
import type { TaskPriorityOption } from "@/types/task";
import { cn } from "@/utils";
import { HabitImportanceSelector } from "./HabitImportanceSelector";
import { TaskDifficultySelector } from "./TaskDifficultySelector";

interface TaskBasicFieldsProps {
  form: CreateTaskFormReturn;
  columns: { id: string; title: string }[];
}

export function TaskBasicFields({ form, columns }: TaskBasicFieldsProps) {
  const t = useTranslations("tasks.taskModal.basicFields");
  const tOptions = useTranslations("tasks.options");
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
        label={isEditing ? t("currentColumnLabel") : t("targetColumnLabel")}
        options={columnOptions}
        value={columnId}
        onChange={setColumnId}
        disabled={isPending}
        compact
      />

      {/* Título */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="taskTitle"
            className="text-body-s text-neutral-300 font-medium"
          >
            {t("titleLabel")} <span className="text-gold">*</span>
          </label>
          <span
            className={cn(
              "text-tiny tabular-nums transition-colors",
              name.length >= 50
                ? "text-gold font-semibold"
                : "text-neutral-400",
            )}
          >
            {name.length}/50
          </span>
        </div>
        <input
          ref={nameInputRef}
          id="taskTitle"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 50))}
          placeholder={t("titlePlaceholder")}
          className="w-full bg-card border border-neutral-600 hover:border-neutral-500 rounded-lg px-3 py-2 text-neutral-50 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 shadow-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-primary-dark/20 dark:border-primary/30 dark:hover:border-primary/50 dark:shadow-none dark:focus:border-gold dark:focus:ring-1 dark:focus:ring-gold transition-colors text-body-s"
          required
          maxLength={50}
          disabled={isPending}
        />
      </div>

      {/* Descrição */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="taskDesc"
            className="text-body-s text-neutral-300 font-medium"
          >
            {t("descriptionLabel")}{" "}
            <span className="text-neutral-500 text-xs">{t("optional")}</span>
          </label>
          <DescriptionCharCounter length={description.length} />
        </div>
        <textarea
          id="taskDesc"
          rows={3}
          value={description}
          onChange={(e) =>
            setDescription(e.target.value.slice(0, TASK_DESCRIPTION_MAX_LENGTH))
          }
          placeholder={t("descriptionPlaceholder")}
          className="w-full bg-card border border-neutral-600 hover:border-neutral-500 rounded-lg px-3 py-2 text-neutral-50 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 shadow-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-primary-dark/20 dark:border-primary/30 dark:hover:border-primary/50 dark:shadow-none dark:focus:border-gold dark:focus:ring-1 dark:focus:ring-gold transition-colors text-body-s resize-none"
          maxLength={TASK_DESCRIPTION_MAX_LENGTH}
          disabled={isPending}
        />
      </div>

      {/* Importância (Hábito) ou Dificuldade (ToDo / Daily) */}
      {taskType === "HABIT" ? (
        <HabitImportanceSelector
          value={importanceType}
          onChange={setImportanceType}
          disabled={isPending}
        />
      ) : (
        <TaskDifficultySelector
          value={difficulty}
          onChange={setDifficulty}
          disabled={isPending}
        />
      )}

      {/* Classificações: Tags e Prioridade lado a lado para todos os tipos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
        {/* Tags */}
        <div className="flex flex-col gap-1.5 w-full">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="taskTags"
              className="font-medium text-neutral-100 select-none text-body-s"
            >
              {t("tagsLabel")}
            </label>
            <span className="text-tiny text-neutral-400 select-none">
              {t("tagsHint")}
            </span>
          </div>
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
              placeholder={t("tagsPlaceholder", { max: MAX_TASK_TAGS })}
              className="w-full rounded-lg text-left transition-colors py-2 pl-8 pr-3 text-body-s h-[38px] bg-card border border-neutral-600 hover:border-neutral-500 text-neutral-50 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 shadow-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-primary-dark/20 dark:border-primary/30 dark:hover:border-primary/50 dark:shadow-none dark:focus:border-gold dark:focus:ring-1 dark:focus:ring-gold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isPending}
            />
          </div>
        </div>

        {/* Prioridade */}
        <Select
          label={t("priorityLabel")}
          options={TODO_PRIORITY_OPTIONS.map((prio) => ({
            value: prio.id,
            label: tOptions(`priorities.${toPriorityMessageKey(prio.id)}`),
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
