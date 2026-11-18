import { Bell, CheckSquare, Flag, Mail, MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { TASK_PRIORITY_META, toPriorityMessageKey } from "@/constants/task";
import type { Task } from "@/types/task";
import { cn } from "@/utils";

export function TaskChecklistBadge({
  checklistCompleted,
  checklistTotal,
  isChecklistAllDone,
  isCompact = false,
}: {
  checklistCompleted: number;
  checklistTotal: number;
  isChecklistAllDone: boolean;
  isCompact?: boolean;
}) {
  const t = useTranslations("dashboard.taskShared.badges");
  const progressPercent =
    checklistTotal > 0
      ? Math.round((checklistCompleted / checklistTotal) * 100)
      : 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-md border px-1.5 py-0.5 shrink-0 transition-colors",
        isCompact ? "text-label-s leading-none" : "text-tiny",
        isChecklistAllDone
          ? "text-success-500 bg-success-500/12 border-success-500/35 font-semibold"
          : "text-neutral-200 bg-surface border-neutral-700 dark:bg-white/5 dark:border-white/12",
      )}
      title={t("checklistTitle", {
        completed: checklistCompleted,
        total: checklistTotal,
      })}
    >
      <CheckSquare
        size={isCompact ? 9 : 11}
        className={isChecklistAllDone ? "text-success-500" : "text-gold"}
      />
      <span>
        {checklistCompleted}/{checklistTotal}
      </span>
      <ProgressBar
        as="span"
        decorative
        percent={progressPercent}
        className={cn(
          "bg-neutral-700/40 dark:bg-white/10 shrink-0",
          isCompact ? "w-5 h-1" : "w-7 h-1",
        )}
        fillClassName={cn(
          "rounded-full transition-transform duration-300",
          isChecklistAllDone ? "bg-success-500" : "bg-gold",
        )}
      />
    </span>
  );
}

export function TaskDescriptionBadge({
  isCompact = false,
  className,
}: {
  isCompact?: boolean;
  className?: string;
}) {
  const t = useTranslations("dashboard.taskShared.badges");
  return (
    <span
      title={t("descriptionTitle")}
      className={cn("text-neutral-400 shrink-0", className)}
    >
      <MessageSquare size={isCompact ? 10 : 12} />
    </span>
  );
}

export function TaskPriorityBadge({
  priority,
  isCompact = false,
  sizeVariant = "row",
}: {
  priority?: Task["priority"];
  isCompact?: boolean;
  sizeVariant?: "card" | "row";
}) {
  const t = useTranslations("dashboard.taskShared");
  if (!priority || (priority as string).toUpperCase() === "NONE") {
    return null;
  }
  const meta = TASK_PRIORITY_META[priority];
  const priorityLabel = t(`priorities.${toPriorityMessageKey(priority)}`);
  return (
    <span
      title={t("badges.priorityTitle", { label: priorityLabel })}
      className={cn(
        "flex items-center justify-center transition-colors select-none shrink-0 border",
        sizeVariant === "card" ? "p-0.5 rounded" : "p-1 rounded-md",
        meta?.badgeColor ||
          "text-neutral-400 bg-surface border-neutral-700 dark:bg-white/5 dark:border-white/10",
      )}
    >
      <Flag size={isCompact ? 9 : 11} />
    </span>
  );
}

export function TaskHabitScoreBadge({
  habitScore,
  resetCounter,
  variant = "row",
  isCompact = false,
}: {
  habitScore: number;
  resetCounter?: Task["resetCounter"];
  variant?: "card" | "row";
  isCompact?: boolean;
}) {
  const t = useTranslations("dashboard.taskShared");
  const formattedScore = habitScore > 0 ? `+${habitScore}` : String(habitScore);

  if (variant === "card") {
    return (
      <span
        className={cn(
          "font-bold px-1.5 py-0.5 rounded flex items-center gap-1",
          isCompact ? "text-label-s" : "text-tiny",
          habitScore >= 0
            ? "text-success-500 bg-success-500/10"
            : "text-danger-500 bg-danger-500/10",
        )}
        title={t("badges.habitScoreCardTitle", { score: formattedScore })}
      >
        <span>{formattedScore}</span>
        <span className="font-normal opacity-70">
          {resetCounter === "WEEKLY"
            ? t("habitCycles.WEEKLY")
            : resetCounter === "MONTHLY"
              ? t("habitCycles.MONTHLY")
              : t("habitCycles.DAILY")}
        </span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "font-bold text-label-m px-1.5 py-0.5 rounded",
        habitScore >= 0
          ? "text-success-500 bg-success-500/10"
          : "text-danger-500 bg-danger-500/10",
      )}
      title={t("badges.habitScoreRowTitle", { score: formattedScore })}
    >
      {t("badges.habitScoreRowLabel", { score: formattedScore })}
    </span>
  );
}

export function TaskReminderBadge({
  reminderType,
  sendEmailReminder = false,
  emailReminderSent = false,
  isCompact = false,
}: {
  reminderType?: Task["reminderType"];
  sendEmailReminder?: boolean;
  emailReminderSent?: boolean;
  isCompact?: boolean;
}) {
  const t = useTranslations("dashboard.taskShared.badges");
  if (!reminderType || reminderType === "NONE") {
    return null;
  }

  const whenLabel = t(`reminderTypes.${reminderType}`);
  const title = sendEmailReminder
    ? emailReminderSent
      ? t("reminderEmailSentTitle", { when: whenLabel })
      : t("reminderWithEmailTitle", { when: whenLabel })
    : t("reminderScheduledTitle", { when: whenLabel });

  const iconSize = isCompact ? 10 : 11;

  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 shrink-0 transition-colors",
        sendEmailReminder
          ? "text-amber-700 bg-amber-500/10 border-amber-500/30 dark:text-gold dark:bg-gold/10 dark:border-gold/30"
          : "text-sky-700 bg-sky-500/10 border-sky-500/30 dark:text-info dark:bg-info/10 dark:border-info/30",
        emailReminderSent && "opacity-65",
      )}
    >
      <Bell size={iconSize} className="shrink-0" />
      {sendEmailReminder && <Mail size={iconSize} className="shrink-0" />}
    </span>
  );
}
