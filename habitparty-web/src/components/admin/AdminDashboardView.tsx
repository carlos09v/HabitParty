"use client";

import { RefreshCw, ShieldCheck } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  getAdminUserDetailAction,
  refreshAdminDataAction,
  updateUserRoleAction,
} from "@/actions/adminActions";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import type { AdminUserDetailDTO, AdminUserSummaryDTO } from "@/types/admin";
import { AdminUserDetailModal } from "./AdminUserDetailModal";
import { AdminUsersTable } from "./AdminUsersTable";

interface AdminDashboardViewProps {
  overviewCards?: ReactNode;
  users: AdminUserSummaryDTO[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  search: string;
  filter: string;
}

export function AdminDashboardView({
  overviewCards,
  users,
  totalPages,
  totalElements,
  currentPage,
  search,
  filter,
}: AdminDashboardViewProps) {
  const t = useTranslations("admin.dashboard");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedUserDetail, setSelectedUserDetail] =
    useState<AdminUserDetailDTO | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [roleModalUser, setRoleModalUser] =
    useState<AdminUserSummaryDTO | null>(null);

  const [isPendingNav, startNavTransition] = useTransition();
  const [isPendingRole, startRoleTransition] = useTransition();

  const buildUrl = useCallback(
    (updates: { search?: string; filter?: string; page?: number }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.search !== undefined) {
        if (updates.search) {
          params.set("search", updates.search);
        } else {
          params.delete("search");
        }
      }

      if (updates.filter !== undefined) {
        if (updates.filter && updates.filter !== "ALL") {
          params.set("filter", updates.filter);
        } else {
          params.delete("filter");
        }
      }

      if (updates.page !== undefined) {
        if (updates.page > 1) {
          params.set("page", String(updates.page));
        } else {
          params.delete("page");
        }
      }

      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [pathname, searchParams],
  );

  const handleSearchChange = useCallback(
    (newSearch: string) => {
      startNavTransition(() => {
        router.replace(buildUrl({ search: newSearch, page: 1 }), {
          scroll: false,
        });
      });
    },
    [buildUrl, router],
  );

  const handleFilterChange = useCallback(
    (newFilter: string) => {
      startNavTransition(() => {
        router.replace(buildUrl({ filter: newFilter, page: 1 }), {
          scroll: false,
        });
      });
    },
    [buildUrl, router],
  );

  const buildPageHref = useCallback(
    (page1Based: number) => buildUrl({ page: page1Based }),
    [buildUrl],
  );

  const handleRefreshAll = useCallback(() => {
    startNavTransition(async () => {
      await refreshAdminDataAction();
      router.refresh();
      toast.success(t("refreshedMessage"));
    });
  }, [router, t]);

  const handleSelectUser = async (user: AdminUserSummaryDTO) => {
    setLoadingUserId(user.id);
    try {
      const res = await getAdminUserDetailAction(user.id);
      if (!res.success) {
        toast.error(res.error || t("userDetailLoadError"));
        return;
      }
      setSelectedUserDetail(res.data);
      setIsDetailOpen(true);
    } finally {
      setLoadingUserId(null);
    }
  };

  const handleToggleRole = (user: AdminUserSummaryDTO) => {
    setRoleModalUser(user);
  };

  const handleConfirmRoleToggle = () => {
    if (!roleModalUser) return;
    const targetUser = roleModalUser;
    const newRole = targetUser.role === "ADMIN" ? "USER" : "ADMIN";

    startRoleTransition(async () => {
      const res = await updateUserRoleAction(targetUser.id, newRole);
      if (res.success) {
        setRoleModalUser(null);
        router.refresh();
        toast.success(
          newRole === "ADMIN"
            ? t("promotedMessage", { fullName: targetUser.fullName })
            : t("demotedMessage", { fullName: targetUser.fullName }),
        );
      } else {
        toast.error(res.error || t("roleUpdateError"));
      }
    });
  };

  return (
    <div className="flex flex-col gap-8 pb-16 animate-in fade-in duration-200">
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck size={14} />
            {t("badge")}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-50 tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-neutral-400 mt-1">{t("subtitle")}</p>
        </div>

        <button
          type="button"
          onClick={handleRefreshAll}
          disabled={isPendingNav}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-surface border border-white/10 hover:border-gold/40 text-neutral-200 hover:text-gold transition-colors text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
        >
          <RefreshCw
            size={14}
            className={isPendingNav ? "animate-spin text-gold" : ""}
          />
          {t("refreshButton")}
        </button>
      </div>

      {/* CARDS COM MÉTRICAS PRINCIPAIS (RENDERIZADOS NO SERVIDOR) */}
      {overviewCards}

      {/* TABELA DE GESTÃO DE USUÁRIOS */}
      <AdminUsersTable
        users={users}
        totalPages={totalPages}
        currentPage={currentPage}
        totalElements={totalElements}
        search={search}
        filter={filter}
        isLoading={isPendingNav}
        loadingUserId={loadingUserId}
        buildPageHref={buildPageHref}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        onSelectUser={handleSelectUser}
        onToggleRole={handleToggleRole}
      />

      {/* MODAL DE DETALHES DE ARMAZENAMENTO E E-MAILS */}
      <AdminUserDetailModal
        detail={selectedUserDetail}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedUserDetail(null);
        }}
      />

      {/* MODAL DE CONFIRMAÇÃO DE ALTERAÇÃO DE CARGO */}
      <ConfirmationModal
        isOpen={Boolean(roleModalUser)}
        onClose={() => setRoleModalUser(null)}
        onConfirm={handleConfirmRoleToggle}
        isLoading={isPendingRole}
        title={
          roleModalUser?.role === "ADMIN"
            ? t("roleModal.demoteTitle")
            : t("roleModal.promoteTitle")
        }
        variant={roleModalUser?.role === "ADMIN" ? "danger" : "warning"}
        confirmText={
          roleModalUser?.role === "ADMIN"
            ? t("roleModal.demoteConfirm")
            : t("roleModal.promoteConfirm")
        }
        cancelText={t("roleModal.cancel")}
        description={
          roleModalUser ? (
            <div className="flex flex-col gap-2">
              <p>
                {roleModalUser.role === "ADMIN" ? (
                  <>
                    {t("roleModal.demoteDescriptionPrefix")}{" "}
                    <strong className="text-neutral-100">
                      {roleModalUser.fullName}
                    </strong>{" "}
                    (@{roleModalUser.username})?
                  </>
                ) : (
                  <>
                    {t("roleModal.promoteDescriptionPrefix")}{" "}
                    <strong className="text-neutral-100">
                      {roleModalUser.fullName}
                    </strong>{" "}
                    (@{roleModalUser.username}){" "}
                    {t("roleModal.promoteDescriptionTo")}{" "}
                    <strong className="text-gold">
                      {t("roleModal.promoteRoleBadge")}
                    </strong>
                    {t("roleModal.promoteDescriptionSuffix")}
                  </>
                )}
              </p>
            </div>
          ) : null
        }
      />
    </div>
  );
}
