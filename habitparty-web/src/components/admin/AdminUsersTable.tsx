"use client";

import { Database, Loader2, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { StorageUsageBar } from "@/components/admin/StorageUsageBar";
import { FilterBar } from "@/components/ui/FilterBar";
import { FounderBadge } from "@/components/ui/FounderBadge";
import { Pagination } from "@/components/ui/Pagination";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  UserPlanBadge,
  UserRoleBadge,
  UserVerifiedBadge,
} from "@/components/ui/UserStatusBadges";
import {
  ADMIN_DEFAULT_PAGE_SIZE,
  ADMIN_USER_FILTER_TABS,
  FREE_USER_EMAIL_MONTHLY_LIMIT,
  FREE_USER_MAX_ACTIVE_REMINDERS,
  PREMIUM_USER_EMAIL_MONTHLY_LIMIT,
  PREMIUM_USER_MAX_ACTIVE_REMINDERS,
} from "@/constants/admin";
import type { AdminUserSummaryDTO } from "@/types/admin";
import { cn } from "@/utils";
import { calculateStoragePercentage } from "@/utils/adminUtils";

interface AdminUsersTableProps {
  users: AdminUserSummaryDTO[];
  totalPages: number;
  currentPage: number;
  totalElements: number;
  search: string;
  filter: string;
  isLoading: boolean;
  loadingUserId: string | null;
  buildPageHref: (page1Based: number) => string;
  onSearchChange: (search: string) => void;
  onFilterChange: (filter: string) => void;
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
  loadingUserId,
  buildPageHref,
  onSearchChange,
  onFilterChange,
  onSelectUser,
  onToggleRole,
}: AdminUsersTableProps) {
  const t = useTranslations("admin.usersTable");
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === search.trim()) return;

    const timer = window.setTimeout(() => {
      onSearchChange(trimmed);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput, search, onSearchChange]);

  return (
    <div className="flex flex-col gap-4">
      {/* BARRA DE FILTROS & BUSCA PADRONIZADA */}
      <FilterBar
        search={{
          value: searchInput,
          onChange: setSearchInput,
          placeholder: t("searchPlaceholder"),
        }}
        leftActions={
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface dark:bg-surface/80 border border-neutral-700 dark:border-white/10 overflow-x-auto w-full sm:w-auto">
            {ADMIN_USER_FILTER_TABS.map((tab) => {
              const isActive = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onFilterChange(tab.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer",
                    isActive
                      ? "bg-gold text-on-gold dark:text-neutral-950 font-bold shadow-sm"
                      : "text-neutral-300 hover:text-neutral-50 hover:bg-card/70 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-white/5",
                  )}
                >
                  {t(`filterTabs.${tab.id}`)}
                </button>
              );
            })}
          </div>
        }
      />

      {/* TABELA */}
      <div className="rounded-2xl border border-neutral-700 dark:border-white/10 bg-card dark:bg-surface/80 shadow-xs dark:shadow-none overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-card/85 dark:bg-background/70 flex items-center justify-center z-10">
            <span className="text-xs font-semibold text-amber-700 dark:text-gold animate-pulse">
              {t("loading")}
            </span>
          </div>
        )}

        <div className="overflow-x-auto [scrollbar-width:thin] custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-700 dark:border-white/10 bg-surface/70 dark:bg-white/[0.03] text-neutral-400 uppercase tracking-wider text-label-g font-semibold">
                <th className="py-3.5 px-4">{t("headers.user")}</th>
                <th className="py-3.5 px-4">{t("headers.role")}</th>
                <th className="py-3.5 px-4">{t("headers.plan")}</th>
                <th className="py-3.5 px-4">{t("headers.emails")}</th>
                <th className="py-3.5 px-4">{t("headers.tasks")}</th>
                <th className="py-3.5 px-4">{t("headers.storage")}</th>
                <th className="py-3.5 px-4 text-right">
                  {t("headers.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-700 dark:divide-white/5">
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-neutral-400 text-xs"
                  >
                    {t("empty")}
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isAdmin = user.role === "ADMIN";
                  const isFree = !user.isPremium;
                  const isLoadingDetail = loadingUserId === user.id;
                  const storagePct = calculateStoragePercentage(
                    user.estimatedStorageBytes,
                    user.isPremium,
                  );

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-surface/60 dark:hover:bg-white/[0.03] transition-colors"
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
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-neutral-50 dark:text-neutral-100 truncate">
                                {user.fullName}
                              </p>
                              <UserVerifiedBadge
                                isVerified={user.emailVerified}
                                verifiedLabel={t("verification.verified")}
                                unverifiedLabel={t("verification.unverified")}
                                title={
                                  user.emailVerified
                                    ? t("verification.verifiedTitle")
                                    : t("verification.unverifiedTitle")
                                }
                              />
                            </div>
                            <p className="text-label-g text-neutral-400 truncate font-normal">
                              @{user.username} • {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* CARGO */}
                      <td className="py-3.5 px-4">
                        <UserRoleBadge
                          role={user.role}
                          adminLabel={t("roles.admin")}
                          userLabel={t("roles.user")}
                          showUserRole
                        />
                      </td>

                      {/* PLANO */}
                      <td className="py-3.5 px-4">
                        {user.isFounder ? (
                          <div className="flex flex-col gap-1 items-start">
                            <FounderBadge size="sm" />
                            {user.isPremium ? (
                              <span className="text-tiny font-semibold text-emerald-700 dark:text-emerald-400">
                                {t("plans.premiumActive")}
                              </span>
                            ) : (
                              <span className="text-tiny font-semibold text-neutral-400">
                                {t("plans.freeAccess")}
                              </span>
                            )}
                          </div>
                        ) : (
                          <UserPlanBadge
                            isPremium={user.isPremium}
                            premiumLabel={t("plans.premiumVip")}
                            freeLabel={t("plans.free")}
                          />
                        )}
                      </td>

                      {/* LEMBRETES E-MAIL */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 font-mono">
                            <Mail
                              size={13}
                              className="text-amber-600 dark:text-amber-400"
                            />
                            <span className="font-bold text-neutral-100 dark:text-neutral-200">
                              {user.emailsSentThisMonth}
                            </span>
                            <span className="text-label-g text-neutral-400 dark:text-neutral-500 font-normal">
                              {t("emails.monthlyQuota", {
                                limit: isFree
                                  ? FREE_USER_EMAIL_MONTHLY_LIMIT
                                  : PREMIUM_USER_EMAIL_MONTHLY_LIMIT,
                              })}
                            </span>
                          </div>
                          {user.activeEmailReminders > 0 && (
                            <span className="text-tiny text-amber-700 dark:text-amber-400 mt-0.5">
                              {t("emails.activeReminders", {
                                active: user.activeEmailReminders,
                                max: isFree
                                  ? FREE_USER_MAX_ACTIVE_REMINDERS
                                  : PREMIUM_USER_MAX_ACTIVE_REMINDERS,
                              })}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* TAREFAS */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-bold text-neutral-100 dark:text-neutral-200">
                          {user.activeTasksCount}
                        </span>
                        <span className="text-neutral-400 dark:text-neutral-500 text-label-g font-normal">
                          {" "}
                          {t("tasks.totalSuffix", {
                            total: user.totalTasksCount,
                          })}
                        </span>
                      </td>

                      {/* ESPAÇO NO BANCO & COTA */}
                      <td className="py-3.5 px-4 font-mono">
                        <StorageUsageBar
                          bytesUsed={user.estimatedStorageBytes}
                          usedFormatted={user.estimatedStorageFormatted}
                          isPremium={user.isPremium}
                          quotaLabel={t("storage.quotaPercentage", {
                            percentage: storagePct,
                            tier: user.isPremium
                              ? t("storage.tierVip")
                              : t("storage.tierFree"),
                          })}
                        />
                      </td>

                      {/* AÇÕES */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectUser(user)}
                            disabled={isLoadingDetail}
                            className="px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-hover border border-neutral-700 text-neutral-100 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-neutral-200 dark:hover:text-white transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-60"
                            title={t("actions.detailsTitle")}
                          >
                            {isLoadingDetail ? (
                              <Loader2
                                size={13}
                                className="animate-spin text-gold"
                              />
                            ) : (
                              <Database size={13} />
                            )}
                            {t("actions.details")}
                          </button>

                          <button
                            type="button"
                            onClick={() => onToggleRole(user)}
                            className={cn(
                              "px-2.5 py-1 rounded-lg transition-colors text-xs font-semibold cursor-pointer border",
                              isAdmin
                                ? "bg-purple-500/15 hover:bg-purple-500/25 text-purple-700 border-purple-500/35 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30"
                                : "bg-surface hover:bg-surface-hover text-neutral-200 border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-300 dark:border-white/10",
                            )}
                            title={
                              isAdmin
                                ? t("actions.demoteTitle")
                                : t("actions.promoteTitle")
                            }
                          >
                            {isAdmin
                              ? t("actions.makeUser")
                              : t("actions.makeAdmin")}
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
          <div className="bg-surface/40 dark:bg-white/[0.02] px-3 py-1">
            <Pagination
              currentPage={currentPage + 1}
              totalPages={totalPages}
              totalItems={totalElements}
              itemsPerPage={ADMIN_DEFAULT_PAGE_SIZE}
              itemLabel={t("pagination.itemLabel")}
              buildHref={buildPageHref}
            />
          </div>
        ) : totalElements > 0 ? (
          <div className="p-3 border-t border-neutral-700 dark:border-white/10 bg-surface/40 dark:bg-white/[0.02] text-xs text-neutral-400 text-right">
            {t("pagination.totalSinglePagePrefix")}{" "}
            <strong className="text-neutral-200">{totalElements}</strong>{" "}
            {t("pagination.totalSinglePageSuffix")}
          </div>
        ) : null}
      </div>
    </div>
  );
}
