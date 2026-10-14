"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { BaseModal } from "@/components/ui/BaseModal";

interface DeleteBoardColumnModalProps {
  isOpen: boolean;
  columnName: string;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteBoardColumnModal({
  isOpen,
  columnName,
  isLoading = false,
  onClose,
  onConfirm,
}: DeleteBoardColumnModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-sm"
      borderColor="border-red-500/30"
      preventClose={isLoading}
      headerExtra={<AlertTriangle size={20} className="text-red-400" />}
      title={<span className="text-red-400">Excluir Coluna</span>}
    >
      <p className="text-body-s text-neutral-300 mb-6 leading-relaxed">
        Tem certeza de que deseja excluir a coluna{" "}
        <span className="font-bold text-neutral-100">"{columnName}"</span>? Esta
        ação é irreversível e todas as tarefas desta coluna serão removidas
        permanentemente.
      </p>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 text-body-s text-neutral-300 hover:text-neutral-50 transition-colors focus:outline-none rounded-lg disabled:opacity-50 cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600/80 hover:bg-red-600 border border-red-500/50 rounded-lg text-neutral-50 text-body-s font-bold transition-all focus:outline-none focus:ring-2 focus:ring-red-400/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Excluindo...</span>
            </>
          ) : (
            <span>Excluir Coluna</span>
          )}
        </button>
      </div>
    </BaseModal>
  );
}
