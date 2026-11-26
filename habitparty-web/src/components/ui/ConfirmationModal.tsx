"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useId, useState } from "react";
import { BaseModal } from "./BaseModal";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
  description: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "default";
  isLoading?: boolean;
  confirmDisabled?: boolean;
  /** Checkbox opcional exibido abaixo da descrição (ex.: "Excluir também do Histórico"). */
  checkboxLabel?: ReactNode;
  /** Texto auxiliar exibido abaixo do rótulo do checkbox. */
  checkboxHint?: ReactNode;
  checkboxChecked?: boolean;
  onCheckboxChange?: (checked: boolean) => void;
  /** Quando informado, exige digitação exata (case-insensitive) para habilitar confirmação destrutiva. */
  confirmInputValue?: string;
  confirmInputLabel?: ReactNode;
  confirmInputPlaceholder?: string;
  /** Classes adicionais no `<dialog>` externo (ex.: `zen-dimmed-dark` sobre Modo Zen escurecido). */
  containerClassName?: string;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant = "danger",
  isLoading = false,
  confirmDisabled = false,
  checkboxLabel,
  checkboxHint,
  checkboxChecked = false,
  onCheckboxChange,
  confirmInputValue,
  confirmInputLabel,
  confirmInputPlaceholder,
  containerClassName,
}: ConfirmationModalProps) {
  const t = useTranslations("ui.confirmationModal");
  const checkboxId = useId();
  const confirmInputId = useId();
  const [typedConfirmation, setTypedConfirmation] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setTypedConfirmation("");
    }
  }, [isOpen]);

  const showCheckbox = Boolean(checkboxLabel && onCheckboxChange);
  const requiresTypedConfirmation = Boolean(
    confirmInputValue && confirmInputValue.trim().length > 0,
  );
  const isTypedConfirmationValid =
    !requiresTypedConfirmation ||
    typedConfirmation.trim().toLowerCase() ===
      (confirmInputValue ?? "").trim().toLowerCase();

  const resolvedConfirmText = confirmText ?? t("confirm");
  const resolvedCancelText = cancelText ?? t("cancel");
  const isDanger = variant === "danger";
  const isWarning = variant === "warning";

  const borderColor = isDanger
    ? "border-red-500/35 dark:border-red-500/30"
    : isWarning
      ? "border-amber-500/40 dark:border-amber-500/30"
      : "border-neutral-700 dark:border-primary/30";

  const headerExtra = (
    <AlertTriangle
      size={20}
      aria-hidden="true"
      className={
        isDanger
          ? "text-danger-400"
          : isWarning
            ? "text-warning-400 dark:text-amber-400"
            : "text-gold-ink dark:text-gold"
      }
    />
  );

  const confirmBtnClasses = isDanger
    ? "bg-red-600 hover:bg-red-700 text-white shadow-xs"
    : isWarning
      ? "bg-amber-500 hover:bg-amber-400 text-on-gold shadow-glow-gold-xs"
      : "bg-gold hover:bg-gold-hover text-on-gold shadow-glow-gold-xs";

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-sm"
      borderColor={borderColor}
      containerClassName={containerClassName}
      preventClose={isLoading}
      headerExtra={headerExtra}
      title={
        <span
          className={
            isDanger
              ? "text-danger-400"
              : isWarning
                ? "text-warning-400 dark:text-amber-400"
                : "text-neutral-100"
          }
        >
          {title}
        </span>
      }
    >
      <div className="flex flex-col gap-4 mt-1">
        <div className="text-body-s text-neutral-300 leading-relaxed">
          {description}
        </div>

        {showCheckbox && (
          <label
            htmlFor={checkboxId}
            className="flex items-start gap-2.5 p-2.5 rounded-lg border border-neutral-700 dark:border-white/10 bg-surface/60 dark:bg-white/5 cursor-pointer hover:bg-surface-hover dark:hover:bg-white/10 transition-colors has-disabled:cursor-not-allowed has-disabled:opacity-60"
          >
            <input
              id={checkboxId}
              type="checkbox"
              checked={checkboxChecked}
              onChange={(e) => onCheckboxChange?.(e.target.checked)}
              disabled={isLoading}
              className="checkbox-custom checkbox-custom-danger mt-0.5"
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-neutral-200">
                {checkboxLabel}
              </span>
              {checkboxHint && (
                <span className="text-tiny text-neutral-400 leading-snug">
                  {checkboxHint}
                </span>
              )}
            </span>
          </label>
        )}

        {requiresTypedConfirmation && (
          <div className="flex flex-col gap-1.5">
            {confirmInputLabel && (
              <label
                htmlFor={confirmInputId}
                className="text-xs font-medium text-neutral-200 leading-snug"
              >
                {confirmInputLabel}
              </label>
            )}
            <input
              id={confirmInputId}
              type="text"
              value={typedConfirmation}
              onChange={(e) => setTypedConfirmation(e.target.value)}
              placeholder={confirmInputPlaceholder ?? confirmInputValue}
              disabled={isLoading}
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-lg border border-neutral-700 dark:border-white/15 bg-card dark:bg-surface px-3 py-2 text-sm text-neutral-50 placeholder:text-neutral-400 focus:outline-none focus:border-red-500/70 focus:ring-2 focus:ring-red-500/20 disabled:opacity-60"
            />
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-2.5 pt-3 border-t border-neutral-700 dark:border-white/10">
          <button
            type="button"
            // biome-ignore lint/a11y/noAutofocus: Dialog destrutivo deve focar a ação segura (Cancelar) por padrão
            autoFocus={isDanger}
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-semibold text-neutral-300 hover:bg-surface-hover dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            {resolvedCancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading || confirmDisabled || !isTypedConfirmationValid}
            className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${confirmBtnClasses}`}
          >
            {isLoading ? (
              <>
                <Loader2
                  size={14}
                  className="animate-spin"
                  aria-hidden="true"
                />
                <span>{t("processing")}</span>
              </>
            ) : (
              <span>{resolvedConfirmText}</span>
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
