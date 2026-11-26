"use client";

import { Database, Loader2, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { StorageUsageBar } from "@/components/admin/StorageUsageBar";
import { FilterBar } from "@/components/ui/FilterBar";
import { FilterTabStrip } from "@/components/ui/FilterTabStrip";
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
}: {
  user: AdminUserSummaryDTO;
  t: AdminTableTranslator;
}) {
  return (
    <div className="flex items-center gap-3 min-w-0 @4xl:max-w-[260px]">
      <UserAvatar
        src={user.profilePhotoUrl}
        name={user.fullName}
        size="sm"
        hasRing={user.isPremium}
        frameId="none"
      />
      <div className="min-w-0 flex-1">
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
  );
}

/** Renderiza o selo de plano (Fundador ou Padrão). */
function UserPlanBadgeCell({
  user,
  t,
}: {
  user: AdminUserSummaryDTO;
  t: AdminTableTranslator;
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
    <div className="inline-flex @4xl:flex @4xl:flex-col items-center @4xl:items-start gap-1.5 @4xl:gap-1 flex-wrap">
      <FounderBadge size="sm" />
      <span
        className={cn(
          "text-tiny font-semibold whitespace-nowrap",
          user.isPremium ? "text-success-400" : "text-neutral-400",
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
}: {
  user: AdminUserSummaryDTO;
  t: AdminTableTranslator;
}) {
  const isFree = !user.isPremium;
  return (
    <div className="flex flex-col items-end @4xl:items-start">
      <div className="flex items-center gap-1.5 font-mono">
        <Mail
          size={13}
          aria-hidden="true"
          className="text-gold-ink dark:text-amber-400 shrink-0"
        />
        <span className="font-bold text-neutral-100 dark:text-neutral-200">
          {user.emailsSentThisMonth}
        </span>
        <span className="text-label-g text-neutral-400 font-normal">
          {t("emails.monthlyQuota", {
            limit: isFree
              ? FREE_USER_EMAIL_MONTHLY_LIMIT
              : PREMIUM_USER_EMAIL_MONTHLY_LIMIT,
          })}
        </span>
      </div>
      {user.activeEmailReminders > 0 && (
        <span className="text-tiny text-gold-ink dark:text-amber-400 mt-0.5">
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
      <span className="text-neutral-400 text-label-g font-normal">
        {" "}
        {t("tasks.totalSuffix", {
          total: user.totalTasksCount,
        })}
      </span>
    </div>
  );
}

/** Botões de ação (Detalhes / Promover ou Rebaixar) com proteção de auto-rebaixamento. */
function UserActionButtons({
  user,
  t,
  isCurrentAdmin,
  isLoadingDetail,
  onSelectUser,
  onToggleRole,
}: {
  user: AdminUserSummaryDTO;
  t: AdminTableTranslator;
  isCurrentAdmin: boolean;
  isLoadingDetail: boolean;
  onSelectUser: (user: AdminUserSummaryDTO) => void;
  onToggleRole: (user: AdminUserSummaryDTO) => void;
}) {
  const isAdmin = user.role === "ADMIN";
  const isSelfDemoteDisabled = isCurrentAdmin && isAdmin;

  return (
    <div className="flex @4xl:inline-flex flex-wrap items-center justify-end gap-2 w-full @4xl:w-auto">
      <button
        type="button"
        onClick={() => onSelectUser(user)}
        disabled={isLoadingDetail}
        className="flex-1 min-[420px]:flex-initial @4xl:flex-initial px-3 py-1.5 @4xl:px-2.5 @4xl:py-1 rounded-lg bg-surface hover:bg-surface-hover border border-neutral-700 text-neutral-100 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-neutral-200 dark:hover:text-white transition-colors text-xs font-semibold flex items-center justify-center gap-1.5 @4xl:gap-1 cursor-pointer disabled:opacity-60 whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        title={t("actions.detailsTitle")}
      >
        {isLoadingDetail ? (
          <Loader2
            size={13}
            aria-hidden="true"
            className="animate-spin text-gold-ink dark:text-gold shrink-0"
          />
        ) : (
          <Database size={13} aria-hidden="true" className="shrink-0" />
        )}
        {t("actions.details")}
      </button>

      <button
        type="button"
        onClick={() => onToggleRole(user)}
        disabled={isSelfDemoteDisabled}
        className={cn(
          "flex-1 min-[420px]:flex-initial @4xl:flex-initial px-3 py-1.5 @4xl:px-2.5 @4xl:py-1 rounded-lg transition-colors text-xs font-semibold border whitespace-nowrap text-center outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
          isSelfDemoteDisabled
            ? "opacity-50 cursor-not-allowed bg-surface text-neutral-400 border-neutral-700 dark:bg-neutral-800 dark:border-white/10"
            : isAdmin
              ? "cursor-pointer bg-magenta/15 hover:bg-magenta/25 text-magenta dark:text-fuchsia-300 border-magenta/35"
              : "cursor-pointer bg-surface hover:bg-surface-hover text-neutral-200 border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-300 dark:border-white/10",
        )}
        title={
          isSelfDemoteDisabled
            ? t("actions.selfDemoteDisabledTitle")
            : isAdmin
              ? t("actions.demoteTitle")
              : t("actions.promoteTitle")
        }
      >
        {isAdmin ? t("actions.makeUser") : t("actions.makeAdmin")}
      </button>
    </div>
  );
}

interface AdminUsersTableProps {
  currentAdminId: string;
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
  onFilterChange: (filter: string, currentSearch?: string) => void;
  onSelectUser: (user: AdminUserSummaryDTO) => void;
  onToggleRole: (user: AdminUserSummaryDTO) => void;
}

export function AdminUsersTable({
  currentAdminId,
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
  const { searchInput, setSearchInput, cancel } = useDebouncedUrlSearch({
    currentSearch: search,
    onDebouncedChange: onSearchChange,
  });

  const filterTabOptions = ADMIN_USER_FILTER_TABS.map((tab) => ({
    id: tab.id,
    label: t(`filterTabs.${tab.id}`),
  }));

  const handleTabChange = (nextFilter: string) => {
    cancel();
    onFilterChange(nextFilter, searchInput.trim());
  };

  const usersWithStorage = users.map((user) => ({
    user,
    storagePct: calculateStoragePercentage(
      user.estimatedStorageBytes,
      user.isPremium,
    ),
  }));

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
          <FilterTabStrip
            options={filterTabOptions}
            value={filter}
            onChange={handleTabChange}
            ariaLabel={t("filterTabsAriaLabel")}
            className="w-full sm:w-auto"
          />
        }
      />

      {/* TABELA ÚNICA (1× DOM) ADAPTATIVA VIA CSS PURO (@container) */}
      <div className="rounded-2xl border border-neutral-700 dark:border-white/10 bg-card dark:bg-surface/80 shadow-xs dark:shadow-none overflow-hidden relative">
        {isLoading && (
          <output
            aria-live="polite"
            className="absolute inset-0 bg-card/85 dark:bg-background/70 flex items-center justify-center z-10"
          >
            <span className="text-xs font-semibold text-gold-ink dark:text-gold motion-safe:animate-pulse">
              {t("loading")}
            </span>
          </output>
        )}

        {users.length === 0 ? (
          <div className="py-12 px-4 text-center text-neutral-400 text-xs">
            {t("empty")}
          </div>
        ) : (
          <section
            // biome-ignore lint/a11y/noNoninteractiveTabindex: Região rolável acessível por teclado para tabela ampla
            tabIndex={0}
            aria-label={t("tableAriaLabel")}
            className="overflow-x-auto [scrollbar-width:thin] custom-scrollbar @max-4xl:p-3 @max-4xl:overflow-visible outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <table className="responsive-table-4xl w-full @4xl:min-w-[860px] text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-700 dark:border-white/10 bg-surface/70 dark:bg-white/[0.03] text-neutral-400 uppercase tracking-wider text-label-g font-semibold whitespace-nowrap">
                  <th scope="col" className="py-3.5 px-4">
                    {t("headers.user")}
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    {t("headers.role")}
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    {t("headers.plan")}
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    {t("headers.emails")}
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    {t("headers.tasks")}
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    {t("headers.storage")}
                  </th>
                  <th scope="col" className="py-3.5 px-4 text-right">
                    {t("headers.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-700 dark:divide-white/5 @max-4xl:divide-y-0">
                {usersWithStorage.map(({ user, storagePct }) => {
                  const isLoadingDetail = loadingUserId === user.id;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-surface/60 dark:hover:bg-white/[0.03] transition-colors"
                    >
                      {/* USUÁRIO */}
                      <th scope="row" className="py-3.5 px-4 font-normal">
                        <UserIdentityCell user={user} t={t} />
                      </th>

                      {/* CARGO */}
                      <td
                        data-label={t("headers.role")}
                        className="py-3.5 px-4"
                      >
                        <UserRoleBadge
                          role={user.role}
                          adminLabel={t("roles.admin")}
                          userLabel={t("roles.user")}
                          showUserRole
                        />
                      </td>

                      {/* PLANO */}
                      <td
                        data-label={t("headers.plan")}
                        className="py-3.5 px-4"
                      >
                        <UserPlanBadgeCell user={user} t={t} />
                      </td>

                      {/* LEMBRETES E-MAIL */}
                      <td
                        data-label={t("headers.emails")}
                        className="py-3.5 px-4 whitespace-nowrap"
                      >
                        <UserEmailMetricsCell user={user} t={t} />
                      </td>

                      {/* TAREFAS */}
                      <td
                        data-label={t("headers.tasks")}
                        className="py-3.5 px-4 whitespace-nowrap"
                      >
                        <UserTasksMetricCell user={user} t={t} />
                      </td>

                      {/* ESPAÇO NO BANCO & COTA */}
                      <td
                        data-label={t("headers.storage")}
                        data-stack-block="true"
                        className="py-3.5 px-4 font-mono"
                      >
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
                      <td
                        data-stack-actions="true"
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                      >
                        <UserActionButtons
                          user={user}
                          t={t}
                          isCurrentAdmin={user.id === currentAdminId}
                          isLoadingDetail={isLoadingDetail}
                          onSelectUser={onSelectUser}
                          onToggleRole={onToggleRole}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}

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
