import type { ReactNode } from "react";
import { cn } from "@/utils";

export interface SettingToggleRowProps {
  icon: ReactNode;
  iconWrapperClassName: string;
  title: ReactNode;
  description: ReactNode;
  statusBadge?: {
    label: string;
    className: string;
  };
  rightControl: ReactNode;
  footer?: ReactNode;
}

/**
 * Linha padronizada de configuração com Ícone Temático + Título/Descrição + Badge de Status + Controle (Switch/Botão).
 */
export function SettingToggleRow({
  icon,
  iconWrapperClassName,
  title,
  description,
  statusBadge,
  rightControl,
  footer,
}: SettingToggleRowProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5",
              iconWrapperClassName,
            )}
          >
            {icon}
          </div>
          <div className="flex flex-col">
            <div className="text-body-m font-bold text-neutral-100 flex items-center gap-2">
              {title}
            </div>
            <p className="text-body-s text-neutral-400">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {statusBadge && (
            <span
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-md hidden sm:inline-block border",
                statusBadge.className,
              )}
            >
              {statusBadge.label}
            </span>
          )}
          {rightControl}
        </div>
      </div>

      {footer}
    </div>
  );
}
