"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createFocusActivity,
  updateFocusActivity,
} from "@/actions/focusActions";
import { BaseModal } from "@/components/ui/BaseModal";
import { IconPickerPopover } from "@/components/ui/IconPickerPopover";
import { Input } from "@/components/ui/Input";
import {
  DEFAULT_POMO_MINUTES,
  FOCUS_ICON_KEYWORD_MAP,
  FOCUS_ICONS,
} from "@/constants/focus";
import type { FocusActivity, FocusRecordType } from "@/types/focus";
import { cn } from "@/utils";
import { soundEffects } from "@/utils/soundEffects";

interface FocusActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityToEdit?: FocusActivity | null;
  onSuccess: () => void;
}

export function FocusActivityModal({
  isOpen,
  onClose,
  activityToEdit,
  onSuccess,
}: FocusActivityModalProps) {
  const isEditing = Boolean(activityToEdit);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("book");
  const [hasManuallyChangedIcon, setHasManuallyChangedIcon] = useState(false);
  const [recordType, setRecordType] = useState<FocusRecordType>("POMO");
  const [targetTimeMinutes, setTargetTimeMinutes] =
    useState(DEFAULT_POMO_MINUTES);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activityToEdit) {
      setName(activityToEdit.name);
      setIcon(activityToEdit.icon || "book");
      setRecordType(activityToEdit.recordType || "POMO");
      setTargetTimeMinutes(
        activityToEdit.targetTimeMinutes || DEFAULT_POMO_MINUTES,
      );
      setHasManuallyChangedIcon(true);
    } else {
      setName("");
      setIcon("book");
      setRecordType("POMO");
      setTargetTimeMinutes(DEFAULT_POMO_MINUTES);
      setHasManuallyChangedIcon(false);
    }
  }, [activityToEdit]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);

    if (!hasManuallyChangedIcon && !isEditing) {
      const normalized = newName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      for (const [keyword, iconId] of Object.entries(FOCUS_ICON_KEYWORD_MAP)) {
        if (normalized.includes(keyword)) {
          setIcon(iconId);
          break;
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Por favor, informe o nome da atividade.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && activityToEdit) {
        const res = await updateFocusActivity(activityToEdit.id, {
          name: name.trim(),
          icon,
          recordType,
          pomoTimeMinutes:
            recordType === "POMO" ? targetTimeMinutes : undefined,
        });

        if (res.success) {
          toast.success("Atividade atualizada com sucesso!");
          onSuccess();
          onClose();
        } else {
          toast.error(res.error || "Erro ao atualizar atividade.");
        }
      } else {
        const res = await createFocusActivity({
          name: name.trim(),
          icon,
          recordType,
          targetTimeMinutes:
            recordType === "POMO" ? targetTimeMinutes : undefined,
        });

        if (res.success) {
          soundEffects.playCreateSound();
          toast.success(`Atividade "${name.trim()}" criada!`, {
            description:
              recordType === "POMO"
                ? `Ciclo Pomodoro configurado para ${targetTimeMinutes} min.`
                : "Modo Cronômetro Livre pronto para iniciar.",
          });
          onSuccess();
          onClose();
        } else {
          toast.error(res.error || "Erro ao criar atividade.");
        }
      }
    } catch {
      toast.error("Ocorreu um erro inesperado ao salvar a atividade.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar Atividade" : "Nova Atividade de Foco"}
      description={
        isEditing
          ? "Atualize as informações da atividade."
          : "Cadastre uma nova atividade importante para gerenciar suas sessões."
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
        {/* Nome da Atividade e Ícone Integrados */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="activity-name"
            className="text-body-s text-neutral-100 font-medium"
          >
            Nome da Atividade <span className="text-gold">*</span>
          </label>
          <div className="flex items-center gap-2">
            <IconPickerPopover
              options={FOCUS_ICONS}
              value={icon}
              onChange={(iconId) => {
                setIcon(iconId);
                setHasManuallyChangedIcon(true);
              }}
              disabled={isSubmitting}
              title="Ícone da Atividade"
            />
            <div className="flex-1">
              <Input
                id="activity-name"
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Ex: Estudos para Concurso, Programação, Leitura..."
                className="h-[42px]"
                required
                maxLength={40}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <span className="text-label-g text-neutral-400">
            Clique no ícone para personalizar ou digite o nome para sugestão
            automática.
          </span>
        </div>

        {/* Tipo de Registro (Pomodoro vs Cronômetro) */}
        <div className="flex flex-col gap-1.5">
          <span className="text-body-s text-neutral-100 font-medium">
            Tipo de Modo Foco
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRecordType("POMO")}
              className={cn(
                "py-2 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer",
                recordType === "POMO"
                  ? "bg-gold/20 border-gold text-gold shadow-glow-gold-xs font-bold"
                  : "bg-surface/80 border-primary/30 text-neutral-300 hover:text-neutral-100 hover:border-gold/40",
              )}
            >
              Pomodoro (Ciclos)
            </button>
            <button
              type="button"
              onClick={() => setRecordType("STOPWATCH")}
              className={cn(
                "py-2 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer",
                recordType === "STOPWATCH"
                  ? "bg-gold/20 border-gold text-gold shadow-glow-gold-xs font-bold"
                  : "bg-surface/80 border-primary/30 text-neutral-300 hover:text-neutral-100 hover:border-gold/40",
              )}
            >
              Cronômetro Livre
            </button>
          </div>
        </div>

        {/* Meta de tempo em minutos (apenas se Pomodoro) */}
        {recordType === "POMO" && (
          <Input
            id="target-minutes"
            label="Duração do Ciclo (minutos)"
            type="number"
            min={5}
            max={180}
            step={5}
            value={targetTimeMinutes}
            onChange={(e) => setTargetTimeMinutes(Number(e.target.value))}
          />
        )}

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-300 hover:bg-white/10 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-lg text-xs font-bold bg-gold text-neutral-900 hover:bg-gold-hover shadow-glow-gold-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting
              ? "Salvando..."
              : isEditing
                ? "Salvar Alterações"
                : "Criar Atividade"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
