import { Loader2, Save } from "lucide-react";
import { cn } from "@/utils/cn";

interface SettingsSaveButtonProps {
  label: string;
  savingLabel: string;
  isPending?: boolean;
  disabled?: boolean;
  title?: string;
  type?: "submit" | "button";
  onClick?: () => void;
  showSaveIcon?: boolean;
}

/**
 * Botão primário padronizado para ações de salvamento em Settings,
 * eliminando 4 variações divergentes entre formulários.
 */
export function SettingsSaveButton({
  label,
  savingLabel,
  isPending = false,
  disabled = false,
  title,
  type = "submit",
  onClick,
  showSaveIcon = true,
}: SettingsSaveButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isPending || disabled}
      title={title}
      className={cn(
        "w-full sm:w-auto shrink-0 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs dark:shadow-md px-5 py-2.5 text-sm",
        "bg-gold text-on-gold hover:bg-gold-hover active:bg-gold-pressed",
        "disabled:bg-neutral-700 disabled:text-neutral-400 disabled:border disabled:border-neutral-600 disabled:shadow-none disabled:opacity-100 dark:disabled:bg-gold dark:disabled:text-on-gold dark:disabled:border-transparent dark:disabled:opacity-40 disabled:cursor-not-allowed",
      )}
    >
      {isPending ? (
        <>
          <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          <span>{savingLabel}</span>
        </>
      ) : (
        <>
          {showSaveIcon && <Save size={15} aria-hidden="true" />}
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
