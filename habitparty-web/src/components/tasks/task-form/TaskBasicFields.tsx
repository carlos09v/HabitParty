"use client";

import { Flag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { toast } from "sonner";
import {
  RichTextDescriptionEditor,
  TaskTagSelector,
} from "@/components/tasks/shared";
import { DescriptionCharCounter } from "@/components/ui/DescriptionCharCounter";
import { Select } from "@/components/ui/Select";
import {
  MAX_TASK_TAGS,
  TASK_PRIORITY_META,
  TASK_TITLE_MAX_LENGTH,
  TODO_PRIORITY_OPTIONS,
  toPriorityMessageKey,
} from "@/constants/task";
import type { CreateTaskFormReturn } from "@/hooks/useCreateTaskForm";
import type { TaskPriorityOption } from "@/types/task";
import { cn } from "@/utils";
import { mergeTaskTagsWithLimit, replaceTaskTag } from "@/utils/tags";
import { parseTaskTags } from "@/utils/taskMapper";
import { HabitImportanceSelector } from "./HabitImportanceSelector";
import { TaskDifficultySelector } from "./TaskDifficultySelector";

interface TaskBasicFieldsProps {
  form: CreateTaskFormReturn;
  columns: { id: string; title: string }[];
  availableTags?: string[];
}

export function TaskBasicFields({
  form,
  columns,
  availableTags = [],
}: TaskBasicFieldsProps) {
  const t = useTranslations("tasks.taskModal.basicFields");
  const tOptions = useTranslations("tasks.options");
  const tHooks = useTranslations("tasks.hooks");
  const {
    taskType,
    columnId,
    setColumnId,
    name,
    setName,
    description,
    setDescription,
    descriptionFlushRef,
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

  const selectedTags = useMemo(() => parseTaskTags(tagsInput), [tagsInput]);

  const handleAddTags = (rawTagInput: string) => {
    const { nextTags, addedAny, errorKey } = mergeTaskTagsWithLimit(
      selectedTags,
      parseTaskTags(rawTagInput),
      MAX_TASK_TAGS,
    );

    if (errorKey === "maxTagsError") {
      toast.error(tHooks("maxTagsError", { max: MAX_TASK_TAGS }));
    } else if (errorKey === "tagAlreadyAdded") {
      toast.error(tHooks("tagAlreadyAdded"));
    }

    if (addedAny) {
      setTagsInput(nextTags.join(", "));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const nextTags = selectedTags.filter(
      (item) => item.toLowerCase() !== tagToRemove.toLowerCase(),
    );
    setTagsInput(nextTags.join(", "));
  };

  const handleUpdateTag = (oldTag: string, newTag: string) => {
    const { nextTags, updated, errorKey } = replaceTaskTag(
      selectedTags,
      oldTag,
      newTag,
    );
    if (errorKey === "tagAlreadyAdded") {
      toast.error(tHooks("tagAlreadyAdded"));
      return;
    }
    if (updated) {
      setTagsInput(nextTags.join(", "));
    }
  };

  const handleToggleTag = (tagItem: string) => {
    const exists = selectedTags.some(
      (item) => item.toLowerCase() === tagItem.toLowerCase(),
    );
    if (exists) {
      handleRemoveTag(tagItem);
    } else {
      handleAddTags(tagItem);
    }
  };

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
              name.length >= TASK_TITLE_MAX_LENGTH
                ? "text-gold font-semibold"
                : "text-neutral-400",
            )}
          >
            {name.length}/{TASK_TITLE_MAX_LENGTH}
          </span>
        </div>
        <input
          ref={nameInputRef}
          id="taskTitle"
          type="text"
          value={name}
          onChange={(e) =>
            setName(e.target.value.slice(0, TASK_TITLE_MAX_LENGTH))
          }
          placeholder={t("titlePlaceholder")}
          className="w-full bg-card border border-neutral-600 hover:border-neutral-500 rounded-lg px-3 py-2 text-neutral-50 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 shadow-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-primary-dark/20 dark:border-primary/30 dark:hover:border-primary/50 dark:shadow-none dark:focus:border-gold dark:focus:ring-1 dark:focus:ring-gold transition-colors text-body-s"
          required
          maxLength={TASK_TITLE_MAX_LENGTH}
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
            <span className="text-neutral-400 text-xs">{t("optional")}</span>
          </label>
          <DescriptionCharCounter length={description.length} />
        </div>
        <RichTextDescriptionEditor
          id="taskDesc"
          value={description}
          onChange={setDescription}
          flushRef={descriptionFlushRef}
          placeholder={t("descriptionPlaceholder")}
          variant="modal"
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
          <TaskTagSelector
            id="taskTags"
            variant="modal"
            selectedTags={selectedTags}
            availableTags={availableTags}
            onAddTag={handleAddTags}
            onRemoveTag={handleRemoveTag}
            onUpdateTag={handleUpdateTag}
            onToggleTag={handleToggleTag}
            maxTags={MAX_TASK_TAGS}
            disabled={isPending}
          />
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
