"use client";

import {
  BadgeCheck,
  Calendar,
  Clock,
  Crown,
  Database,
  Mail,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  ADMIN_STORAGE_BREAKDOWN_CONFIG,
  calculateStoragePercentage,
  formatStorageBytes,
  getUserStorageLimitFormatted,
} from "@/constants/admin";
import { useDateFormat } from "@/hooks/useDateFormat";
import { useTimeFormat } from "@/hooks/useTimeFormat";
import type { AppLocale } from "@/i18n/config";
import type { AdminUserDetailDTO, EmailDispatchLogDTO } from "@/types/admin";
import { cn, formatDateTime } from "@/utils";

type AdminModalTranslator = ReturnType<
  typeof useTranslations<"admin.userModal">
>;

function getLocalizedSubject(
  log: EmailDispatchLogDTO,
  t: AdminModalTranslator,
): string {
  if (
    log.emailType === "EMAIL_VERIFICATION" ||
    log.subject.toLowerCase().includes("confirme seu e-mail") ||
    log.subject.toLowerCase().includes("confirm your email")
  ) {
    return t("emails.subjects.EMAIL_VERIFICATION");
  }

  if (
    log.emailType === "PASSWORD_RESET" ||
    log.subject.toLowerCase().includes("recuperação de senha") ||
    log.subject.toLowerCase().includes("password reset")
  ) {
    return t("emails.subjects.PASSWORD_RESET");
  }

  if (
    log.emailType === "TASK_REMINDER" ||
    log.subject.toLowerCase().startsWith("lembrete de tarefa:") ||
    log.subject.toLowerCase().startsWith("task reminder:")
  ) {
    const taskName = log.subject
      .replace(/^(lembrete de tarefa:\s*|task reminder:\s*)/i, "")
      .trim();
    return t("emails.subjects.TASK_REMINDER", { task: taskName });
  }

  if (log.emailType === "SYSTEM") {
    return t("emails.subjects.SYSTEM");
  }

  return log.subject;
}

function getLocalizedErrorMessage(
  rawError: string | null | undefined,
  t: AdminModalTranslator,
): string | null {
  if (!rawError) return null;

  const err = rawError.trim();
  const lower = err.toLowerCase();

  if (
    lower.includes("falha ao enviar e-mail de verificação via resend") ||
    lower.includes("failed to send verification email")
  ) {
    return t("emails.errors.verificationFailed");
  }

  if (
    lower.includes(
      "falha ao enviar e-mail de redefinição de senha via resend",
    ) ||
    lower.includes("failed to send password reset email")
  ) {
    return t("emails.errors.passwordResetFailed");
  }

  if (
    lower.includes("falha ao enviar e-mail via resend") ||
    lower.includes("falha no provedor resend") ||
    lower.includes("failed to send email")
  ) {
    return t("emails.errors.resendProviderFailed");
  }

  const quotaMatch = err.match(
    /cota mensal de (\d+) lembretes excedida para o plano (.*)/i,
  );
  if (quotaMatch) {
    return t("emails.errors.quotaExceeded", {
      max: quotaMatch[1],
      plan: quotaMatch[2],
    });
  }

  return rawError;
}

