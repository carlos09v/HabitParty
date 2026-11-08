"use client";

import {
  ChevronDown,
  ChevronsUpDown,
  Crown,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createWorkspaceAction,
  deleteWorkspaceAction,
  updateWorkspaceAction,
} from "@/actions/workspaceActions";
import { UpgradePremiumModal } from "@/components/subscription/UpgradePremiumModal";
import { useProgressStore } from "@/store/progressStore";
import { useUserStore } from "@/store/userStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { cn } from "@/utils";
import { CreateWorkspaceModal } from "./CreateWorkspaceModal";
import { DeleteWorkspaceModal } from "./DeleteWorkspaceModal";

interface WorkspaceSwitcherProps {
  onDeleteWorkspace?: (id: string) => void;
  onCreateWorkspace?: (name: string) => void;
  onUpdateWorkspace?: (id: string, name: string) => void;
  className?: string;
}

export function WorkspaceSwitcher({
  onDeleteWorkspace,
  onCreateWorkspace,
  onUpdateWorkspace,
  className,
}: WorkspaceSwitcherProps) {
  const t = useTranslations("workspace");
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [workspaceToEdit, setWorkspaceToEdit] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const setActiveWorkspaceId = useWorkspaceStore((s) => s.setActiveWorkspaceId);
  const is_Premium = useUserStore((s) => s.is_Premium);

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
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isWorkspaceRoute =
    pathname?.startsWith("/dashboard") || pathname?.startsWith("/tasks");

  const handleSelect = (id: string) => {
    setIsOpen(false);
    if (id === activeWorkspaceId) return;

    setActiveWorkspaceId(id);
    if (typeof document !== "undefined") {
      // biome-ignore lint/suspicious/noDocumentCookie: Sincroniza workspace ativo no cliente imediatamente
      document.cookie = `activeWorkspaceId=${id}; path=/; max-age=31536000; SameSite=Lax`;
    }
    if (isWorkspaceRoute) {
      useWorkspaceStore.setState({ isSwitchingWorkspace: true });
      useProgressStore.getState().start("workspace-switch");
    }
    const params = new URLSearchParams(
      searchParams ? searchParams.toString() : "",
    );
    params.set("workspaceId", id);
    router.push(`?${params.toString()}`);
  };

  const handleCreate = (name: string) => {
    setIsModalOpen(false);
    if (isWorkspaceRoute) {
      useWorkspaceStore.setState({ isSwitchingWorkspace: true });
      useProgressStore.getState().start("workspace-switch");
    }
    startTransition(async () => {
      const response = await createWorkspaceAction({ name });
      if (response.success) {
        if (onCreateWorkspace) {
          onCreateWorkspace(name);
        }
        const newWorkspaceId = response.data.id || null;
        if (newWorkspaceId && typeof document !== "undefined") {
          // biome-ignore lint/suspicious/noDocumentCookie: Sincroniza novo workspace ativo no cliente imediatamente
          document.cookie = `activeWorkspaceId=${newWorkspaceId}; path=/; max-age=31536000; SameSite=Lax`;
        }
        // Atualiza a store localmente com o novo workspace já selecionado como ativo
        useWorkspaceStore.setState({
          workspaces: [...workspaces, response.data],
          activeWorkspaceId: newWorkspaceId ?? activeWorkspaceId,
        });
        if (newWorkspaceId && isWorkspaceRoute) {
          const params = new URLSearchParams(
            searchParams ? searchParams.toString() : "",
          );
          params.set("workspaceId", newWorkspaceId);
          router.push(`?${params.toString()}`);
        } else {
          useWorkspaceStore.setState({ isSwitchingWorkspace: false });
          useProgressStore.getState().done("workspace-switch");
        }
      } else {
        useWorkspaceStore.setState({ isSwitchingWorkspace: false });
        useProgressStore.getState().done("workspace-switch");
        console.error(response.error);
        toast.error(response.error || t("createError"));
      }
    });
  };

  const handleOpenEditModal = (
    e: React.MouseEvent,
    ws: { id?: string; name?: string },
  ) => {
    e.stopPropagation();
    setWorkspaceToEdit({
      id: ws.id as string,
      name: ws.name || "",
    });
  };

  const handleUpdate = (name: string) => {
    if (!workspaceToEdit) return;
    const id = workspaceToEdit.id;

    startTransition(async () => {
      const response = await updateWorkspaceAction(id, { name });
      if (response.success) {
        if (onUpdateWorkspace) {
          onUpdateWorkspace(id, name);
        }
        // Atualiza a store localmente para refletir instantaneamente a edição
        const updatedName = response.data.name || name;
        const updatedWorkspaces = workspaces.map((w) =>
          w.id === id ? { ...w, name: updatedName } : w,
        );
        useWorkspaceStore.setState({
          workspaces: updatedWorkspaces,
        });
        setWorkspaceToEdit(null);
      } else {
        console.error(response.error);
        toast.error(response.error || t("updateError"));
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
      name: ws.name || t("unnamed"),
    });
  };

  const handleConfirmDelete = () => {
    if (!workspaceToDelete) return;
    const id = workspaceToDelete.id;
    const isDeletingActive = activeWorkspaceId === id;

    if (isDeletingActive && isWorkspaceRoute) {
      useWorkspaceStore.setState({ isSwitchingWorkspace: true });
      useProgressStore.getState().start("workspace-switch");
    }

    startTransition(async () => {
      const response = await deleteWorkspaceAction(id);
      if (response.success) {
        if (onDeleteWorkspace) {
          onDeleteWorkspace(id);
        }
        // Remove da store localmente
        const newWorkspaces = workspaces.filter((w) => w.id !== id);
        const nextActiveId = isDeletingActive
          ? newWorkspaces[0]?.id || null
          : activeWorkspaceId;
        useWorkspaceStore.setState({
          workspaces: newWorkspaces,
          activeWorkspaceId: nextActiveId,
        });
        setWorkspaceToDelete(null);
        if (isDeletingActive && isWorkspaceRoute && nextActiveId) {
          const params = new URLSearchParams(
            searchParams ? searchParams.toString() : "",
          );
          params.set("workspaceId", nextActiveId);
          router.push(`?${params.toString()}`);
        } else {
          useWorkspaceStore.setState({ isSwitchingWorkspace: false });
          useProgressStore.getState().done("workspace-switch");
        }
      } else {
        useWorkspaceStore.setState({ isSwitchingWorkspace: false });
        useProgressStore.getState().done("workspace-switch");
        console.error(response.error);
        toast.error(response.error || t("deleteError"));
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
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border-gradient-switcher transition-colors focus:outline-none focus:ring-2 focus:ring-gold/50 cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary/15 dark:bg-gold/20 border border-primary/25 dark:border-gold/40 flex items-center justify-center text-primary dark:text-gold font-bold text-xs shrink-0 shadow-xs">
              {(activeWorkspace?.name || "W").charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col items-start min-w-0">
              <span className="text-[10px] uppercase tracking-wider text-primary dark:text-gold-pressed font-bold leading-tight">
                {t("label")}
              </span>
              <span className="text-body-s text-neutral-50 font-bold truncate max-w-[130px]">
                {activeWorkspace?.name || t("none")}
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
          <div className="absolute top-full right-0 sm:left-0 mt-2 min-w-[210px] w-full bg-popover border border-neutral-700 dark:border-primary/40 rounded-xl shadow-popover-dark dark:shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
            {/* Cabeçalho com indicador de contagem */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-neutral-700 dark:border-primary/20 bg-surface/60 dark:bg-background/40 text-tiny text-neutral-400 font-semibold select-none">
              <span>{t("yourWorkspaces")}</span>
              <span className="text-amber-700 dark:text-gold font-bold font-mono">
                {t("counter", {
                  current: workspaces.length,
                  max: maxWorkspaces,
                })}
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
                            ? "bg-gold text-on-gold"
                            : "bg-surface dark:bg-white/10 text-neutral-300",
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

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditModal(e, ws)}
                        disabled={isPending}
                        className="text-neutral-400 hover:text-gold p-1 rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-gold/50 disabled:opacity-50 cursor-pointer"
                        aria-label={t("editAria", {
                          name: ws.name || t("unnamed"),
                        })}
                      >
                        <Pencil size={15} />
                      </button>

                      {canDelete && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenDeleteModal(e, ws)}
                          disabled={isPending}
                          className="text-neutral-400 hover:text-red-400 p-1 rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-red-400/50 disabled:opacity-50 cursor-pointer"
                          aria-label={t("deleteAria", {
                            name: ws.name || t("unnamed"),
                          })}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
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
                    title={t("lockedPreservedTitle", {
                      count: blockedWorkspaces.length,
                    })}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-700 dark:text-gold/90 hover:text-amber-800 dark:hover:text-gold bg-amber-500/10 hover:bg-amber-500/15 dark:bg-gold/5 dark:hover:bg-gold/15 border border-amber-500/30 dark:border-gold/20 hover:border-amber-500/50 dark:hover:border-gold/40 transition-colors cursor-pointer group text-left"
                    aria-expanded={isBlockedExpanded}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Lock
                        size={13}
                        className="text-amber-600 dark:text-gold/70 group-hover:text-amber-700 dark:group-hover:text-gold shrink-0"
                      />
                      <span className="truncate">
                        {t("lockedCount", {
                          count: blockedWorkspaces.length,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-gold px-1.5 py-0.5 rounded bg-amber-500/15 dark:bg-gold/15 border border-amber-500/35 dark:border-gold/30">
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
                              title={t("accessReadOnlyTitle", {
                                name: ws.name || t("unnamed"),
                              })}
                            >
                              <div
                                className={cn(
                                  "w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0",
                                  isActive
                                    ? "bg-gold text-on-gold"
                                    : "bg-surface dark:bg-white/10 text-neutral-300",
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
                                title={t("readOnlyBadgeTitle")}
                              >
                                <Lock size={9} />
                                {t("readOnlyBadge")}
                              </span>
                            </button>

                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => handleOpenEditModal(e, ws)}
                                disabled={isPending}
                                className="text-neutral-400 hover:text-gold p-1 rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-gold/50 disabled:opacity-50 cursor-pointer"
                                aria-label={t("editAria", {
                                  name: ws.name || t("unnamed"),
                                })}
                              >
                                <Pencil size={15} />
                              </button>

                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenDeleteModal(e, ws)}
                                  disabled={isPending}
                                  className="text-neutral-400 hover:text-red-400 p-1 rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-red-400/50 disabled:opacity-50 cursor-pointer"
                                  aria-label={t("deleteAria", {
                                    name: ws.name || t("unnamed"),
                                  })}
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              )}
              {workspaces.length === 0 && (
                <li className="px-3 py-3 text-center text-body-s text-neutral-400">
                  {t("empty")}
                </li>
              )}
            </ul>

            <div className="border-t border-neutral-700 dark:border-primary/30 p-2 bg-surface/50 dark:bg-background/30">
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
                  ? t("addWorkspace")
                  : !is_Premium
                    ? t("limitUpgrade")
                    : t("limitReached", {
                        current: maxWorkspaces,
                        max: maxWorkspaces,
                      })}
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <CreateWorkspaceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreate}
        />
      )}

      {workspaceToEdit && (
        <CreateWorkspaceModal
          isOpen={true}
          isEdit={true}
          initialName={workspaceToEdit.name}
          isLoading={isPending}
          onClose={() => {
            if (!isPending) setWorkspaceToEdit(null);
          }}
          onSubmit={handleUpdate}
        />
      )}

      {workspaceToDelete && (
        <DeleteWorkspaceModal
          isOpen={true}
          workspaceName={workspaceToDelete.name}
          isLoading={isPending}
          onClose={() => {
            if (!isPending) setWorkspaceToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      )}

      {isUpgradeModalOpen && (
        <UpgradePremiumModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
        />
      )}
    </>
  );
}
