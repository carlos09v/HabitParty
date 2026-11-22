"use client";

import { Database, Loader2, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
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
import { useDebouncedUrlSearch } from "@/hooks/useDebouncedUrlSearch";
import type { AdminUserSummaryDTO } from "@/types/admin";
import { cn } from "@/utils";
import { calculateStoragePercentage } from "@/utils/adminUtils";

type AdminTableTranslator = ReturnType<
  typeof useTranslations<"admin.usersTable">
>;

/** Renderiza nome completo, selo de verificação, username e e-mail do usuário. */
function UserIdentityCell({
  user,
  t,
  maxWidthClass,
  nameClassName,
  metaClassName,
  alignItemsClass = "items-center",
}: {
  user: AdminUserSummaryDTO;
  t: AdminTableTranslator;
  maxWidthClass?: string;
  nameClassName: string;
  metaClassName?: string;
  alignItemsClass?: string;
}) {
  return (
    <div className={cn("flex gap-3 min-w-0", alignItemsClass, maxWidthClass)}>
      <UserAvatar
        src={user.profilePhotoUrl}
        name={user.fullName}
        size="sm"
        hasRing={user.isPremium}
        frameId="none"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p
            className={cn(
              "font-bold text-neutral-50 dark:text-neutral-100 truncate",
              nameClassName,
            )}
          >
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
        <p
          className={cn(
            "text-label-g text-neutral-400 truncate font-normal",
            metaClassName,
          )}
        >
          @{user.username} • {user.email}
        </p>
      </div>
    </div>
  );
}

/** Renderiza o selo de plano (Fundador ou Padrão) nos formatos compacto em coluna ou em linha. */
function UserPlanBadgeCell({
  user,
  t,
  stackedFounder = false,
}: {
  user: AdminUserSummaryDTO;
  t: AdminTableTranslator;
  stackedFounder?: boolean;
}) {
  if (!user.isFounder) {
    return (
      <UserPlanBadge
        isPremium={user.isPremium}
        premiumLabel={t("plans.premiumVip")}
        freeLabel={t("plans.free")}
      />
    );
  }

  return (
    <div
      className={
        stackedFounder
          ? "flex flex-col gap-1 items-start"
          : "inline-flex items-center gap-1.5 flex-wrap"
      }
    >
      <FounderBadge size="sm" />
      <span
        className={cn(
          "text-tiny font-semibold whitespace-nowrap",
          user.isPremium
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-neutral-400",
        )}
      >
        {user.isPremium ? t("plans.premiumActive") : t("plans.freeAccess")}
      </span>
    </div>
  );
}

/** Exibe contagem mensal de e-mails e lembretes ativos do usuário. */
function UserEmailMetricsCell({
  user,
  t,
  reminderMarginClass,
}: {
  user: AdminUserSummaryDTO;
  t: AdminTableTranslator;
  reminderMarginClass?: string;
}) {
  const isFree = !user.isPremium;
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 font-mono">
        <Mail
          size={13}
          className="text-amber-800 dark:text-amber-400 shrink-0"
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
        <span
          className={cn(
            "text-tiny text-amber-700 dark:text-amber-400",
            reminderMarginClass,
          )}
        >
          {t("emails.activeReminders", {
            active: user.activeEmailReminders,
            max: isFree
              ? FREE_USER_MAX_ACTIVE_REMINDERS
              : PREMIUM_USER_MAX_ACTIVE_REMINDERS,
          })}
        </span>
      )}
    </div>
  );
}

/** Exibe tarefas ativas e totais do usuário com destaque tipográfico consistente. */
function UserTasksMetricCell({
  user,
  t,
}: {
  user: AdminUserSummaryDTO;
  t: AdminTableTranslator;
}) {
  return (
    <div className="font-mono">
      <span className="font-bold text-neutral-100 dark:text-neutral-200">
        {user.activeTasksCount}
      </span>
      <span className="text-neutral-400 dark:text-neutral-500 text-label-g font-normal">
        {" "}
        {t("tasks.totalSuffix", {
          total: user.totalTasksCount,
        })}
      </span>
    </div>
  );
}

