"use client";

import {
  ChevronsUpDown,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  createWorkspaceAction,
  deleteWorkspaceAction,
} from "@/actions/workspaceActions";
import { useUserStore } from "@/store/userStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { CreateWorkspaceModal } from "./CreateWorkspaceModal";
import { DeleteWorkspaceModal } from "./DeleteWorkspaceModal";

interface WorkspaceSwitcherProps {
  onDeleteWorkspace?: (id: string) => void;
  onCreateWorkspace?: (name: string) => void;
}

export function WorkspaceSwitcher({
  onDeleteWorkspace,
  onCreateWorkspace,
}: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
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
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-primary/40 bg-gradient-to-r from-primary/30 to-background/60 hover:border-primary-light/60 transition-colors focus:outline-none focus:ring-2 focus:ring-gold/50"
        >
          <div className="flex flex-col items-start truncate mr-2">
            <span className="text-label-m uppercase tracking-wider text-gold-pressed font-bold">
              Ambiente:
            </span>
            <span className="text-body-s text-neutral-50 font-bold truncate max-w-[120px]">
              {activeWorkspace?.name || "Nenhum"}
            </span>
          </div>
          <ChevronsUpDown
            size={15}
            className={`text-neutral-300 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-full bg-[#1a0f35] border border-primary/40 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col">
            <ul
              className="max-h-60 overflow-y-auto custom-scrollbar flex flex-col py-1"
              role="listbox"
            >
              {workspaces.map((ws) => {
                const isActive = ws.id === activeWorkspaceId;
                const canDelete = workspaces.length > 1 && !isActive;

                return (
                  <li
                    key={ws.id}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => handleSelect(ws.id as string)}
                    className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors hover:bg-primary/30 ${
                      isActive
                        ? "bg-primary/20 border-l-2 border-gold"
                        : "border-l-2 border-transparent"
                    }`}
                  >
                    <span
                      className={`text-body-s truncate mr-2 ${
                        isActive
                          ? "text-gold-pressed font-bold"
                          : "text-neutral-50"
                      }`}
                    >
                      {ws.name}
                    </span>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={(e) => handleOpenDeleteModal(e, ws)}
                        disabled={isPending}
                        className="text-neutral-400 hover:text-red-400 p-1 rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-red-400/50 disabled:opacity-50"
                        aria-label={`Excluir ambiente ${ws.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </li>
                );
              })}
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
                  }
                }}
                disabled={!canAddMore || isPending}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-body-s font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gold/50 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/20 text-neutral-300 hover:text-neutral-50"
              >
                {isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                {canAddMore ? "Adicionar Ambiente" : "Limite Atingido"}
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
    </>
  );
}
