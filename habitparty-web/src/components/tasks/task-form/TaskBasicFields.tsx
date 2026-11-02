import { Flag, Gauge, Sword, Swords, Tag } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Select } from "@/components/ui/Select";
import {
  DIFFICULTY_DOT_COLORS,
  DIFFICULTY_REWARDS,
  DIFFICULTY_SWORD_COLORS,
  HABIT_IMPORTANCE_OPTIONS,
  HABIT_IMPORTANCE_REWARDS,
  MAX_TASK_TAGS,
  TASK_DIFFICULTY_META,
  TASK_DIFFICULTY_OPTIONS,
  TASK_PRIORITY_META,
  TODO_PRIORITY_OPTIONS,
  toPriorityMessageKey,
} from "@/constants/task";
import type { CreateTaskFormReturn } from "@/hooks/useCreateTaskForm";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import type {
  HabitImportanceOption,
  TaskDifficultyOption,
  TaskPriorityOption,
} from "@/types/task";
import { cn } from "@/utils";
import { formatCoins } from "@/utils/economy";

const IMPORTANCE_META: Record<
  HabitImportanceOption,
  { color: string; dotColor: string }
> = {
  LOW: {
    color: "text-info",
    dotColor: "bg-info",
  },
  NORMAL: {
    color: "text-success-500",
    dotColor: "bg-success-500",
  },
  HIGH: {
    color: "text-purple-400",
    dotColor: "bg-purple-400",
  },
};

interface TaskBasicFieldsProps {
  form: CreateTaskFormReturn;
  columns: { id: string; title: string }[];
}