interface AdminUserDetailModalProps {
  detail: AdminUserDetailDTO | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AdminUserDetailModal({
  detail,
  isOpen,
  onClose,
}: AdminUserDetailModalProps) {
  const t = useTranslations("admin.userModal");
  const locale = useLocale();
  const { dateFormat } = useDateFormat();
  const { timeFormat } = useTimeFormat();

  if (!isOpen || !detail) return null;

  const { summary, storage, recentEmailLogs } = detail;

  const storageItems = [
    {
      ...ADMIN_STORAGE_BREAKDOWN_CONFIG[0],
      bytes: storage.tasksBytes,
      count: storage.tasksCount,
    },
    {
      ...ADMIN_STORAGE_BREAKDOWN_CONFIG[1],
      bytes: storage.checklistsBytes,
      count: storage.checklistsCount,
    },
    {
      ...ADMIN_STORAGE_BREAKDOWN_CONFIG[2],
      bytes: storage.workspacesBytes,
      count: storage.workspacesCount,
    },
    {
      ...ADMIN_STORAGE_BREAKDOWN_CONFIG[3],
      bytes: storage.historyBytes,
      count: storage.historyCount,
    },
    {
      ...ADMIN_STORAGE_BREAKDOWN_CONFIG[4],
      bytes: storage.inventoryBytes,
      count: storage.inventoryCount,
    },
    {
      ...ADMIN_STORAGE_BREAKDOWN_CONFIG[5],
      bytes: storage.focusBytes,
      count: storage.focusCount,
    },
    {
      ...ADMIN_STORAGE_BREAKDOWN_CONFIG[6],
      bytes: storage.userRowBytes,
      count: 1,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 dark:bg-background/85 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-card dark:bg-surface rounded-2xl border border-neutral-700 dark:border-white/10 shadow-popover-dark dark:shadow-2xl flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-700 dark:border-white/10 bg-surface/50 dark:bg-surface/90">
          <div className="flex items-center gap-3">
            <UserAvatar
              src={summary.profilePhotoUrl}
              name={summary.fullName}
              size="md"
              hasRing={summary.isPremium}
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-neutral-50 dark:text-neutral-100">
                  {summary.fullName}
                </h3>
                {summary.emailVerified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                    <BadgeCheck size={12} />
                    {t("badges.verified")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25">
                    <Clock size={11} />
                    {t("badges.unverified")}
                  </span>
                )}
                {summary.isFounder && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gold/20 text-amber-700 dark:text-gold border border-gold/40 shadow-glow-gold-xs">
                    <Crown
                      size={12}
                      className="fill-amber-500 dark:fill-gold"
                    />
                    {t("badges.founder")}
                  </span>
                )}
                {summary.isPremium ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-gold/15 text-amber-700 dark:text-gold border border-gold/30">
                    <Crown size={12} />
                    {t("badges.premiumVip")}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface text-neutral-300 border border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:border-white/5">
                    {t("badges.free")}
                  </span>
                )}
                {summary.role === "ADMIN" && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                    {t("badges.admin")}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                @{summary.username} • {summary.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-50 hover:bg-surface dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label={t("closeAriaLabel")}
          >
            <X size={20} />
          </button>
        </div>

        {/* CORPO ROLÁVEL */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          {/* DATAS DA CONTA E EXPIRAÇÃO DO PREMIUM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-surface/60 dark:bg-white/[0.03] border border-neutral-700 dark:border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-lg border bg-purple-500/10 border-purple-500/25 text-purple-700 dark:text-purple-300 shrink-0">
                <Calendar size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  {t("accountInfo.createdAtLabel")}
                </p>
                <p className="text-xs font-bold text-neutral-100 font-mono truncate">
                  {summary.createdAt
                    ? formatDateTime(summary.createdAt, {
                        includeYearFull: true,
                        locale: locale as AppLocale,
                        dateFormat,
                        timeFormat,
                      })
                    : "—"}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface/60 dark:bg-white/[0.03] border border-neutral-700 dark:border-white/10 flex items-center gap-3">
              <div
                className={cn(
                  "p-2 rounded-lg border shrink-0",
                  summary.isPremium
                    ? "bg-gold/15 border-gold/30 text-amber-600 dark:text-gold"
                    : "bg-surface border-neutral-700 text-neutral-400 dark:bg-neutral-800 dark:border-white/10",
                )}
              >
                <Crown size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  {t("accountInfo.premiumExpiresLabel")}
                </p>
                <p
                  className={cn(
                    "text-xs font-bold truncate",
                    summary.subscriptionEndsAt
                      ? "text-amber-600 dark:text-gold font-mono"
                      : summary.isPremium
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-neutral-400",
                  )}
                >
                  {summary.subscriptionEndsAt
                    ? formatDateTime(summary.subscriptionEndsAt, {
                        includeYearFull: true,
                        locale: locale as AppLocale,
                        dateFormat,
                        timeFormat,
                      })
                    : summary.isPremium
                      ? t("accountInfo.lifetimeAccess")
                      : t("accountInfo.noActiveSubscription")}
                </p>
              </div>
            </div>
          </div>

          {/* DETALHAMENTO DE ARMAZENAMENTO */}
          <div>
            {(() => {
              const storageLimitFormatted = getUserStorageLimitFormatted(
                summary.isPremium,
              );
              const storagePct = calculateStoragePercentage(
                storage.totalBytes,
                summary.isPremium,
              );

              return (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-neutral-200 uppercase tracking-wider">
                    <Database
                      size={16}
                      className="text-emerald-600 dark:text-success-500"
                    />
                    <span>{t("storage.title")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 rounded-full bg-success-500/15 border border-success-500/30 text-emerald-700 dark:text-success-500 font-mono font-bold text-xs">
                      {t("storage.totalBadge", {
                        used: storage.totalFormatted,
                        limit: storageLimitFormatted,
                        percentage: storagePct,
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {storageItems.map((item) => {
                const Icon = item.icon;
                const formatted = formatStorageBytes(item.bytes);

                return (
                  <div
                    key={item.key}
                    className="p-3.5 rounded-xl bg-surface/60 dark:bg-white/[0.03] border border-neutral-700 dark:border-white/10 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn("p-2 rounded-lg border", item.color)}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-neutral-200">
                          {t(`storage.items.${item.key}`)}
                        </p>
                        <p className="text-[11px] text-neutral-400 font-mono">
                          {t("storage.recordsCount", {
                            count: item.count.toLocaleString(locale),
                          })}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-neutral-200 dark:text-neutral-300">
                      {formatted}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* HISTÓRICO DE DISPAROS DE E-MAIL */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-neutral-200 uppercase tracking-wider">
                <Mail
                  size={16}
                  className="text-amber-600 dark:text-amber-400"
                />
                <span>{t("emails.title")}</span>
              </div>
              <span className="text-xs text-neutral-400 font-mono">
                {t("emails.monthlyCount", {
                  count: summary.emailsSentThisMonth,
                })}
              </span>
            </div>

            {recentEmailLogs.length === 0 ? (
              <div className="p-6 rounded-xl bg-surface/50 dark:bg-white/[0.02] border border-neutral-700 dark:border-white/10 text-center text-xs text-neutral-400">
                {t("emails.empty")}
              </div>
            ) : (
              <div className="border border-neutral-700 dark:border-white/10 rounded-xl overflow-hidden divide-y divide-neutral-700 dark:divide-white/5 bg-surface/50 dark:bg-white/[0.02]">
                {recentEmailLogs.map((log) => {
                  const isSent = log.status === "SENT";
                  const dateFormatted = formatDateTime(log.sentAt, {
                    includeYearFull: true,
                    locale: locale as AppLocale,
                    dateFormat,
                    timeFormat,
                  });
                  const localizedSubject = getLocalizedSubject(log, t);
                  const localizedError = getLocalizedErrorMessage(
                    log.errorMessage,
                    t,
                  );

                  return (
                    <div
                      key={log.id}
                      className="p-3.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            isSent
                              ? "bg-emerald-500 dark:bg-emerald-400 dark:shadow-[0_0_8px_#34d399]"
                              : "bg-red-500 dark:bg-red-400",
                          )}
                        />
                        <div className="truncate">
                          <p className="font-semibold text-neutral-200 truncate">
                            {localizedSubject}
                          </p>
                          <p className="text-[11px] text-neutral-400">
                            {t("emails.recipientPrefix", {
                              email: log.recipientEmail,
                            })}
                          </p>
                          {localizedError && (
                            <p className="text-[10px] text-red-600 dark:text-red-400 mt-0.5">
                              {t("emails.errorPrefix", {
                                message: localizedError,
                              })}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                            isSent
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                              : "bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30",
                          )}
                        >
                          {isSent
                            ? t("emails.statusSent")
                            : t("emails.statusFailed")}
                        </span>
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1 font-mono">
                          {dateFormatted}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-neutral-700 dark:border-white/10 bg-surface/50 dark:bg-surface/90 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-card hover:bg-surface-hover border border-neutral-700 text-neutral-100 dark:bg-white/10 dark:hover:bg-white/15 dark:border-white/10 dark:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {t("closeButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
