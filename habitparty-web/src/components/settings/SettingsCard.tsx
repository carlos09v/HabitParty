import type { ReactNode } from "react";
import { cn } from "@/utils";

interface SettingsCardProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  headerAction?: ReactNode;
  isCompact?: boolean;
  variant?: "default" | "danger";
  className?: string;
  children?: ReactNode;
}

/**
 * Componente Servidor (RSC) reutilizável para padronizar os cartões e seções da tela de configurações.
 * Elimina duplicações de classes e regras visuais do Tailwind em todas as opções de configurações.
 */
export function SettingsCard({
  title,
  description,
  icon,
  headerAction,
  isCompact = false,
  variant = "default",
  className,
  children,
}: SettingsCardProps) {
  const isDanger = variant === "danger";

  return (
    <section
      className={cn(
        "rounded-2xl backdrop-blur-md flex flex-col transition-all",
        isDanger
          ? "border border-red-500/30 bg-red-950/10"
          : "border border-primary/20 bg-surface/30",
        isCompact ? "p-4 sm:p-5 gap-4" : "p-6 gap-5",
        className,
      )}
    >
      {/* Cabeçalho do Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <h3
            className={cn(
              "text-body-l font-bold flex items-center gap-2",
              isDanger ? "text-red-400" : "text-neutral-50",
            )}
          >
            {icon}
            <span>{title}</span>
          </h3>
          {description && (
            <p className="text-body-s text-neutral-300 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>

      {/* Conteúdo Interativo */}
      {children}
    </section>
  );
}
