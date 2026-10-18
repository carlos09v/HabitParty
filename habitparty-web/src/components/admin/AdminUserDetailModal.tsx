"use client";

import { Crown, Database, Mail, X } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  ADMIN_STORAGE_BREAKDOWN_CONFIG,
  calculateStoragePercentage,
  getUserStorageLimitFormatted,
} from "@/constants/admin";
import type { AdminUserDetailDTO } from "@/types/admin";
import { cn } from "@/utils";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-surface rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-surface/90">
          <div className="flex items-center gap-3">
            <UserAvatar
              src={summary.profilePhotoUrl}
              name={summary.fullName}
              size="md"
              hasRing={summary.isPremium}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-neutral-100">
                  {summary.fullName}
                </h3>
                {summary.isFounder && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gold/20 text-gold border border-gold/40 shadow-glow-gold-xs">
                    <Crown size={12} className="fill-gold" />
                    Fundador 👑
                  </span>
                )}
                {summary.isPremium ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-gold/15 text-gold border border-gold/30">
                    <Crown size={12} />
                    Premium VIP
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-800 text-neutral-400 border border-white/5">
                    Gratuito
                  </span>
                )}
                {summary.role === "ADMIN" && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    ADMIN
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
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* CORPO ROLÁVEL */}
        <div className="p-6 overflow-y-auto space-y-6 [scrollbar-width:thin] custom-scrollbar">
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
                    <Database size={16} className="text-success-500" />
                    <span>Armazenamento no Banco de Dados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 rounded-full bg-success-500/15 border border-success-500/30 text-success-500 font-mono font-bold text-xs">
                      Total: {storage.totalFormatted} / {storageLimitFormatted}{" "}
                      ({storagePct}%)
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {storageItems.map((item) => {
                const Icon = item.icon;
                const formatted =
                  item.bytes < 1024
                    ? `${item.bytes} B`
                    : `${(item.bytes / 1024).toFixed(1)} KB`;

                return (
                  <div
                    key={item.label}
                    className="p-3.5 rounded-xl bg-surface-alt/70 border border-white/5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn("p-2 rounded-lg border", item.color)}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-neutral-200">
                          {item.label}
                        </p>
                        <p className="text-[11px] text-neutral-400 font-mono">
                          {item.count.toLocaleString()} registro(s)
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-neutral-300">
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
                <Mail size={16} className="text-amber-400" />
                <span>Histórico de E-mails Enviados (Resend)</span>
              </div>
              <span className="text-xs text-neutral-400 font-mono">
                {summary.emailsSentThisMonth} disparo(s) este mês
              </span>
            </div>

            {recentEmailLogs.length === 0 ? (
              <div className="p-6 rounded-xl bg-surface-alt/40 border border-white/5 text-center text-xs text-neutral-400">
                Nenhum e-mail disparado para este usuário até o momento.
              </div>
            ) : (
              <div className="border border-white/10 rounded-xl overflow-hidden divide-y divide-white/5 bg-surface-alt/40">
                {recentEmailLogs.map((log) => {
                  const isSent = log.status === "SENT";
                  const dateFormatted = new Date(log.sentAt).toLocaleString(
                    "pt-BR",
                    {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
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
                              ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                              : "bg-red-400",
                          )}
                        />
                        <div className="truncate">
                          <p className="font-semibold text-neutral-200 truncate">
                            {log.subject}
                          </p>
                          <p className="text-[11px] text-neutral-400">
                            Para: {log.recipientEmail}
                          </p>
                          {log.errorMessage && (
                            <p className="text-[10px] text-red-400 mt-0.5">
                              Erro: {log.errorMessage}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                            isSent
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-red-500/15 text-red-400 border border-red-500/30",
                          )}
                        >
                          {isSent ? "Enviado" : "Falhou"}
                        </span>
                        <p className="text-[10px] text-neutral-500 mt-1 font-mono">
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
        <div className="p-4 border-t border-white/10 bg-surface/90 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
