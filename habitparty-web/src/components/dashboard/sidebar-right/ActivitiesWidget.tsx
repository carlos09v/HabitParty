import {
  BookOpen,
  ChevronRight,
  Code2,
  Gamepad2,
  GraduationCap,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils";

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  {
    id: "1",
    title: "Leitura (Books, Kindle)",
    timeSpent: "1h32min",
    icon: BookOpen,
    href: "/focus?activity=reading",
  },
  {
    id: "2",
    title: "Studying (Anki, Class)",
    timeSpent: "45min",
    icon: GraduationCap,
    href: "/focus?activity=studying",
  },
  {
    id: "3",
    title: "Developing / Coding",
    timeSpent: "2h15min",
    icon: Code2,
    href: "/focus?activity=coding",
  },
  {
    id: "4",
    title: "Entertainment",
    timeSpent: "30min",
    icon: Gamepad2,
    href: "/focus?activity=entertainment",
  },
];

import { useCompactMode } from "@/hooks/useCompactMode";
import type { ActivityItem } from "@/types/dashboard";

export function ActivitiesWidget() {
  const { isCompact } = useCompactMode();
  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <h4 className="text-subtitle-s font-bold text-neutral-100">
          Atividades
        </h4>
        <span className="text-xs font-semibold text-neutral-300">4/5</span>
      </div>

      {/* Lista de Atividades (Links com tempo registrado + Botão Adicionar) */}
      <div className="flex flex-col gap-1.5 w-full">
        {DEFAULT_ACTIVITIES.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.id}
              href={act.href}
              className={cn(
                "group flex items-center justify-between rounded-lg border transition-all",
                isCompact ? "p-1.5" : "p-2",
                "bg-primary-dark/20 border-primary/30 hover:bg-primary-dark/40 hover:border-primary-light/50",
              )}
            >
              <div
                className={cn(
                  "flex items-center min-w-0",
                  isCompact ? "gap-1.5" : "gap-2",
                )}
              >
                <div className="p-1 rounded bg-primary-dark/40 text-neutral-300 group-hover:text-gold transition-colors shrink-0">
                  <Icon size={isCompact ? 13 : 15} />
                </div>
                <span
                  className={cn(
                    "font-medium text-neutral-100 truncate",
                    isCompact ? "text-xs" : "text-body-s",
                  )}
                >
                  {act.title}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <span className="text-xs font-bold text-neutral-200 group-hover:text-gold transition-colors">
                  {act.timeSpent}
                </span>
                <ChevronRight
                  size={14}
                  className="text-neutral-500 group-hover:text-gold transition-colors"
                />
              </div>
            </Link>
          );
        })}

        {/* Card de Adicionar Atividade (quando quantidade < 5) */}
        <button
          type="button"
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-all cursor-pointer group",
            isCompact ? "py-1" : "p-1.5",
            "border-primary-light/40 bg-primary-dark/15 text-primary-light hover:border-gold hover:text-gold hover:bg-primary-dark/30 hover:shadow-[0_0_10px_rgba(237,229,57,0.2)]",
          )}
        >
          <Plus
            size={14}
            className="group-hover:scale-110 transition-transform"
          />
          <span
            className={cn(
              "font-semibold",
              isCompact ? "text-label-g" : "text-xs",
            )}
          >
            Adicionar
          </span>
        </button>
      </div>
    </div>
  );
}
