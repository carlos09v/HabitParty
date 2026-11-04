"use client";

import { CheckCircle2, Crown, HardDrive, Mail, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/config";
import type { AdminOverviewDTO } from "@/types/admin";
import { cn } from "@/utils";
import { formatShortDate } from "@/utils/date";

interface AdminOverviewCardsProps {
  overview: AdminOverviewDTO;
}

export function AdminOverviewCards({ overview }: AdminOverviewCardsProps) {
  const t = useTranslations("admin.overview");
  const locale = useLocale() as AppLocale;

  const isHighQuota = overview.resendQuotaPercentage >= 80;
  const isMediumQuota =
    overview.resendQuotaPercentage >= 50 && overview.resendQuotaPercentage < 80;

  const formattedResetDate = overview.resendQuotaResetDate
    ? formatShortDate(overview.resendQuotaResetDate, { locale })
    : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. COTA RESEND */}
      <div className="p-4 rounded-2xl bg-surface/80 border border-white/10 backdrop-blur-md flex flex-col justify-between relative overflow-hidden group hover:border-gold/40 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-body-xs font-semibold uppercase tracking-wider text-neutral-400">
              {t("resendQuota.title")}
            </span>
            {formattedResetDate && (
              <span className="text-[10px] text-amber-400/90 font-medium">
                {t("resendQuota.renewsOn", { date: formattedResetDate })}
              </span>
            )}
          </div>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <Mail size={18} />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-neutral-100 font-mono">
              {overview.emailsSentThisMonth.toLocaleString(locale)}
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              / {overview.resendMonthlyQuota.toLocaleString(locale)}
            </span>
          </div>

          {/* Barra de Progresso */}
          <div className="mt-3 w-full h-2 rounded-full bg-neutral-800 overflow-hidden relative">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isHighQuota
                  ? "bg-red-500"
                  : isMediumQuota
                    ? "bg-amber-400"
                    : "bg-gold",
              )}
              style={{
                width: `${Math.min(overview.resendQuotaPercentage, 100)}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between mt-2 text-[11px] text-neutral-400">
            <span>
              {t("resendQuota.consumed", {
                percentage: overview.resendQuotaPercentage,
              })}
            </span>
            <span>
              {t("resendQuota.remaining", {
                count: (
                  overview.resendMonthlyQuota - overview.emailsSentThisMonth
                ).toLocaleString(locale),
              })}
            </span>
          </div>
        </div>
      </div>

      {/* 2. TOTAL DE USUÁRIOS */}
      <div className="p-4 rounded-2xl bg-surface/80 border border-white/10 backdrop-blur-md flex flex-col justify-between relative overflow-hidden group hover:border-primary-light/40 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <span className="text-body-xs font-semibold uppercase tracking-wider text-neutral-400">
            {t("users.title")}
          </span>
          <div className="p-2 rounded-xl bg-primary/20 text-primary-light">
            <Users size={18} />
          </div>
        </div>

        <div>
          <div className="text-2xl font-black text-neutral-100 font-mono">
            {overview.totalUsers.toLocaleString(locale)}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap mt-3">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-800 text-neutral-300 border border-white/5">
              {t("users.free", { count: overview.freeUsers })}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gold/15 text-gold border border-gold/30">
              <Crown size={12} />
              {t("users.vip", { count: overview.premiumUsers })}
            </span>
            {overview.founderUsers !== undefined &&
              overview.founderUsers > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gold/25 text-gold border border-gold/40 shadow-xs">
                  <Crown size={12} className="fill-gold" />
                  {t("users.founders", { count: overview.founderUsers })}
                </span>
              )}
            {overview.adminUsers > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                {t("users.admin", { count: overview.adminUsers })}
              </span>
            )}
            {overview.verifiedUsers !== undefined && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 size={11} />
                {t("users.verified", { count: overview.verifiedUsers })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. VOLUME DE TAREFAS */}
      <div className="p-4 rounded-2xl bg-surface/80 border border-white/10 backdrop-blur-md flex flex-col justify-between relative overflow-hidden group hover:border-info/40 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <span className="text-body-xs font-semibold uppercase tracking-wider text-neutral-400">
            {t("tasks.title")}
          </span>
          <div className="p-2 rounded-xl bg-blue/20 text-info">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div>
          <div className="text-2xl font-black text-neutral-100 font-mono">
            {overview.totalTasksCount.toLocaleString(locale)}
          </div>
          <div className="flex items-center justify-between mt-3 text-[11px] text-neutral-400">
            <span className="text-amber-400 font-semibold">
              {t("tasks.pending", {
                count: overview.totalActiveTasksCount.toLocaleString(locale),
              })}
            </span>
            <span className="text-neutral-500">
              {t("tasks.completed", {
                count: (
                  overview.totalTasksCount - overview.totalActiveTasksCount
                ).toLocaleString(locale),
              })}
            </span>
          </div>
        </div>
      </div>

      {/* 4. ARMAZENAMENTO DO BANCO */}
      <div className="p-4 rounded-2xl bg-surface/80 border border-white/10 backdrop-blur-md flex flex-col justify-between relative overflow-hidden group hover:border-success-500/40 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <span className="text-body-xs font-semibold uppercase tracking-wider text-neutral-400">
            {t("storage.title")}
          </span>
          <div className="p-2 rounded-xl bg-success-500/15 text-success-500">
            <HardDrive size={18} />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-success-500 font-mono">
              {overview.estimatedDatabaseSizeFormatted}
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              {t("storage.limitSuffix")}
            </span>
          </div>

          <div className="mt-3 w-full h-2 rounded-full bg-neutral-800 overflow-hidden relative">
            <div
              className="h-full rounded-full bg-success-500 transition-all duration-500"
              style={{
                width: `${Math.max(
                  Math.min(
                    (overview.estimatedDatabaseSizeBytes /
                      (1024 * 1024 * 1024)) *
                      100,
                    100,
                  ),
                  1,
                )}%`,
              }}
            />
          </div>

          <p className="mt-2 text-[11px] text-neutral-400 leading-tight">
            {t("storage.description")}
          </p>
        </div>
      </div>
    </div>
  );
}
