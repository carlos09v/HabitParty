"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteUserAccountAction } from "@/actions/userActions";
import { BaseModal } from "@/components/ui/BaseModal";
import type { ProfileCardBaseProps } from "@/types/user";
import { cn } from "@/utils";

export function DangerZoneCard({ isCompact }: ProfileCardBaseProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteUserAccountAction();
      if (res && !res.success) {
        toast.error(res.error || "Erro ao excluir conta.");
        setIsModalOpen(false);
      }
    });
  };

  return (
    <>
      <div
        className={cn(
          "rounded-2xl border border-red-500/30 bg-red-950/10 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all",
          isCompact ? "p-4 sm:p-5" : "p-6",
        )}
      >
        <div className="flex flex-col gap-1 max-w-xl">
          <h3 className="text-body-l font-bold text-red-400 flex items-center gap-2">
            <AlertTriangle size={18} />
            Zona de Perigo
          </h3>
          <p className="text-body-s text-neutral-300">
            A exclusão da sua conta apagará permanentemente todos os seus dados,
            tarefas, moedas, itens e histórico no HabitParty. Esta ação é
            irreversível.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={cn(
            "rounded-xl border border-red-500/50 bg-red-600/20 text-red-300 hover:bg-red-600 hover:text-white transition-all font-bold cursor-pointer shrink-0 flex items-center gap-2 shadow-xs",
            isCompact ? "px-3.5 py-2 text-xs" : "px-4 py-2.5 text-sm",
          )}
        >
          <Trash2 size={16} />
          Excluir Conta
        </button>
      </div>

      <BaseModal
        isOpen={isModalOpen}
        onClose={() => !isPending && setIsModalOpen(false)}
        title="Tem certeza que deseja excluir sua conta?"
        description="Todos os seus hábitos, tarefas, recompensas e histórico de transações serão excluídos definitivamente."
        borderColor="border-red-500/40"
      >
        <div className="flex flex-col gap-4 mt-2">
          <p className="text-body-s text-neutral-300 leading-relaxed">
            Ao confirmar, sua sessão será encerrada e seus dados não poderão ser
            recuperados.
          </p>

          <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-white/10">
            <button
              type="button"
              disabled={isPending}
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-neutral-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={handleDelete}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Trash2 size={16} />
              {isPending ? "Excluindo..." : "Sim, excluir minha conta"}
            </button>
          </div>
        </div>
      </BaseModal>
    </>
  );
}
