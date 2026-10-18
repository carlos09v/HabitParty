"use client";

import { Mail } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { TODO_REMINDER_OPTIONS } from "@/constants/task";
import type { CreateTaskFormReturn } from "@/hooks/useCreateTaskForm";
import type { ReminderTypeOption } from "@/types/task";

interface TodoFieldsProps {
  form: CreateTaskFormReturn;
}

export function TodoFields({ form }: TodoFieldsProps) {
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
    isEditing &&
      taskToEdit?.isHardcoreModeEnabled &&
      taskToEdit?.dueDate &&
      new Date(`${taskToEdit.dueDate}T23:59:59`) < new Date(),
  );

  return (
    <div className="flex flex-col gap-3.5 animate-in fade-in duration-150">
      {/* Prazo */}
      <DatePicker
        id="todoDue"
        label={
          isHardcore
            ? "Prazo de Entrega (Obrigatório no Hardcore)"
            : "Prazo de Entrega"
        }
        value={dueDate}
        disabled={isPending || isOverdueHardcoreLocked}
        onChange={setDueDate}
        placeholder={
          isHardcore ? "Selecione o prazo obrigatório..." : "Definir prazo..."
        }
        compact
        required={isHardcore}
        allowClear={!isOverdueHardcoreLocked && !isHardcore}
        hint={
          isOverdueHardcoreLocked
            ? "🔒 Data congelada: prazo expirado no Modo Hardcore."
            : undefined
        }
      />

      {/* Lembrete */}
      <Select
        label="Lembrete"
        options={TODO_REMINDER_OPTIONS.map((opt) => ({
          value: opt.id,
          label: opt.label,
        }))}
        value={reminderType}
        onChange={(val) => setReminderType(val as ReminderTypeOption)}
        disabled={isPending}
        compact
      />

      {/* Opção de Enviar Lembrete por E-mail (Exibida somente se houver lembrete ativo) */}
      {reminderType !== "NONE" && (
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-900/60 dark:bg-white/5 border border-neutral-200/20 dark:border-white/10 animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-500 shrink-0">
              <Mail size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-body-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 flex-wrap">
                Receber lembrete por e-mail?
                <span className="text-tiny font-normal px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  Free: até 5 ativos (20/mês) • VIP: até 30 ativos (100/mês)
                </span>
              </span>
              <span className="text-label-g text-neutral-500 dark:text-neutral-400">
                Enviaremos um alerta por e-mail quando o momento do alarme
                chegar.
              </span>
            </div>
          </div>
          <Switch
            checked={sendEmailReminder}
            onCheckedChange={setSendEmailReminder}
            disabled={isPending}
            size="sm"
            aria-label="Receber lembrete por e-mail"
          />
        </div>
      )}
    </div>
  );
}
