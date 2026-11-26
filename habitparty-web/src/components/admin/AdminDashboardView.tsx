"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  getAdminUserDetailAction,
  updateUserRoleAction,
} from "@/actions/adminActions";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import type { AdminUserDetailDTO, AdminUserSummaryDTO } from "@/types/admin";
import { buildAdminUsersUrl } from "@/utils/adminUtils";
import { AdminUsersTable } from "./AdminUsersTable";

const AdminUserDetailModal = dynamic(
  () =>
    import("./AdminUserDetailModal").then((mod) => mod.AdminUserDetailModal),
  { ssr: false },
);

interface AdminDashboardViewProps {
  currentAdminId: string;
  overviewCards?: ReactNode;
  users: AdminUserSummaryDTO[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  search: string;
  filter: string;
}

export function AdminDashboardView({
  currentAdminId,
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
  const detailRequestSeqRef = useRef(0);

  const [isPendingNav, startNavTransition] = useTransition();
  const [isPendingRole, startRoleTransition] = useTransition();

  const buildUrl = (updates: {
    search?: string;
    filter?: string;
    page?: number;
  }) =>
    buildAdminUsersUrl({
      basePath: pathname,
      currentParams: searchParams.toString(),
      ...updates,
    });

  const handleSearchChange = (newSearch: string) => {
    startNavTransition(() => {
      router.replace(buildUrl({ search: newSearch, page: 1 }), {
        scroll: false,
      });
    });
  };

  const handleFilterChange = (newFilter: string, currentSearch?: string) => {
    startNavTransition(() => {
      router.replace(
        buildUrl({
          filter: newFilter,
          ...(currentSearch !== undefined ? { search: currentSearch } : {}),
          page: 1,
        }),
        {
          scroll: false,
        },
      );
    });
  };

  const buildPageHref = (page1Based: number) => buildUrl({ page: page1Based });

  const handleSelectUser = async (user: AdminUserSummaryDTO) => {
    const requestSeq = ++detailRequestSeqRef.current;
    setLoadingUserId(user.id);
    try {
      const res = await getAdminUserDetailAction(user.id);
      if (requestSeq !== detailRequestSeqRef.current) return;
      if (!res.success) {
        toast.error(res.error || t("userDetailLoadError"));
        return;
      }
      setSelectedUserDetail(res.data);
      setIsDetailOpen(true);
    } catch {
      if (requestSeq !== detailRequestSeqRef.current) return;
      toast.error(t("userDetailLoadError"));
    } finally {
      if (requestSeq === detailRequestSeqRef.current) {
        setLoadingUserId(null);
      }
    }
  };

  const handleToggleRole = (user: AdminUserSummaryDTO) => {
    if (user.id === currentAdminId && user.role === "ADMIN") {
      return;
    }
    setRoleModalUser(user);
  };

  const handleConfirmRoleToggle = () => {
    if (!roleModalUser) return;
    const targetUser = roleModalUser;
    const newRole = targetUser.role === "ADMIN" ? "USER" : "ADMIN";
    if (targetUser.id === currentAdminId && newRole !== "ADMIN") {
      setRoleModalUser(null);
      return;
    }

    startRoleTransition(async () => {
      try {
        const res = await updateUserRoleAction(targetUser.id, newRole);
        if (res.success) {
          setRoleModalUser(null);
          toast.success(
            newRole === "ADMIN"
              ? t("promotedMessage", { fullName: targetUser.fullName })
              : t("demotedMessage", { fullName: targetUser.fullName }),
          );
        } else {
          toast.error(res.error || t("roleUpdateError"));
        }
      } catch {
        toast.error(t("roleUpdateError"));
      }
    });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* CARDS COM MÉTRICAS PRINCIPAIS (RENDERIZADOS NO SERVIDOR) */}
      {overviewCards}

      {/* TABELA DE GESTÃO DE USUÁRIOS */}
      <AdminUsersTable
        currentAdminId={currentAdminId}
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

      {/* MODAL DE DETALHES DE ARMAZENAMENTO E E-MAILS (CARREGADO SOB DEMANDA) */}
      {isDetailOpen && selectedUserDetail && (
        <AdminUserDetailModal
          detail={selectedUserDetail}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedUserDetail(null);
          }}
        />
      )}

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
                    <strong className="text-magenta dark:text-fuchsia-300">
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