export function TaskBasicFields({ form, columns }: TaskBasicFieldsProps) {
  const t = useTranslations("tasks.taskModal.basicFields");
  const tOptions = useTranslations("tasks.options");
  const locale = useLocale() as AppLocale;
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

  const { isGamified } = useExperienceMode();

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
          className="w-full bg-background/50 border border-primary/40 rounded-lg px-3 py-2 text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-body-s"
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
          <span
            className={cn(
              "text-tiny tabular-nums transition-colors",
              description.length >= 500
                ? "text-gold font-semibold"
                : "text-neutral-400",
            )}
          >
            {description.length}/500
          </span>
        </div>
        <textarea
          id="taskDesc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 500))}
          placeholder={t("descriptionPlaceholder")}
          className="w-full bg-background/50 border border-primary/40 rounded-lg px-3 py-2 text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-body-s resize-none"
          maxLength={500}
          disabled={isPending}
        />
      </div>

      {/* Importância (Hábito) ou Dificuldade (ToDo / Daily) */}
      {taskType === "HABIT" ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-body-s text-neutral-100 font-medium">
              {t("importanceLabel")}
            </span>
            <InfoTooltip
              title={t("importanceTooltipTitle")}
              icon={<Gauge size={14} className="text-gold shrink-0" />}
              triggerLabel={t("stillInDoubt")}
              align="right"
              ariaLabel={t("importanceTooltipAria")}
            >
              <p className="text-neutral-300 leading-relaxed text-label-g">
                {t("importanceTooltipIntro")}
              </p>

              <ul className="flex flex-col gap-1.5 py-1 text-label-g text-neutral-200">
                {HABIT_IMPORTANCE_OPTIONS.map((imp) => {
                  const meta = IMPORTANCE_META[imp.id];
                  const reward = HABIT_IMPORTANCE_REWARDS[imp.id];
                  const coinsFormatted = formatCoins(reward.gold, { locale });
                  return (
                    <li key={imp.id} className="flex items-start gap-1.5">
                      <span
                        className={cn(
                          "font-bold shrink-0 flex items-center gap-1.5",
                          meta.color,
                        )}
                      >
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            meta.dotColor,
                          )}
                        />
                        {tOptions(`importances.${imp.id}`)}:
                      </span>
                      <span className="text-neutral-300">
                        <strong className="text-neutral-100">
                          +{reward.xp} XP • +{coinsFormatted} 🪙
                        </strong>{" "}
                        — {t(`importanceDescriptions.${imp.id}`)}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <div className="text-tiny text-neutral-300 bg-white/5 rounded-md p-2 border border-white/10">
                <strong className="text-gold block mb-0.5">
                  {t("importanceRuleTitle")}
                </strong>
                {t.rich("importanceRuleBody", {
                  bold: (chunks) => <strong>{chunks}</strong>,
                })}
              </div>
            </InfoTooltip>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {HABIT_IMPORTANCE_OPTIONS.map((imp) => {
              const meta = IMPORTANCE_META[imp.id];
              return (
                <button
                  key={imp.id}
                  type="button"
                  disabled={isPending}
                  onClick={() => setImportanceType(imp.id)}
                  className={cn(
                    "py-1.5 px-2 rounded-lg border text-body-s font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5",
                    importanceType === imp.id
                      ? "border-gold bg-gold/20 text-gold shadow-glow-gold-xs font-bold"
                      : "border-primary/30 bg-surface/60 text-neutral-300 hover:text-gold hover:border-gold/40",
                  )}
                >
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      meta.dotColor,
                    )}
                  />
                  <span>{tOptions(`importances.${imp.id}`)}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <Select
          label={
            <div className="flex items-center justify-between w-full gap-2">
              <span className="text-body-s text-neutral-100 font-medium">
                {isGamified ? t("difficultyLabel") : t("effortLabel")}
              </span>
              <InfoTooltip
                title={
                  isGamified
                    ? t("difficultyTooltipTitle")
                    : t("effortTooltipTitle")
                }
                icon={
                  isGamified ? (
                    <Swords size={14} className="text-gold shrink-0" />
                  ) : (
                    <Gauge size={14} className="text-gold shrink-0" />
                  )
                }
                triggerLabel={t("stillInDoubt")}
                align="right"
                ariaLabel={
                  isGamified
                    ? t("difficultyTooltipAria")
                    : t("effortTooltipAria")
                }
              >
                <p className="text-neutral-300 leading-relaxed text-label-g">
                  {isGamified
                    ? t("difficultyTooltipIntro")
                    : t("effortTooltipIntro")}
                </p>

                <ul className="flex flex-col gap-1.5 py-1 text-label-g text-neutral-200">
                  {TASK_DIFFICULTY_OPTIONS.map((opt) => {
                    const meta = TASK_DIFFICULTY_META[opt.id];
                    const reward = DIFFICULTY_REWARDS[opt.id];
                    const coinsFormatted = formatCoins(reward.gold, { locale });
                    const DifficultyIcon =
                      opt.id === "MEDIUM" || opt.id === "HARD" ? Swords : Sword;
                    return (
                      <li key={opt.id} className="flex items-start gap-1.5">
                        <span
                          className={cn(
                            "font-bold shrink-0 flex items-center gap-1.5",
                            meta.color,
                          )}
                        >
                          {isGamified ? (
                            <DifficultyIcon
                              size={12}
                              className={cn(
                                "shrink-0",
                                DIFFICULTY_SWORD_COLORS[opt.id],
                              )}
                            />
                          ) : (
                            <span
                              className={cn(
                                "w-2 h-2 rounded-full shrink-0",
                                DIFFICULTY_DOT_COLORS[opt.id],
                              )}
                            />
                          )}
                          {tOptions(`difficulties.${opt.id}`)}:
                        </span>
                        <span className="text-neutral-300">
                          {isGamified && (
                            <>
                              <strong className="text-neutral-100">
                                +{reward.xp} XP • +{coinsFormatted} 🪙
                              </strong>{" "}
                              —{" "}
                            </>
                          )}
                          {t(`difficultyDescriptions.${opt.id}`)}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <div className="text-tiny text-neutral-300 bg-white/5 rounded-md p-2 border border-white/10">
                  <strong className="text-gold block mb-0.5">
                    {t("difficultyGuideTitle")}
                  </strong>
                  {t.rich("difficultyGuideTrivial", {
                    bold: (chunks) => <strong>{chunks}</strong>,
                  })}
                  <br />
                  {t.rich("difficultyGuideEasy", {
                    bold: (chunks) => <strong>{chunks}</strong>,
                  })}
                  <br />
                  {t.rich("difficultyGuideMedium", {
                    bold: (chunks) => <strong>{chunks}</strong>,
                  })}
                  <br />
                  {t.rich("difficultyGuideHard", {
                    bold: (chunks) => <strong>{chunks}</strong>,
                  })}
                </div>
              </InfoTooltip>
            </div>
          }
          options={TASK_DIFFICULTY_OPTIONS.map((opt) => {
            const DifficultyIcon =
              opt.id === "MEDIUM" || opt.id === "HARD" ? Swords : Sword;
            return {
              value: opt.id,
              label: tOptions(`difficulties.${opt.id}`),
              icon: isGamified ? (
                <DifficultyIcon
                  size={14}
                  className={cn(
                    "shrink-0",
                    DIFFICULTY_SWORD_COLORS[opt.id] || "text-neutral-400",
                  )}
                />
              ) : (
                <span
                  className={cn(
                    "w-2.5 h-2.5 rounded-full shrink-0",
                    DIFFICULTY_DOT_COLORS[opt.id] || "bg-neutral-400",
                  )}
                />
              ),
            };
          })}
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
            {t("tagsLabel")}
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
              placeholder={t("tagsPlaceholder", { max: MAX_TASK_TAGS })}
              className="w-full rounded-lg text-left transition-colors py-2 pl-8 pr-3 text-body-s h-[38px] bg-background/50 border border-primary/40 text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold disabled:opacity-50 disabled:cursor-not-allowed"
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
