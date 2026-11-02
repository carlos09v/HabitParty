"use client";

import { Check, Loader2, Target, X } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { useFocusTimerStore } from "@/store/focusTimerStore";
import type { FocusActivity, FocusRecordType } from "@/types/focus";
import { cn } from "@/utils";
import { soundEffects } from "@/utils/soundEffects";

interface FocusActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityToEdit?: FocusActivity | null;
  onSuccess: () => void;
}

const MAX_FOCUS_ACTIVITY_NAME_LENGTH = 30;

export function FocusActivityModal({
  isOpen,
  onClose,
  activityToEdit,
  onSuccess,
}: FocusActivityModalProps) {
  const t = useTranslations("focus.activityModal");
  const isEditing = Boolean(activityToEdit);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("book");
  const [hasManuallyChangedIcon, setHasManuallyChangedIcon] = useState(false);
  const [recordType, setRecordType] = useState<FocusRecordType>("POMO");
  const [targetTimeMinutes, setTargetTimeMinutes] =
    useState(DEFAULT_POMO_MINUTES);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (activityToEdit) {
        setName(activityToEdit.name);
        setIcon(activityToEdit.icon || "book");
        setRecordType(activityToEdit.recordType || "POMO");
        setTargetTimeMinutes(
          activityToEdit.targetTimeMinutes || DEFAULT_POMO_MINUTES,
        );
        setHasManuallyChangedIcon(false);
      } else {
        setName("");
        setIcon("book");
        setRecordType("POMO");
        setTargetTimeMinutes(DEFAULT_POMO_MINUTES);
        setHasManuallyChangedIcon(false);
      }
    }
  }, [isOpen, activityToEdit]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value.slice(0, MAX_FOCUS_ACTIVITY_NAME_LENGTH);
    setName(newName);

    if (!hasManuallyChangedIcon) {
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
      toast.error(t("nameRequired"));
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
          useFocusTimerStore.getState().syncTargetMetadata({
            id: activityToEdit.id,
            name: name.trim(),
            icon,
            targetMinutes:
              recordType === "POMO" ? targetTimeMinutes : undefined,
          });
          toast.success(t("updateSuccess"));
          onSuccess();
          onClose();
        } else {
          toast.error(res.error || t("updateError"));
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
          toast.success(t("createSuccess", { name: name.trim() }), {
            description:
              recordType === "POMO"
                ? t("createSuccessPomoDesc", { minutes: targetTimeMinutes })
                : t("createSuccessStopwatchDesc"),
          });
          onSuccess();
          onClose();
        } else {
          toast.error(res.error || t("createError"));
        }
      }
    } catch {
      toast.error(t("unexpectedError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      headerIcon={<Target size={20} />}
      title={isEditing ? t("editTitle") : t("createTitle")}
      description={isEditing ? t("editDescription") : t("createDescription")}
      preventClose={isSubmitting}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
        {/* Nome da Atividade e Ícone Integrados */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="activity-name"
              className="text-body-s text-neutral-100 font-medium"
            >
              {t("nameLabel")} <span className="text-gold">*</span>
            </label>
            <span
              className={cn(
                "text-tiny tabular-nums transition-colors",
                name.length >= MAX_FOCUS_ACTIVITY_NAME_LENGTH
                  ? "text-gold font-semibold"
                  : "text-neutral-400",
              )}
            >
              {name.length}/{MAX_FOCUS_ACTIVITY_NAME_LENGTH}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <IconPickerPopover
              options={FOCUS_ICONS}
              value={icon}
              onChange={(iconId) => {
                setIcon(iconId);
                setHasManuallyChangedIcon(true);
              }}
              disabled={isSubmitting}
              title={t("iconPickerTitle")}
            />
            <div className="flex-1">
              <Input
                id="activity-name"
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder={t("namePlaceholder")}
                className="h-[42px]"
                required
                maxLength={MAX_FOCUS_ACTIVITY_NAME_LENGTH}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <span className="text-label-g text-neutral-400">{t("iconHint")}</span>
        </div>

        {/* Tipo de Registro (Pomodoro vs Cronômetro) */}
        <div className="flex flex-col gap-1.5">
          <span className="text-body-s text-neutral-100 font-medium">
            {t("modeLabel")}
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
              {t("modePomo")}
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
              {t("modeStopwatch")}
            </button>
          </div>
        </div>

        {/* Meta de tempo em minutos (apenas se Pomodoro) */}
        {recordType === "POMO" && (
          <Input
            id="target-minutes"
            label={t("cycleDurationLabel")}
            type="number"
            min={5}
            max={180}
            step={5}
            value={targetTimeMinutes}
            onChange={(e) => setTargetTimeMinutes(Number(e.target.value))}
          />
        )}

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-white/10 mt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-300 hover:text-neutral-50 hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            <X size={14} />
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="px-5 py-2.5 rounded-lg text-xs font-bold bg-gold text-on-gold hover:bg-gold-hover shadow-glow-gold-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin text-on-gold" />
                <span>{t("saving")}</span>
              </>
            ) : (
              <>
                <Check size={15} />
                <span>{isEditing ? t("saveChanges") : t("createSubmit")}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
