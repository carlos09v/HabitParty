"use client";

import { ChevronRight, Crown, Lock, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { UpgradePremiumModal } from "@/components/subscription/UpgradePremiumModal";
import {
  ACTIVITY_PERIOD_OPTIONS,
  type ActivityPeriodOption,
} from "@/constants/dashboard";
import {
  getFocusIcon,
  MAX_FOCUS_ACTIVITIES_FREE,
  MAX_FOCUS_ACTIVITIES_PREMIUM,
} from "@/constants/focus";
import { useUserStore } from "@/store/userStore";
import type { ActivitiesWidgetProps } from "@/types/dashboard";
import { cn } from "@/utils";
import { formatFocusMinutes } from "@/utils/focusFormatters";
import { calculateActivityDurationMap } from "@/utils/focusMetrics";

/**
 * Widget de Atividades de Foco com seletor de período próprio (Hoje | Semana | Mês).
 */
export function ActivitiesWidget({
  activities = [],
  records = [],
  isCompact = false,
}: ActivitiesWidgetProps) {
  const [period, setPeriod] = useState<ActivityPeriodOption>("today");
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const isPremium = useUserStore((s) => s.is_Premium);
  const maxActivities = isPremium
    ? MAX_FOCUS_ACTIVITIES_PREMIUM
    : MAX_FOCUS_ACTIVITIES_FREE;
  const isLimitReached = activities.length >= maxActivities;

  const activeActivities = activities.slice(0, maxActivities);
  const blockedActivitiesCount = !isPremium
    ? Math.max(0, activities.length - maxActivities)
    : 0;

  const activityTimeMap = useMemo(
    () => calculateActivityDurationMap(records, period),
    [records, period],
  );

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Header com Seletor Independente de Período */}
      <div className="flex items-center justify-between gap-2 w-full">
        <div className="flex items-center gap-1.5 min-w-0">
          <h4 className="text-subtitle-s font-bold text-neutral-100 truncate">
            Atividades
          </h4>
          <span className="text-tiny font-semibold text-neutral-400">
            ({activities.length}/{maxActivities})
          </span>
        </div>

        <fieldset
          className="inline-flex items-center rounded-lg bg-white/5 border border-white/10 p-0.5 shrink-0 m-0"
          aria-label="Período do tempo de foco"
        >
          {ACTIVITY_PERIOD_OPTIONS.map((opt) => {
            const isActive = period === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPeriod(opt.id)}
                aria-pressed={isActive}
                className={cn(
                  "px-1.5 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer",
                  isActive
                    ? "bg-gold text-neutral-900 font-bold shadow-xs"
                    : "text-neutral-400 hover:text-neutral-200",
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </fieldset>
      </div>

      {/* Lista de Atividades */}
      <div className="flex flex-col gap-1.5 w-full">
        {activeActivities.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 bg-white/5 p-3 text-center text-xs text-neutral-400">
            Nenhuma atividade cadastrada.
          </div>
        ) : (
          activeActivities.map((act) => {
            const Icon = getFocusIcon(act.icon);
            const minutes = activityTimeMap[act.id] || 0;

            return (
              <Link
                key={act.id}
                href={`/focus?activityId=${act.id}`}
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
                    {act.name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span className="text-xs font-bold text-neutral-200 group-hover:text-gold transition-colors">
                    {formatFocusMinutes(minutes)}
                  </span>
                  <ChevronRight
                    size={14}
                    className="text-neutral-500 group-hover:text-gold transition-colors"
                  />
                </div>
              </Link>
            );
          })
        )}

        {/* Card discreto de atividades bloqueadas */}
        {blockedActivitiesCount > 0 && (
          <button
            type="button"
            onClick={() => setIsUpgradeModalOpen(true)}
            title={`${blockedActivitiesCount} ${blockedActivitiesCount === 1 ? "atividade preservada" : "atividades preservadas"} do período Premium. Reative o plano Premium para cronometrar!`}
            className={cn(
              "group flex items-center justify-between rounded-lg border transition-all text-left w-full cursor-pointer",
              isCompact ? "p-1.5" : "p-2",
              "bg-gold/5 border-gold/25 hover:bg-gold/15 hover:border-gold/50",
            )}
          >
            <div
              className={cn(
                "flex items-center min-w-0",
                isCompact ? "gap-1.5" : "gap-2",
              )}
            >
              <div className="p-1 rounded bg-gold/15 text-gold shrink-0">
                <Lock size={isCompact ? 12 : 14} />
              </div>
              <span
                className={cn(
                  "font-medium text-neutral-300 group-hover:text-neutral-100 truncate",
                  isCompact ? "text-xs" : "text-body-s",
                )}
              >
                {blockedActivitiesCount}{" "}
                {blockedActivitiesCount === 1
                  ? "atividade bloqueada"
                  : "atividades bloqueadas"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold px-1.5 py-0.5 rounded bg-gold/15 border border-gold/30 flex items-center gap-1">
                VIP 👑
              </span>
            </div>
          </button>
        )}

        {/* Botão de Adicionar ou Limite Atingido (apenas se não houver itens bloqueados exibidos) */}
        {blockedActivitiesCount === 0 &&
          (isLimitReached ? (
            !isPremium ? (
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(true)}
                title="Assine o plano Premium para criar até 6 atividades de foco!"
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-all cursor-pointer group",
                  isCompact ? "py-1" : "p-1.5",
                  "border-gold/40 bg-gold/5 text-gold hover:bg-gold/15 hover:border-gold hover:shadow-glow-gold-xs",
                )}
              >
                <Crown size={14} className="fill-gold/20" />
                <span
                  className={cn(
                    "font-bold",
                    isCompact ? "text-label-g" : "text-xs",
                  )}
                >
                  Limite Atingido • Seja Premium 👑
                </span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                title={`Limite de ${maxActivities} atividades atingido`}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-all cursor-not-allowed opacity-60",
                  isCompact ? "py-1" : "p-1.5",
                  "border-neutral-700 bg-neutral-800/30 text-neutral-400",
                )}
              >
                <Lock size={14} />
                <span
                  className={cn(
                    "font-semibold",
                    isCompact ? "text-label-g" : "text-xs",
                  )}
                >
                  Limite atingido ({maxActivities}/{maxActivities})
                </span>
              </button>
            )
          ) : (
            <Link
              href="/focus?createActivity=true"
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-all cursor-pointer group",
                isCompact ? "py-1" : "p-1.5",
                "border-primary-light/40 bg-primary-dark/15 text-primary-light hover:border-gold hover:text-gold hover:bg-primary-dark/30 hover:shadow-glow-gold-sm",
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
            </Link>
          ))}
      </div>

      <UpgradePremiumModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </div>
  );
}
