import { Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { DatePicker } from "@/components/ui/DatePicker";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { TODO_REMINDER_OPTIONS } from "@/constants/task";
import type { CreateTaskFormReturn } from "@/hooks/useCreateTaskForm";
import { useUserStore } from "@/store/userStore";
import type { ReminderTypeOption } from "@/types/task";
import { isTaskHardcoreLocked } from "@/utils/date";

interface TodoFieldsProps {
  form: CreateTaskFormReturn;
}

export function TodoFields({ form }: TodoFieldsProps) {
  const t = useTranslations("tasks.taskModal.todoFields");
  const user = useUserStore((s) => s.user);
  const isPremium = useUserStore((s) =>
    Boolean(s.user?.isPremium ?? s.is_Premium),
  );
  const isEmailUnverified = user?.emailVerified === false;
  const {
    dueDate,
    setDueDate,
    reminderType,
    setReminderType,
    sendEmailReminder,
    setSendEmailReminder,
    isPending,
    isHardcore,
    isEditing,
    taskToEdit,
  } = form;

  const isOverdueHardcoreLocked = Boolean(
    isEditing && isTaskHardcoreLocked(taskToEdit),
  );

  return (
    <div className="flex flex-col gap-3.5 animate-in fade-in duration-150">
      {/* Prazo */}
      <DatePicker
        id="todoDue"
        label={isHardcore ? t("dueDateHardcoreLabel") : t("dueDateLabel")}
        value={dueDate}
        disabled={isPending || isOverdueHardcoreLocked}
        onChange={setDueDate}
        placeholder={
          isHardcore ? t("dueDateHardcorePlaceholder") : t("dueDatePlaceholder")
        }
        compact
        required={isHardcore}
        allowClear={!isOverdueHardcoreLocked && !isHardcore}
        hint={isOverdueHardcoreLocked ? t("dueDateFrozenHint") : undefined}
      />

      {/* Lembrete */}
      <Select
        label={t("reminderLabel")}
        options={TODO_REMINDER_OPTIONS.map((opt) => ({
          value: opt.id,
          label: t(`reminders.${opt.id}`),
        }))}
        value={reminderType}
        onChange={(val) => setReminderType(val as ReminderTypeOption)}
        disabled={isPending}
        compact
      />

      {/* Opção de Enviar Lembrete por E-mail (Exibida somente se houver lembrete ativo) */}
      {reminderType !== "NONE" && (
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface/60 border border-primary/25 animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-500 shrink-0">
              <Mail size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-neutral-100">
                {t("emailReminderTitle")}
              </span>
              <span className="text-label-g text-neutral-400">
                {isEmailUnverified
                  ? t("emailUnverifiedDesc")
                  : isPremium
                    ? t("emailReminderQuotaVip")
                    : t("emailReminderQuotaFree")}
              </span>
            </div>
          </div>
          <Switch
            checked={sendEmailReminder && !isEmailUnverified}
            onCheckedChange={setSendEmailReminder}
            disabled={isPending || isEmailUnverified}
            size="sm"
            aria-label={t("emailSwitchAria")}
          />
        </div>
      )}
    </div>
  );
}
