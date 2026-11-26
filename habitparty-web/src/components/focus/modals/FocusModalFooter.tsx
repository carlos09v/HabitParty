import { Check, Loader2, X } from "lucide-react";

interface FocusModalFooterProps {
  cancelLabel: string;
  submitLabel: string;
  submittingLabel: string;
  isSubmitting: boolean;
  submitDisabled?: boolean;
  onCancel: () => void;
}

/**
 * Rodapé padronizado de ações (Cancelar / Confirmar) para modais de formulário em Foco.
 */
export function FocusModalFooter({
  cancelLabel,
  submitLabel,
  submittingLabel,
  isSubmitting,
  submitDisabled = false,
  onCancel,
}: FocusModalFooterProps) {
  return (
    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3.5 border-t border-neutral-700 dark:border-white/10">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg text-xs font-semibold text-neutral-300 hover:text-neutral-50 hover:bg-surface dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
      >
        <X size={14} aria-hidden="true" />
        {cancelLabel}
      </button>
      <button
        type="submit"
        disabled={isSubmitting || submitDisabled}
        className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-bold bg-gold text-on-gold hover:bg-gold-hover shadow-glow-gold-xs transition-colors cursor-pointer disabled:bg-neutral-700 disabled:text-neutral-400 disabled:border disabled:border-neutral-600 disabled:shadow-none disabled:opacity-100 dark:disabled:bg-gold dark:disabled:text-on-gold dark:disabled:border-transparent dark:disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
      >
        {isSubmitting ? (
          <>
            <Loader2
              size={15}
              className="animate-spin text-on-gold"
              aria-hidden="true"
            />
            <span>{submittingLabel}</span>
          </>
        ) : (
          <>
            <Check size={15} aria-hidden="true" />
            <span>{submitLabel}</span>
          </>
        )}
      </button>
    </div>
  );
}
