"use client";

import { Clock, Hourglass, Info, Target, Timer } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import {
  createFocusActivity,
  updateFocusActivity,
} from "@/actions/focusActions";
import { FocusModalFooter } from "@/components/focus/modals/FocusModalFooter";
import { BaseModal } from "@/components/ui/BaseModal";
import { DurationHoursBadge } from "@/components/ui/DurationHoursBadge";
import { IconPickerPopover } from "@/components/ui/IconPickerPopover";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Input } from "@/components/ui/Input";
import { NumberStepperInput } from "@/components/ui/NumberStepperInput";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { FOCUS_ICONS } from "@/constants/focusIcons";
import { DEFAULT_POMO_MINUTES } from "@/constants/focusRules";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import { useUserStore } from "@/store/userStore";
import type { FocusActivity, FocusRecordType } from "@/types/focus";
import { cn } from "@/utils";
import { suggestFocusIconFromName } from "@/utils/iconSuggestion";
import { soundEffects } from "@/utils/soundEffects";

interface FocusActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityToEdit?: FocusActivity | null;
  onSuccess?: (savedActivity?: FocusActivity, isEditing?: boolean) => void;
}

const MAX_FOCUS_ACTIVITY_NAME_LENGTH = 30;

export function FocusActivityModal({
  isOpen,
  onClose,
  activityToEdit,
  onSuccess,
}: FocusActivityModalProps) {
  const t = useTranslations("focus.activityModal");
  const isPremium = useUserStore((s) => s.is_Premium);
  const isEditing = Boolean(activityToEdit);
  const durationHoursHintId = useId();

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("book");
  const [hasManuallyChangedIcon, setHasManuallyChangedIcon] = useState(false);
  const [recordType, setRecordType] = useState<FocusRecordType>("POMO");
  const [targetTimeMinutes, setTargetTimeMinutes] =
    useState(DEFAULT_POMO_MINUTES);
  const [targetMinutesDraft, setTargetMinutesDraft] = useState(
    String(DEFAULT_POMO_MINUTES),
  );
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHasAttemptedSubmit(false);
      if (activityToEdit) {
        const initMins =
          activityToEdit.targetTimeMinutes || DEFAULT_POMO_MINUTES;
        setName(activityToEdit.name);
        setIcon(activityToEdit.icon || "book");
        setRecordType(activityToEdit.recordType || "POMO");
        setTargetTimeMinutes(initMins);
        setTargetMinutesDraft(String(initMins));
        // Preserva o ícone existente ao renomear uma atividade já salva.
        setHasManuallyChangedIcon(true);
      } else {
        setName("");
        setIcon("book");
        setRecordType("POMO");
        setTargetTimeMinutes(DEFAULT_POMO_MINUTES);
        setTargetMinutesDraft(String(DEFAULT_POMO_MINUTES));
        setHasManuallyChangedIcon(false);
      }
    }
  }, [isOpen, activityToEdit]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value.slice(0, MAX_FOCUS_ACTIVITY_NAME_LENGTH);
    setName(newName);

    if (!hasManuallyChangedIcon) {
      const suggested = suggestFocusIconFromName(newName, isPremium);
      if (suggested) {
        setIcon(suggested);
      }
    }
  };

  const clampTargetMinutes = (raw: string): number => {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) return DEFAULT_POMO_MINUTES;
    return Math.min(180, Math.max(5, parsed));
  };

  const nameError =
    hasAttemptedSubmit && !name.trim() ? t("nameRequired") : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setHasAttemptedSubmit(true);
      window.requestAnimationFrame(() => {
        document.getElementById("activity-name")?.focus();
      });
      return;
    }

    const effectiveMinutes = clampTargetMinutes(targetMinutesDraft);
    setTargetTimeMinutes(effectiveMinutes);
    setTargetMinutesDraft(String(effectiveMinutes));

    setIsSubmitting(true);
    try {
      if (isEditing && activityToEdit) {
        const res = await updateFocusActivity(activityToEdit.id, {
          name: name.trim(),
          icon,
          recordType,
          pomoTimeMinutes: recordType === "POMO" ? effectiveMinutes : undefined,
        });

        if (res.success) {
          useFocusTimerStore.getState().syncTargetMetadata({
            id: activityToEdit.id,
            name: name.trim(),
            icon,
            recordType,
            targetMinutes: recordType === "POMO" ? effectiveMinutes : undefined,
          });
          toast.success(t("updateSuccess"));
          onSuccess?.(
            {
              ...activityToEdit,
              name: res.data?.name || name.trim(),
              icon: res.data?.icon || icon,
              recordType: res.data?.recordType || recordType,
              targetTimeMinutes:
                recordType === "POMO"
                  ? (res.data?.targetTimeMinutes ?? effectiveMinutes)
                  : undefined,
            },
            true,
          );
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
            recordType === "POMO" ? effectiveMinutes : undefined,
        });

        if (res.success) {
          soundEffects.playCreateSound();
          toast.success(t("createSuccess", { name: name.trim() }), {
            description:
              recordType === "POMO"
                ? t("createSuccessPomoDesc", { minutes: effectiveMinutes })
                : t("createSuccessStopwatchDesc"),
          });
          onSuccess?.(
            {
              id: res.data?.id || `act-${Date.now()}`,
              name: res.data?.name || name.trim(),
              icon: res.data?.icon || icon,
              orderIndex: res.data?.orderIndex ?? 0,
              recordType: res.data?.recordType || recordType,
              targetTimeMinutes:
                recordType === "POMO"
                  ? (res.data?.targetTimeMinutes ?? effectiveMinutes)
                  : undefined,
            },
            false,
          );
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
      headerIcon={<Target size={20} aria-hidden="true" />}
      title={isEditing ? t("editTitle") : t("createTitle")}
      description={isEditing ? t("editDescription") : t("createDescription")}
      preventClose={isSubmitting}
    >
      <form
        noValidate
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 mt-2"
      >
        {/* Nome da Atividade e Ícone Integrados */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <label
                htmlFor="activity-name"
                className="text-body-s text-neutral-100 font-medium"
              >
                {t("nameLabel")} <span className="text-gold">*</span>
              </label>
              <InfoTooltip
                title={t("entertainmentWarningTitle")}
                icon={
                  <Info
                    size={14}
                    className="text-gold shrink-0"
                    aria-hidden="true"
                  />
                }
                triggerLabel={t("entertainmentWarningPill")}
                size={12}
                align="left"
                side="bottom"
                ariaLabel={t("entertainmentWarningTitle")}
                triggerClassName="bg-surface/80 border-neutral-700/80 text-neutral-400 hover:text-amber-700 hover:bg-amber-500/10 hover:border-amber-500/35 focus:text-amber-700 dark:bg-white/5 dark:border-white/10 dark:text-neutral-400 dark:hover:text-gold dark:hover:bg-gold/10 dark:hover:border-gold/30 dark:focus:text-gold"
              >
                <p className="text-neutral-300 leading-relaxed text-label-g">
                  {t("entertainmentWarning")}
                </p>
              </InfoTooltip>
            </div>
            <span
              className={cn(
                "text-tiny tabular-nums transition-colors shrink-0",
                name.length >= MAX_FOCUS_ACTIVITY_NAME_LENGTH
                  ? "text-gold font-semibold"
                  : "text-neutral-400",
              )}
            >
              {name.length}/{MAX_FOCUS_ACTIVITY_NAME_LENGTH}
            </span>
          </div>
          <div className="flex items-start gap-2">
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
                error={nameError}
              />
            </div>
          </div>
          {!nameError && (
            <span className="text-label-g text-neutral-400">
              {t("iconHint")}
            </span>
          )}
        </div>

        {/* Tipo de Registro (Pomodoro vs Cronômetro) */}
        <div className="flex flex-col gap-1.5">
          <span className="text-body-s text-neutral-100 font-medium">
            {t("modeLabel")}
          </span>
          <SegmentedControl
            ariaLabel={t("modeLabel")}
            value={recordType}
            onChange={setRecordType}
            options={[
              {
                value: "POMO",
                label: t("modePomo"),
                icon: Timer,
              },
              {
                value: "STOPWATCH",
                label: t("modeStopwatch"),
                icon: Hourglass,
              },
            ]}
          />
        </div>

        {/* Meta de tempo em minutos (apenas se Pomodoro) */}
        {recordType === "POMO" && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label
                htmlFor="target-minutes"
                className="text-body-s text-neutral-100 font-medium"
              >
                {t("cycleDurationLabel")}
              </label>
              <DurationHoursBadge
                id={durationHoursHintId}
                minutes={targetTimeMinutes}
                className="shrink-0"
              />
            </div>
            <NumberStepperInput
              id="target-minutes"
              min={5}
              max={180}
              step={5}
              value={targetMinutesDraft}
              onChange={(e) => {
                const raw = e.target.value;
                setTargetMinutesDraft(raw);
                const parsed = Number.parseInt(raw, 10);
                if (!Number.isNaN(parsed)) {
                  setTargetTimeMinutes(Math.min(180, Math.max(5, parsed)));
                }
              }}
              onBlur={() => {
                const clamped = clampTargetMinutes(targetMinutesDraft);
                setTargetTimeMinutes(clamped);
                setTargetMinutesDraft(String(clamped));
              }}
              onStep={(delta) => {
                const next = Math.min(
                  180,
                  Math.max(5, targetTimeMinutes + delta),
                );
                setTargetTimeMinutes(next);
                setTargetMinutesDraft(String(next));
              }}
              decrementDisabled={targetTimeMinutes <= 5 || isSubmitting}
              incrementDisabled={targetTimeMinutes >= 180 || isSubmitting}
              disabled={isSubmitting}
              icon={<Clock size={16} aria-hidden="true" />}
              aria-describedby={
                targetTimeMinutes >= 60 ? durationHoursHintId : undefined
              }
              className="font-semibold"
            />
          </div>
        )}

        <FocusModalFooter
          cancelLabel={t("cancel")}
          submitLabel={isEditing ? t("saveChanges") : t("createSubmit")}
          submittingLabel={t("saving")}
          isSubmitting={isSubmitting}
          onCancel={onClose}
        />
      </form>
    </BaseModal>
  );
}
