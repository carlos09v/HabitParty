"use client";

import { RefreshCw, ShieldCheck } from "lucide-react";
import { useCallback, useState, useTransition } from "react";
import {
  getAdminOverviewAction,
  getAdminUserDetailAction,
  listAdminUsersAction,
  updateUserRoleAction,
} from "@/actions/adminActions";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import type {
  AdminOverviewDTO,
  AdminUserDetailDTO,
  AdminUserSummaryDTO,
} from "@/types/admin";
import { AdminOverviewCards } from "./AdminOverviewCards";
import { AdminUserDetailModal } from "./AdminUserDetailModal";
import { AdminUsersTable } from "./AdminUsersTable";

interface AdminDashboardViewProps {
  initialOverview: AdminOverviewDTO | null;
  initialUsers: AdminUserSummaryDTO[];
  initialTotalPages: number;
  initialTotalElements: number;
}

export function AdminDashboardView({
  initialOverview,
  initialUsers,
  initialTotalPages,
  initialTotalElements,
}: AdminDashboardViewProps) {
  const [overview, setOverview] = useState<AdminOverviewDTO | null>(
    initialOverview,
  );
  const [users, setUsers] = useState<AdminUserSummaryDTO[]>(initialUsers);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [totalElements, setTotalElements] = useState(initialTotalElements);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [page, setPage] = useState(0);

  const [selectedUserDetail, setSelectedUserDetail] =
    useState<AdminUserDetailDTO | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [roleModalUser, setRoleModalUser] =
    useState<AdminUserSummaryDTO | null>(null);

  const [isPending, startTransition] = useTransition();
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadUsers = useCallback(
    (newSearch = search, newFilter = filter, newPage = page) => {
      startTransition(async () => {
        const res = await listAdminUsersAction(
          newSearch,
          newFilter,
          newPage,
          15,
        );
        if (res.success && res.data) {
          setUsers(res.data.content);
          setTotalPages(res.data.totalPages);
          setTotalElements(res.data.totalElements);
        }
      });
    },
    [search, filter, page],
  );

  const refreshAll = useCallback(() => {
    startTransition(async () => {
      const [overviewRes, usersRes] = await Promise.all([
        getAdminOverviewAction(),
        listAdminUsersAction(search, filter, page, 15),
      ]);

      if (overviewRes.success && overviewRes.data) {
        setOverview(overviewRes.data);
      }
      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data.content);
        setTotalPages(usersRes.data.totalPages);
        setTotalElements(usersRes.data.totalElements);
      }
      setActionMessage("Dados administrativos atualizados com sucesso!");
      setTimeout(() => setActionMessage(null), 3000);
    });
  }, [search, filter, page]);

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setPage(0);
    loadUsers(newSearch, filter, 0);
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setPage(0);
    loadUsers(search, newFilter, 0);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadUsers(search, filter, newPage);
  };

  const handleSelectUser = async (user: AdminUserSummaryDTO) => {
    startTransition(async () => {
      const res = await getAdminUserDetailAction(user.id);
      if (!res.success) {
        alert(res.error || "Não foi possível carregar os detalhes do usuário.");
        return;
      }
      setSelectedUserDetail(res.data);
      setIsDetailOpen(true);
    });
  };

  const handleToggleRole = (user: AdminUserSummaryDTO) => {
    setRoleModalUser(user);
  };

  const handleConfirmRoleToggle = () => {
    if (!roleModalUser) return;
    const targetUser = roleModalUser;
    const newRole = targetUser.role === "ADMIN" ? "USER" : "ADMIN";

    startTransition(async () => {
      const res = await updateUserRoleAction(targetUser.id, newRole);
      if (res.success) {
        setRoleModalUser(null);
        refreshAll();
        setActionMessage(
          newRole === "ADMIN"
            ? `Usuário ${targetUser.fullName} promovido a Administrador!`
            : `Usuário ${targetUser.fullName} rebaixado para Usuário padrão.`,
        );
        setTimeout(() => setActionMessage(null), 3000);
      } else {
        alert(res.error || "Erro ao alterar o papel do usuário.");
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
            Painel de Controle do Administrador
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-50 tracking-tight">
            Gestão do Sistema & Métricas
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Monitore o consumo de e-mails via Resend, espaço em disco do banco
            de dados e controle o uso de recursos por usuário.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshAll}
          disabled={isPending}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-surface border border-white/10 hover:border-gold/40 text-neutral-200 hover:text-gold transition-colors text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <RefreshCw
            size={14}
            className={isPending ? "animate-spin text-gold" : ""}
          />
          Atualizar Dados
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-in fade-in duration-200">
          {actionMessage}
        </div>
      )}

      {/* CARDS COM MÉTRICAS PRINCIPAIS */}
      {overview && <AdminOverviewCards overview={overview} />}

      {/* TABELA DE GESTÃO DE USUÁRIOS */}
      <AdminUsersTable
        users={users}
        totalPages={totalPages}
        currentPage={page}
        totalElements={totalElements}
        search={search}
        filter={filter}
        isLoading={isPending}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
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
        isLoading={isPending}
        title={
          roleModalUser?.role === "ADMIN"
            ? "Rebaixar para Usuário Comum"
            : "Promover a Administrador"
        }
        variant={roleModalUser?.role === "ADMIN" ? "danger" : "warning"}
        confirmText={
          roleModalUser?.role === "ADMIN" ? "Sim, rebaixar" : "Sim, promover"
        }
        cancelText="Cancelar"
        description={
          roleModalUser ? (
            <div className="flex flex-col gap-2">
              <p>
                {roleModalUser.role === "ADMIN" ? (
                  <>
                    Deseja realmente revogar os privilégios de Administrador de{" "}
                    <strong className="text-neutral-100">
                      {roleModalUser.fullName}
                    </strong>{" "}
                    (@{roleModalUser.username})?
                  </>
                ) : (
                  <>
                    Deseja realmente promover{" "}
                    <strong className="text-neutral-100">
                      {roleModalUser.fullName}
                    </strong>{" "}
                    (@{roleModalUser.username}) a{" "}
                    <strong className="text-gold">Administrador</strong>? Ele
                    terá acesso a todas as métricas do sistema e gerenciamento
                    de usuários.
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
