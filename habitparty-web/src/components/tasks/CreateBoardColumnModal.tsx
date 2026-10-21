"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createBoardColumnAction,
  updateBoardColumnAction,
} from "@/actions/boardColumnActions";
import { BaseModal } from "@/components/ui/BaseModal";
import { IconPickerPopover } from "@/components/ui/IconPickerPopover";
import { COLUMN_ICONS, inferColumnIcon } from "@/constants/routine";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type { BoardColumn } from "@/types/task";
import { soundEffects } from "@/utils/soundEffects";

interface CreateBoardColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnToEdit?: BoardColumn | null;
  onSuccess?: (column: BoardColumn, isEdit?: boolean) => void;
}

export function CreateBoardColumnModal({
  isOpen,
  onClose,
  columnToEdit,
  onSuccess,
}: CreateBoardColumnModalProps) {
  const isEditing = Boolean(columnToEdit);
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("sun");
  const [hasManuallyChangedIcon, setHasManuallyChangedIcon] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const activeWorkspaceId = useWorkspaceStore(
    (state) => state.activeWorkspaceId,
  );

  useEffect(() => {
    if (isOpen) {
      if (columnToEdit) {
        setName(columnToEdit.title || "");
        setSelectedIcon(columnToEdit.icon || "sun");
        setHasManuallyChangedIcon(true);
      } else {
        setName("");
        setSelectedIcon("sun");
        setHasManuallyChangedIcon(false);
      }
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, columnToEdit]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);

    // Sugere automaticamente o ícone com base nas palavras digitadas (ex: estudos -> book, treino -> dumbbell)
    if (!hasManuallyChangedIcon && !isEditing) {
      const suggestedIcon = inferColumnIcon(newName);
      if (suggestedIcon) {
        setSelectedIcon(suggestedIcon);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      toast.error("O nome da coluna é obrigatório.");
      return;
    }

    if (!isEditing && !activeWorkspaceId) {
      toast.error("Nenhum workspace ativo selecionado.");
      return;
    }

    startTransition(async () => {
      if (isEditing && columnToEdit) {
        const response = await updateBoardColumnAction(columnToEdit.id, {
          name: trimmedName,
          icon: selectedIcon,
        });

        if (!response.success) {
          toast.error(response.error || "Erro ao atualizar coluna.");
          return;
        }

        toast.success("Coluna atualizada com sucesso!");
        const updatedCol: BoardColumn = {
          ...columnToEdit,
          title: response.data.name || trimmedName,
          icon: response.data.icon || selectedIcon,
        };
        onSuccess?.(updatedCol, true);
        onClose();
        return;
      }

      if (!activeWorkspaceId) return;

      const response = await createBoardColumnAction({
        workspaceId: activeWorkspaceId,
        name: trimmedName,
        icon: selectedIcon,
      });

      if (!response.success) {
        toast.error(response.error || "Erro ao criar coluna.");
        return;
      }

      soundEffects.playCreateSound();
      toast.success(`Coluna "${trimmedName}" criada!`, {
        description: "Pronta para organizar suas tarefas e hábitos no quadro.",
      });
      const newCol: BoardColumn = {
        id: response.data.id || `col-${Date.now()}`,
        title: response.data.name || trimmedName,
        order: response.data.orderIndex ?? 0,
        icon: response.data.icon || selectedIcon,
        tasks: [],
      };
      onSuccess?.(newCol, false);
      onClose();
    });
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar Coluna" : "Nova Coluna"}
      description={
        isEditing
          ? "Altere o nome e o ícone desta lista no quadro."
          : "Crie uma nova lista para categorizar suas tarefas e hábitos no quadro."
      }
      maxWidth="max-w-md"
      preventClose={isPending}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Nome da Coluna e Ícone Integrados */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="columnName"
            className="text-body-s text-neutral-300 font-medium"
          >
            Nome da Lista <span className="text-gold">*</span>
          </label>
          <div className="flex items-center gap-2">
            <IconPickerPopover
              options={COLUMN_ICONS}
              value={selectedIcon}
              onChange={(iconId) => {
                setSelectedIcon(iconId);
                setHasManuallyChangedIcon(true);
              }}
              disabled={isPending}
              title="Ícone da Lista"
            />
            <input
              ref={inputRef}
              id="columnName"
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="Ex: Rotina Matinal, Estudos, Trabalho..."
              className="w-full bg-background/50 border border-primary/40 rounded-lg px-3 py-2 text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-body-s h-[42px]"
              required
              maxLength={35}
              disabled={isPending}
            />
          </div>
          <span className="text-label-g text-neutral-400">
            Clique no ícone para personalizar ou digite o nome para sugestão
            automática.
          </span>
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
                <span>{isEditing ? "Salvando..." : "Criando..."}</span>
              </>
            ) : (
              <span>{isEditing ? "Salvar Alterações" : "Criar Coluna"}</span>
            )}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
