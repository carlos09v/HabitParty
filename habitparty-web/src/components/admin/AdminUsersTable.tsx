"use client";

import { Crown, Database, HardDrive, Mail, Search, Shield } from "lucide-react";
import { useState } from "react";
import { TaskPagination } from "@/components/dashboard/TaskPagination";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  ADMIN_USER_FILTER_TABS,
  calculateStoragePercentage,
  getUserStorageLimitFormatted,
} from "@/constants/admin";
import type { AdminUserSummaryDTO } from "@/types/admin";
import { cn } from "@/utils";

interface AdminUsersTableProps {
  users: AdminUserSummaryDTO[];
  totalPages: number;
  currentPage: number;
  totalElements: number;
  search: string;
  filter: string;
  isLoading: boolean;
  onSearchChange: (search: string) => void;
  onFilterChange: (filter: string) => void;
  onPageChange: (page: number) => void;
  onSelectUser: (user: AdminUserSummaryDTO) => void;
  onToggleRole: (user: AdminUserSummaryDTO) => void;
}

export function AdminUsersTable({
  users,
  totalPages,
  currentPage,
  totalElements,
  search,
  filter,
  isLoading,
  onSearchChange,
  onFilterChange,
  onPageChange,
  onSelectUser,
  onToggleRole,
}: AdminUsersTableProps) {
  const [searchInput, setSearchInput] = useState(search);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchInput);
  };

  const filterTabs = ADMIN_USER_FILTER_TABS;

  return (
    <div className="flex flex-col gap-4">
      {/* BARRA DE FILTROS & BUSCA */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Abas de Filtro */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface/80 border border-white/10 overflow-x-auto w-full sm:w-auto">
          {filterTabs.map((tab) => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onFilterChange(tab.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer",
                  isActive
                    ? "bg-gold text-neutral-950 font-bold shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Input de Busca */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative w-full sm:w-72 shrink-0"
        >
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nome, @user ou e-mail..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface/80 border border-white/10 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-gold/50"
          />
        </form>
      </div>

      {/* TABELA */}
      <div className="rounded-2xl border border-white/10 bg-surface/80 backdrop-blur-md overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-xs flex items-center justify-center z-10">
            <span className="text-xs font-semibold text-gold animate-pulse">
              Carregando dados...
            </span>
          </div>
        )}

        <div className="overflow-x-auto [scrollbar-width:thin] custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-surface-alt/40 text-neutral-400 uppercase tracking-wider text-[11px] font-semibold">
                <th className="py-3.5 px-4">Usuário</th>
                <th className="py-3.5 px-4">Cargo</th>
                <th className="py-3.5 px-4">Plano</th>
                <th className="py-3.5 px-4">Lembretes Resend (Mês)</th>
                <th className="py-3.5 px-4">Tarefas</th>
                <th className="py-3.5 px-4">Espaço no DB</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-neutral-400 text-xs"
                  >
                    Nenhum usuário encontrado para os critérios pesquisados.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isAdmin = user.role === "ADMIN";
                  const isFree = !user.isPremium;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      {/* USUÁRIO */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            src={user.profilePhotoUrl}
                            name={user.fullName}
                            size="sm"
                            hasRing={user.isPremium}
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-neutral-100 truncate">
                              {user.fullName}
                            </p>
                            <p className="text-[11px] text-neutral-400 truncate">
                              @{user.username} • {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* CARGO */}
                      <td className="py-3.5 px-4">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            <Shield size={12} />
                            ADMIN
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-800 text-neutral-400 border border-white/5">
                            USER
                          </span>
                        )}
                      </td>

                      {/* PLANO */}
                      <td className="py-3.5 px-4">
                        {user.isFounder ? (
                          <div className="flex flex-col gap-1 items-start">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gold/20 text-gold border border-gold/40 shadow-glow-gold-xs">
                              <Crown size={12} className="fill-gold" />
                              Fundador 👑
                            </span>
                            {user.isPremium ? (
                              <span className="text-[10px] font-semibold text-emerald-400">
                                • Premium Ativo
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-neutral-400">
                                • Acesso Free
                              </span>
                            )}
                          </div>
                        ) : user.isPremium ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gold/15 text-gold border border-gold/30">
                            <Crown size={12} />
                            Premium VIP
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-800 text-neutral-300 border border-white/5">
                            Aventureiro (Free)
                          </span>
                        )}
                      </td>

                      {/* LEMBRETES E-MAIL */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 font-mono">
                            <Mail size={13} className="text-amber-400" />
                            <span className="font-bold text-neutral-200">
                              {user.emailsSentThisMonth}
                            </span>
                            <span className="text-[11px] text-neutral-500">
                              {isFree ? "/ 20 no mês" : "/ 100 no mês"}
                            </span>
                          </div>
                          {user.activeEmailReminders > 0 && (
                            <span className="text-[10px] text-amber-400 mt-0.5">
                              {user.activeEmailReminders} / {isFree ? 5 : 30}{" "}
                              lembrete(s) ativo(s)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* TAREFAS */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-bold text-neutral-200">
                          {user.activeTasksCount}
                        </span>
                        <span className="text-neutral-500 text-[11px]">
                          {" "}
                          / {user.totalTasksCount} total
                        </span>
                      </td>

                      {/* ESPAÇO NO BANCO & COTA */}
                      <td className="py-3.5 px-4 font-mono">
                        {(() => {
                          const storageLimitFormatted =
                            getUserStorageLimitFormatted(user.isPremium);
                          const storagePct = calculateStoragePercentage(
                            user.estimatedStorageBytes,
                            user.isPremium,
                          );

                          return (
                            <div className="flex flex-col gap-1 min-w-[130px]">
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-success-500/10 text-success-500 border border-success-500/25 font-bold text-[11px]">
                                  <HardDrive size={11} />
                                  {user.estimatedStorageFormatted}
                                </span>
                                <span className="text-[10px] text-neutral-400">
                                  / {storageLimitFormatted}
                                </span>
                              </div>

                              <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all duration-300",
                                    storagePct >= 80
                                      ? "bg-danger-500"
                                      : storagePct >= 50
                                        ? "bg-warning-500"
                                        : "bg-success-500",
                                  )}
                                  style={{
                                    width: `${Math.max(storagePct, 2)}%`,
                                  }}
                                />
                              </div>

                              <span className="text-[10px] text-neutral-400 font-normal">
                                {storagePct}% da cota (
                                {user.isPremium ? "VIP 50MB" : "Free 5MB"})
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      {/* AÇÕES */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectUser(user)}
                            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-200 hover:text-white transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            title="Ver detalhamento de espaço e e-mails"
                          >
                            <Database size={13} />
                            Detalhes
                          </button>

                          <button
                            type="button"
                            onClick={() => onToggleRole(user)}
                            className={cn(
                              "px-2.5 py-1 rounded-lg transition-colors text-xs font-semibold cursor-pointer border",
                              isAdmin
                                ? "bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border-purple-500/30"
                                : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-white/10",
                            )}
                            title={
                              isAdmin
                                ? "Rebaixar para Usuário Comum"
                                : "Promover a Administrador"
                            }
                          >
                            {isAdmin ? "Tornar USER" : "Tornar ADMIN"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINAÇÃO */}
        {totalPages > 1 ? (
          <div className="border-t border-white/10 bg-surface-alt/10 px-3 py-1">
            <TaskPagination
              currentPage={currentPage + 1}
              totalPages={totalPages}
              totalItems={totalElements}
              itemsPerPage={15}
              itemLabel="usuários"
              onPageChange={(page) => onPageChange(page - 1)}
            />
          </div>
        ) : totalElements > 0 ? (
          <div className="p-3 border-t border-white/10 bg-surface-alt/10 text-xs text-neutral-400 text-right">
            Total de{" "}
            <strong className="text-neutral-200">{totalElements}</strong>{" "}
            usuário(s)
          </div>
        ) : null}
      </div>
    </div>
  );
}