/** Botões de ação (Detalhes / Promover ou Rebaixar) reutilizados entre card mobile e tabela desktop. */
function UserActionButtons({
  user,
  t,
  isLoadingDetail,
  onSelectUser,
  onToggleRole,
  variant = "table",
}: {
  user: AdminUserSummaryDTO;
  t: AdminTableTranslator;
  isLoadingDetail: boolean;
  onSelectUser: (user: AdminUserSummaryDTO) => void;
  onToggleRole: (user: AdminUserSummaryDTO) => void;
  variant?: "card" | "table";
}) {
  const isAdmin = user.role === "ADMIN";
  const isCard = variant === "card";

  return (
    <div
      className={
        isCard
          ? "flex flex-wrap items-center justify-end gap-2"
          : "inline-flex items-center gap-2"
      }
    >
      <button
        type="button"
        onClick={() => onSelectUser(user)}
        disabled={isLoadingDetail}
        className={cn(
          "rounded-lg bg-surface hover:bg-surface-hover border border-neutral-700 text-neutral-100 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-neutral-200 dark:hover:text-white transition-colors text-xs font-semibold flex items-center cursor-pointer disabled:opacity-60 whitespace-nowrap",
          isCard
            ? "flex-1 min-[420px]:flex-initial px-3 py-1.5 justify-center gap-1.5"
            : "px-2.5 py-1 gap-1",
        )}
        title={t("actions.detailsTitle")}
      >
        {isLoadingDetail ? (
          <Loader2 size={13} className="animate-spin text-gold shrink-0" />
        ) : (
          <Database size={13} className="shrink-0" />
        )}
        {t("actions.details")}
      </button>

      <button
        type="button"
        onClick={() => onToggleRole(user)}
        className={cn(
          "rounded-lg transition-colors text-xs font-semibold cursor-pointer border whitespace-nowrap",
          isCard
            ? "flex-1 min-[420px]:flex-initial px-3 py-1.5 text-center"
            : "px-2.5 py-1",
          isAdmin
            ? "bg-purple-500/15 hover:bg-purple-500/25 text-purple-700 border-purple-500/35 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30"
            : "bg-surface hover:bg-surface-hover text-neutral-200 border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-300 dark:border-white/10",
        )}
        title={isAdmin ? t("actions.demoteTitle") : t("actions.promoteTitle")}
      >
        {isAdmin ? t("actions.makeUser") : t("actions.makeAdmin")}
      </button>
    </div>
  );
}

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
  const { searchInput, setSearchInput } = useDebouncedUrlSearch({
    currentSearch: search,
    onDebouncedChange: onSearchChange,
  });

  const usersWithStorage = useMemo(
    () =>
      users.map((user) => ({
        user,
        storagePct: calculateStoragePercentage(
          user.estimatedStorageBytes,
          user.isPremium,
        ),
      })),
    [users],
  );

  return (
    <div className="@container flex flex-col gap-4">
      {/* BARRA DE FILTROS & BUSCA PADRONIZADA */}
      <FilterBar
        search={{
          value: searchInput,
          onChange: setSearchInput,
          placeholder: t("searchPlaceholder"),
        }}
        leftActions={
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface dark:bg-surface/80 border border-neutral-700 dark:border-white/10 overflow-x-auto custom-scrollbar max-w-full w-full sm:w-auto">
            {ADMIN_USER_FILTER_TABS.map((tab) => {
              const isActive = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onFilterChange(tab.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer",
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

      {/* TABELA / CARDS */}
      <div className="rounded-2xl border border-neutral-700 dark:border-white/10 bg-card dark:bg-surface/80 shadow-xs dark:shadow-none overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-card/85 dark:bg-background/70 flex items-center justify-center z-10">
            <span className="text-xs font-semibold text-amber-700 dark:text-gold animate-pulse">
              {t("loading")}
            </span>
          </div>
        )}

        {/* VISÃO EM CARDS PARA MOBILE / CONTAINERS MÉDIOS */}
        <div className="@4xl:hidden divide-y divide-neutral-700 dark:divide-white/5">
          {users.length === 0 ? (
            <div className="py-12 px-4 text-center text-neutral-400 text-xs">
              {t("empty")}
            </div>
          ) : (
            usersWithStorage.map(({ user, storagePct }) => {
              const isLoadingDetail = loadingUserId === user.id;

              return (
                <article
                  key={`card-${user.id}`}
                  className="p-4 flex flex-col gap-3.5 hover:bg-surface/40 dark:hover:bg-white/[0.02] transition-colors"
                >
                  {/* Identidade + Badges */}
                  <div className="flex flex-col gap-2.5 min-w-0">
                    <UserIdentityCell
                      user={user}
                      t={t}
                      alignItemsClass="items-start"
                      nameClassName="text-sm max-w-full"
                      metaClassName="mt-0.5"
                    />

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <UserRoleBadge
                        role={user.role}
                        adminLabel={t("roles.admin")}
                        userLabel={t("roles.user")}
                        showUserRole
                      />
                      <UserPlanBadgeCell user={user} t={t} />
                    </div>
                  </div>

                  {/* Métricas */}
                  <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-2.5 rounded-xl bg-surface/50 dark:bg-white/[0.02] border border-neutral-700/70 dark:border-white/10 p-3 text-xs">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-label-m uppercase tracking-wider text-neutral-400 font-semibold">
                        {t("headers.emails")}
                      </span>
                      <UserEmailMetricsCell user={user} t={t} />
                    </div>

                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-label-m uppercase tracking-wider text-neutral-400 font-semibold">
                        {t("headers.tasks")}
                      </span>
                      <UserTasksMetricCell user={user} t={t} />
                    </div>

                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-label-m uppercase tracking-wider text-neutral-400 font-semibold">
                        {t("headers.storage")}
                      </span>
                      <div className="font-mono">
                        <StorageUsageBar
                          bytesUsed={user.estimatedStorageBytes}
                          usedFormatted={user.estimatedStorageFormatted}
                          isPremium={user.isPremium}
                          percentage={storagePct}
                          quotaLabel={t("storage.quotaPercentage", {
                            percentage: storagePct,
                            tier: user.isPremium
                              ? t("storage.tierVip")
                              : t("storage.tierFree"),
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <UserActionButtons
                    user={user}
                    t={t}
                    isLoadingDetail={isLoadingDetail}
                    onSelectUser={onSelectUser}
                    onToggleRole={onToggleRole}
                    variant="card"
                  />
                </article>
              );
            })
          )}
        </div>

        {/* TABELA DESKTOP PARA CONTAINERS AMPLOS */}
        <section
          // biome-ignore lint/a11y/noNoninteractiveTabindex: Região rolável acessível por teclado para tabela ampla
          tabIndex={0}
          aria-label={t("headers.user")}
          className="hidden @4xl:block overflow-x-auto [scrollbar-width:thin] custom-scrollbar focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
        >
          <table className="w-full min-w-[860px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-700 dark:border-white/10 bg-surface/70 dark:bg-white/[0.03] text-neutral-400 uppercase tracking-wider text-label-g font-semibold whitespace-nowrap">
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
                usersWithStorage.map(({ user, storagePct }) => {
                  const isLoadingDetail = loadingUserId === user.id;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-surface/60 dark:hover:bg-white/[0.03] transition-colors"
                    >
                      {/* USUÁRIO */}
                      <td className="py-3.5 px-4">
                        <UserIdentityCell
                          user={user}
                          t={t}
                          maxWidthClass="max-w-[260px]"
                          nameClassName=""
                        />
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
                        <UserPlanBadgeCell user={user} t={t} stackedFounder />
                      </td>

                      {/* LEMBRETES E-MAIL */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <UserEmailMetricsCell
                          user={user}
                          t={t}
                          reminderMarginClass="mt-0.5"
                        />
                      </td>

                      {/* TAREFAS */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <UserTasksMetricCell user={user} t={t} />
                      </td>

                      {/* ESPAÇO NO BANCO & COTA */}
                      <td className="py-3.5 px-4 font-mono">
                        <StorageUsageBar
                          bytesUsed={user.estimatedStorageBytes}
                          usedFormatted={user.estimatedStorageFormatted}
                          isPremium={user.isPremium}
                          percentage={storagePct}
                          quotaLabel={t("storage.quotaPercentage", {
                            percentage: storagePct,
                            tier: user.isPremium
                              ? t("storage.tierVip")
                              : t("storage.tierFree"),
                          })}
                        />
                      </td>

                      {/* AÇÕES */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <UserActionButtons
                          user={user}
                          t={t}
                          isLoadingDetail={isLoadingDetail}
                          onSelectUser={onSelectUser}
                          onToggleRole={onToggleRole}
                          variant="table"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>

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
          <div className="p-3 border-t border-neutral-700 dark:border-white/10 bg-surface/40 dark:bg-white/[0.02] text-xs text-neutral-400 text-center sm:text-right">
            {t("pagination.totalSinglePagePrefix")}{" "}
            <strong className="text-neutral-200">{totalElements}</strong>{" "}
            {t("pagination.totalSinglePageSuffix")}
          </div>
        ) : null}
      </div>
    </div>
  );
}
