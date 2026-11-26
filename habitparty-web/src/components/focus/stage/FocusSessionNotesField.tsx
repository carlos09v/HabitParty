import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo } from "react";
import { useFocusSessionNotes } from "@/hooks/useFocusTimer";
import { useIsClient } from "@/hooks/useIsClient";
import { cn } from "@/utils";

interface FocusSessionNotesFieldProps {
  variant?: "stage" | "zen";
  className?: string;
}

/**
 * Campo isolado de anotações da sessão de foco compartilhado entre o Palco principal e o Modo Zen.
 * Protegido com `useIsClient` para evitar mismatch de hidratação SSR com notas persistidas.
 */
export const FocusSessionNotesField = memo(function FocusSessionNotesField({
  variant = "stage",
  className,
}: FocusSessionNotesFieldProps) {
  const t = useTranslations("focus.hero");
  const isClient = useIsClient();
  const { sessionNotes, setSessionNotes } = useFocusSessionNotes();

  return (
    <div
      className={cn(
        "flex items-center gap-2 transition-colors",
        variant === "zen"
          ? "w-full max-w-md rounded-xl border border-neutral-700 dark:border-primary/35 bg-card/85 dark:bg-surface/80 px-3 py-2 focus-within:border-gold/60"
          : "min-h-[38px] rounded-lg border border-primary/25 bg-surface/40 px-2.5 py-1.5 focus-within:border-gold/50",
        className,
      )}
    >
      <Sparkles
        size={variant === "zen" ? 14 : 13}
        className="text-gold shrink-0"
        aria-hidden="true"
      />
      <input
        type="text"
        value={isClient ? sessionNotes : ""}
        onChange={(e) => setSessionNotes(e.target.value)}
        placeholder={t("notesPlaceholder")}
        aria-label={t("notesAria")}
        className="w-full bg-transparent text-xs text-neutral-100 placeholder:text-neutral-400 outline-none"
      />
    </div>
  );
});
