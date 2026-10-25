import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/utils";

export interface CatalogEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  isCompact?: boolean;
  className?: string;
}

/**
 * Estado vazio reutilizável para catálogos (Loja de Recompensas, Mochila, etc.).
 * Suporta tanto catálogo totalmente vazio quanto busca/filtros sem resultados.
 */
export function CatalogEmptyState({
  icon: Icon,
  title,
  description,
  action,
  isCompact = false,
  className,
}: CatalogEmptyStateProps) {
  return (
    <div
      className={cn(
        "w-full flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-primary/30 bg-primary-dark/20 backdrop-blur-sm",
        isCompact ? "py-8 px-4 gap-2.5" : "py-12 px-6 gap-3.5",
        className,
      )}
    >
      <div className="w-12 h-12 rounded-full bg-primary/25 border border-primary/40 flex items-center justify-center text-gold shadow-xs">
        <Icon size={24} aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1 items-center">
        <h4 className="text-body-m font-bold text-neutral-100">{title}</h4>
        <p className="text-body-s text-neutral-400 max-w-sm">{description}</p>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}
