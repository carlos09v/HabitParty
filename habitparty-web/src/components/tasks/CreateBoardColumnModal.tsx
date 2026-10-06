"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { createBoardColumnAction } from "@/actions/boardColumnActions";
import { BaseModal } from "@/components/ui/BaseModal";
import { IconPicker } from "@/components/ui/IconPicker";
import { COLUMN_ICONS } from "@/constants/routine";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type { BoardColumn } from "@/types/task";

interface CreateBoardColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (column: BoardColumn) => void;
}

export function CreateBoardColumnModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateBoardColumnModalProps) {
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("sun");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const activeWorkspaceId = useWorkspaceStore(
    (state) => state.activeWorkspaceId,
  );

  useEffect(() => {
    if (isOpen) {
      setName("");
      setSelectedIcon("sun");
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      toast.error("O nome da coluna é obrigatório.");
      return;
    }

    if (!activeWorkspaceId) {
      toast.error("Nenhum workspace ativo selecionado.");
      return;
    }

    startTransition(async () => {
      const response = await createBoardColumnAction({
        workspaceId: activeWorkspaceId,
        name: trimmedName,
        icon: selectedIcon,
      });

      if (!response.success) {
        toast.error(response.error || "Erro ao criar coluna.");
        return;
      }

      toast.success("Coluna criada com sucesso!");
      const newCol: BoardColumn = {
        id: response.data.id || `col-${Date.now()}`,
        title: response.data.name || trimmedName,
        order: response.data.orderIndex ?? 0,
        icon: response.data.icon || selectedIcon,
        tasks: [],
      };
      onSuccess?.(newCol);
      onClose();
    });
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nova Coluna"
      description="Crie uma nova lista para categorizar suas tarefas e hábitos no quadro."
      maxWidth="max-w-md"
      preventClose={isPending}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Nome da Coluna */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="columnName"
            className="text-body-s text-neutral-300 font-medium"
          >
            Nome da Lista <span className="text-gold">*</span>
          </label>
          <input
            ref={inputRef}
            id="columnName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Rotina Matinal, Estudos, Trabalho..."
            className="w-full bg-background/50 border border-primary/40 rounded-lg px-3 py-2.5 text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-body-s"
            required
            maxLength={35}
            disabled={isPending}
          />
        </div>

        {/* Escolha do Ícone */}
        <div className="flex flex-col gap-2">
          <span className="text-body-s text-neutral-300 font-medium">
            Ícone da Coluna
          </span>
          <IconPicker
            options={COLUMN_ICONS}
            value={selectedIcon}
            onChange={setSelectedIcon}
            disabled={isPending}
          />
        </div>

        {/* Rodapé com botões de ação */}
        <div className="flex justify-end gap-3 mt-1 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-body-s text-neutral-300 hover:text-neutral-50 transition-colors focus:outline-none rounded-lg cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className="flex items-center justify-center gap-2 px-5 py-2 bg-gradient-to-r from-primary to-primary-dark border border-primary-light/30 rounded-lg text-neutral-50 text-body-s font-bold hover:brightness-110 transition-all focus:outline-none focus:ring-2 focus:ring-gold/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Criando...</span>
              </>
            ) : (
              <span>Criar Coluna</span>
            )}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
