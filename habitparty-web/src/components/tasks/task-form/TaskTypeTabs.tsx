import { Calendar, Lock, Repeat, Target } from "lucide-react";
import { useTranslations } from "next-intl";
import type { TaskTypeOption } from "@/types/task";
import { cn } from "@/utils";

interface TaskTypeTabsProps {
  taskType: TaskTypeOption;
  onChange: (type: TaskTypeOption) => void;
  disabled?: boolean;
  isEditing?: boolean;
}

export function TaskTypeTabs({
  taskType,
  onChange,
  disabled = false,
  isEditing = false,
}: TaskTypeTabsProps) {
  const t = useTranslations("tasks.taskModal.tabs");

  return (
    <div className="grid grid-cols-3 gap-2.5 p-1 bg-surface border border-neutral-700 dark:bg-surface/60 dark:border-primary/25 rounded-xl">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("HABIT")}
        className={cn(
          "flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-bold text-body-s transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
          taskType === "HABIT"
            ? "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:border-info dark:bg-info/15 dark:text-info dark:shadow-[0_0_10px_rgba(0,194,255,0.2)] border"
            : "text-neutral-300 hover:text-sky-700 dark:hover:text-info hover:bg-white/60 dark:hover:bg-white/5",
        )}
      >
        {isEditing && taskType !== "HABIT" ? (
          <Lock size={13} className="text-neutral-400 shrink-0" />
        ) : (
          <Repeat size={16} />
        )}
        <span>{t("HABIT")}</span>
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("DAILY")}
        className={cn(
          "flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-bold text-body-s transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
          taskType === "DAILY"
            ? "border-purple-500/40 bg-purple-500/10 text-purple-700 dark:border-magenta dark:bg-magenta/15 dark:text-magenta dark:shadow-glow-magenta border"
            : "text-neutral-300 hover:text-purple-700 dark:hover:text-magenta hover:bg-white/60 dark:hover:bg-white/5",
        )}
      >
        {isEditing && taskType !== "DAILY" ? (
          <Lock size={13} className="text-neutral-400 shrink-0" />
        ) : (
          <Calendar size={16} />
        )}
        <span>{t("DAILY")}</span>
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("TODO")}
        className={cn(
          "flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-bold text-body-s transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
          taskType === "TODO"
            ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:border-gold dark:bg-gold/20 dark:text-gold dark:shadow-glow-gold-xs border"
            : "text-neutral-300 hover:text-amber-700 dark:hover:text-gold hover:bg-white/60 dark:hover:bg-white/5",
        )}
      >
        {isEditing && taskType !== "TODO" ? (
          <Lock size={13} className="text-neutral-400 shrink-0" />
        ) : (
          <Target size={16} />
        )}
        <span>{t("TODO")}</span>
      </button>
    </div>
  );
}
