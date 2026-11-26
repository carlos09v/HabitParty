import { Lock } from "lucide-react";
import { cn } from "@/utils/cn";

interface PrivateProfileNoticeProps {
  title: string;
  description: string;
  /** Variante de container: `section` (autônomo) ou `embedded` (dentro de um card). */
  variant?: "section" | "embedded";
  className?: string;
}

/**
 * Aviso padronizado exibido quando um perfil está restrito (Somente Amigos ou Privado),
 * compartilhado entre a página pública `/profile/[username]` e o Modo Visitante.
 */
export function PrivateProfileNotice({
  title,
  description,
  variant = "section",
  className,
}: PrivateProfileNoticeProps) {
  const content = (
    <>
      <Lock
        size={20}
        className="text-amber-800 dark:text-gold shrink-0 mt-0.5"
        aria-hidden="true"
      />
      <div>
        <h2 className="text-body-m font-bold text-neutral-100">{title}</h2>
        <p className="text-xs text-neutral-400 mt-1 max-w-xl leading-relaxed">
          {description}
        </p>
      </div>
    </>
  );

  if (variant === "embedded") {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-neutral-700 dark:border-primary/25 bg-surface/50 p-6 flex items-start gap-3",
          className,
        )}
      >
        {content}
      </div>
    );
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-dashed border-neutral-700 dark:border-primary/25 bg-card dark:bg-surface/55 p-6 sm:p-8 flex items-start gap-3",
        className,
      )}
    >
      {content}
    </section>
  );
}
