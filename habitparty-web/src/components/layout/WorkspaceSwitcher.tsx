"use client";

import {
  ChevronDown,
  ChevronsUpDown,
  Crown,
  Loader2,
  Lock,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  createWorkspaceAction,
  deleteWorkspaceAction,
} from "@/actions/workspaceActions";
import { UpgradePremiumModal } from "@/components/subscription/UpgradePremiumModal";
import { useUserStore } from "@/store/userStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { cn } from "@/utils";
import { CreateWorkspaceModal } from "./CreateWorkspaceModal";
import { DeleteWorkspaceModal } from "./DeleteWorkspaceModal";

interface WorkspaceSwitcherProps {
  onDeleteWorkspace?: (id: string) => void;
  onCreateWorkspace?: (name: string) => void;
  className?: string;
}

export function WorkspaceSwitcher({
  onDeleteWorkspace,
  onCreateWorkspace,
  className,
}: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  const { workspaces, activeWorkspaceId, setActiveWorkspaceId } =
    useWorkspaceStore();
  const { is_Premium } = useUserStore();

  const maxWorkspaces = is_Premium ? 4 : 2;
  const canAddMore = workspaces.length < maxWorkspaces;

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const isCurrentWorkspaceBlocked =
    !is_Premium &&
    workspaces.findIndex((w) => w.id === activeWorkspace?.id) >= maxWorkspaces;

  const activeWorkspaces = is_Premium
    ? workspaces
    : workspaces.slice(0, maxWorkspaces);

  const blockedWorkspaces = is_Premium ? [] : workspaces.slice(maxWorkspaces);

  const [isBlockedExpanded, setIsBlockedExpanded] = useState(
    isCurrentWorkspaceBlocked,
  );

  useEffect(() => {
    if (isCurrentWorkspaceBlocked) {
      setIsBlockedExpanded(true);
    }
  }, [isCurrentWorkspaceBlocked]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSelect = (id: string) => {
    setActiveWorkspaceId(id);
    setIsOpen(false);
    if (typeof document !== "undefined") {
      document.cookie = `activeWorkspaceId=${id}; path=/; max-age=31536000; SameSite=Lax`;
    }
    const params = new URLSearchParams(
      searchParams ? searchParams.toString() : "",
    );
    params.set("workspaceId", id);
    router.push(`?${params.toString()}`);
  };

  const handleCreate = (name: string) => {
    setIsModalOpen(false);
    startTransition(async () => {
      const response = await createWorkspaceAction({ name });
      if (response.success) {
        if (onCreateWorkspace) {
          onCreateWorkspace(name);
        }
        // Atualiza a store localmente para refletir instantaneamente a criação
        useWorkspaceStore.setState({
          workspaces: [...workspaces, response.data],
        });
      } else {
        console.error(response.error);
        alert(response.error || "Erro ao criar workspace");
      }
    });
  };

  const handleOpenDeleteModal = (
    e: React.MouseEvent,
    ws: { id?: string; name?: string },
  ) => {
    e.stopPropagation();
    setWorkspaceToDelete({
      id: ws.id as string,
      name: ws.name || "Sem nome",
    });
  };

  const handleConfirmDelete = () => {
    if (!workspaceToDelete) return;
    const id = workspaceToDelete.id;

    startTransition(async () => {
      const response = await deleteWorkspaceAction(id);
      if (response.success) {
        if (onDeleteWorkspace) {
          onDeleteWorkspace(id);
        }
        // Remove da store localmente
        const newWorkspaces = workspaces.filter((w) => w.id !== id);
        useWorkspaceStore.setState({
          workspaces: newWorkspaces,
          activeWorkspaceId:
            activeWorkspaceId === id
              ? newWorkspaces[0]?.id || null
              : activeWorkspaceId,
        });
        setWorkspaceToDelete(null);
      } else {
        console.error(response.error);
        alert(response.error || "Erro ao deletar workspace");
      }
    });
  };

  return (
    <>
      <div className={cn("relative", className)} ref={dropdownRef}>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border-gradient-switcher transition-all focus:outline-none focus:ring-2 focus:ring-gold/50 cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gold/20 border border-gold/40 flex items-center justify-center text-gold font-bold text-xs shrink-0 shadow-xs">
              {(activeWorkspace?.name || "W").charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col items-start min-w-0">
              <span className="text-[10px] uppercase tracking-wider text-gold-pressed font-bold leading-tight">
                Ambiente
              </span>
              <span className="text-body-s text-neutral-50 font-bold truncate max-w-[130px]">
                {activeWorkspace?.name || "Nenhum"}
              </span>
            </div>
          </div>
          <ChevronsUpDown
            size={15}
            className={cn(
              "text-neutral-300 transition-transform shrink-0",
              isOpen && "rotate-180 text-neutral-100",
            )}
            aria-hidden="true"
          />
        </button>

        {isOpen && (
          <div className="absolute top-full right-0 sm:left-0 mt-2 min-w-[210px] w-full bg-popover/95 border border-primary/40 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
            {/* Cabeçalho com indicador de contagem */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-primary/20 bg-background/40 text-tiny text-neutral-400 font-semibold select-none">
              <span>Seus Ambientes</span>
              <span className="text-gold font-bold font-mono">
                {workspaces.length} de {maxWorkspaces}
              </span>
            </div>

            <ul className="max-h-60 overflow-y-auto custom-scrollbar flex flex-col py-1">
              {activeWorkspaces.map((ws) => {
                const isActive = ws.id === activeWorkspaceId;
                const canDelete = workspaces.length > 1 && !isActive;

                return (
                  <li
                    key={ws.id}
                    className={cn(
                      "flex items-center justify-between px-3 py-1.5 transition-colors hover:bg-primary/20",
                      isActive
                        ? "bg-primary/10 border-l-2 border-gold"
                        : "border-l-2 border-transparent",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelect(ws.id as string)}
                      className="flex-1 flex items-center gap-2 text-left truncate mr-2 cursor-pointer focus:outline-none focus:underline"
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0",
                          isActive
                            ? "bg-gold text-neutral-900"
                            : "bg-white/10 text-neutral-300",
                        )}
                      >
                        {(ws.name || "W").charAt(0).toUpperCase()}
                      </div>
                      <span
                        className={cn(
                          "text-body-s truncate",
                          isActive
                            ? "text-gold-pressed font-bold"
                            : "text-neutral-50",
                        )}
                      >
                        {ws.name}
                      </span>
                    </button>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={(e) => handleOpenDeleteModal(e, ws)}
                        disabled={isPending}
                        className="text-neutral-400 hover:text-red-400 p-1 rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-red-400/50 disabled:opacity-50 cursor-pointer"
                        aria-label={`Excluir ambiente ${ws.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </li>
                );
              })}

              {blockedWorkspaces.length > 0 && (
                <li className="px-2 py-1 border-t border-primary/20 mt-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsBlockedExpanded(!isBlockedExpanded);
                    }}
                    title={`${blockedWorkspaces.length} ambientes preservados do período Premium. Clique para expandir ou recolher.`}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gold/90 hover:text-gold bg-gold/5 hover:bg-gold/15 border border-gold/20 hover:border-gold/40 transition-all cursor-pointer group text-left"
                    aria-expanded={isBlockedExpanded}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Lock
                        size={13}
                        className="text-gold/70 group-hover:text-gold shrink-0"
                      />
                      <span className="truncate">
                        {blockedWorkspaces.length}{" "}
                        {blockedWorkspaces.length === 1
                          ? "ambiente bloqueado"
                          : "ambientes bloqueados"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gold px-1.5 py-0.5 rounded bg-gold/15 border border-gold/30">
                        VIP 👑
                      </span>
                      <ChevronDown
                        size={13}
                        className={cn(
                          "text-gold/70 transition-transform duration-200",
                          isBlockedExpanded && "rotate-180",
                        )}
                      />
                    </div>
                  </button>

                  {isBlockedExpanded && (
                    <ul className="flex flex-col gap-0.5 mt-1 pl-1">
                      {blockedWorkspaces.map((ws) => {
                        const isActive = ws.id === activeWorkspaceId;
                        const canDelete = workspaces.length > 1 && !isActive;

                        return (
                          <li
                            key={ws.id}
                            className={cn(
                              "flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors hover:bg-primary/20",
                              isActive
                                ? "bg-primary/10 border-l-2 border-gold"
                                : "border-l-2 border-transparent",
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => handleSelect(ws.id as string)}
                              className="flex-1 flex items-center gap-2 text-left truncate mr-2 cursor-pointer focus:outline-none focus:underline"
                              title={`Acessar ${ws.name} em modo somente leitura`}
                            >
                              <div
                                className={cn(
                                  "w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0",
                                  isActive
                                    ? "bg-gold text-neutral-900"
                                    : "bg-white/10 text-neutral-300",
                                )}
                              >
                                {(ws.name || "W").charAt(0).toUpperCase()}
                              </div>
                              <span
                                className={cn(
                                  "text-body-s truncate",
                                  isActive
                                    ? "text-gold-pressed font-bold"
                                    : "text-neutral-50",
                                )}
                              >
                                {ws.name}
                              </span>
                              <span
                                className="text-[9px] px-1.5 py-0.5 rounded bg-gold/15 text-gold border border-gold/30 shrink-0 font-semibold flex items-center gap-1 ml-auto"
                                title="Ambiente em modo somente leitura (Bloqueado)"
                              >
                                <Lock size={9} />
                                Leitura
                              </span>
                            </button>

                            {canDelete && (
                              <button
                                type="button"
                                onClick={(e) => handleOpenDeleteModal(e, ws)}
                                disabled={isPending}
                                className="text-neutral-400 hover:text-red-400 p-1 rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-red-400/50 disabled:opacity-50 cursor-pointer"
                                aria-label={`Excluir ambiente ${ws.name}`}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              )}
              {workspaces.length === 0 && (
                <li className="px-3 py-3 text-center text-body-s text-neutral-400">
                  Nenhum ambiente
                </li>
              )}
            </ul>

            <div className="border-t border-primary/30 p-2 bg-background/30">
              <button
                type="button"
                onClick={() => {
                  if (canAddMore) {
                    setIsOpen(false);
                    setIsModalOpen(true);
                  } else if (!is_Premium) {
                    setIsOpen(false);
                    setIsUpgradeModalOpen(true);
                  }
                }}
                disabled={(!canAddMore && is_Premium) || isPending}
                className={cn(
                  "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-body-s font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gold/50",
                  canAddMore
                    ? "hover:bg-primary/20 text-neutral-300 hover:text-neutral-50 cursor-pointer"
                    : !is_Premium
                      ? "bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 hover:border-gold shadow-xs cursor-pointer"
                      : "disabled:opacity-50 disabled:cursor-not-allowed text-neutral-500",
                )}
              >
                {isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : !canAddMore && !is_Premium ? (
                  <Crown size={15} className="text-gold fill-gold/20" />
                ) : (
                  <Plus size={16} />
                )}
                {canAddMore
                  ? "Adicionar Ambiente"
                  : !is_Premium
                    ? "Limite Atingido (Seja Premium 👑)"
                    : "Limite Atingido (4/4)"}
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateWorkspaceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
      />

      <DeleteWorkspaceModal
        isOpen={!!workspaceToDelete}
        workspaceName={workspaceToDelete?.name || ""}
        isLoading={isPending}
        onClose={() => {
          if (!isPending) setWorkspaceToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      <UpgradePremiumModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </>
  );
}
