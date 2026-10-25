"use client";

import {
  Award,
  Calendar,
  Clock,
  Coins,
  Pencil,
  Sparkles,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { updateFocusRecord } from "@/actions/focusActions";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { getFocusIcon } from "@/constants/focus";
import { useAnchoredPopoverPosition } from "@/hooks/useAnchoredPopoverPosition";
import { useClickOutside } from "@/hooks/useClickOutside";
import type { FocusRecord } from "@/types/focus";
import { formatCoins, formatDateTime } from "@/utils";
import { formatFocusRecordDuration } from "@/utils/focusFormatters";

interface FocusRecordDetailsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  record: FocusRecord | null;
  anchorRect: DOMRect | null;
  onDeleteRecord?: (recordId: string) => void;
  onRecordUpdated?: () => void;
}

const POPOVER_OPTIONS = {
  preferredSide: "left" as const,
  popoverWidth: 340,
  popoverHeight: 380,
  margin: 12,
};

export function FocusRecordDetailsPopover({
  isOpen,
  onClose,
  record,
  anchorRect,
  onDeleteRecord,
  onRecordUpdated,
}: FocusRecordDetailsPopoverProps) {
  const [mounted, setMounted] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [notes, setNotes] = useState(record?.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sincroniza as notas quando o registro selecionado mudar
  useEffect(() => {
    setNotes(record?.notes || "");
  }, [record]);

  // Hook universal de posicionamento inteligente ancorado à esquerda
  const position = useAnchoredPopoverPosition(
    isOpen,
    anchorRect,
    popoverRef,
    POPOVER_OPTIONS,
    mounted,
  );

  // Fecha no clique fora e ESC respeitando o modal de confirmação
  useClickOutside(popoverRef, onClose, {
    enabled: isOpen && !isDeleteConfirmOpen,
    onEscape: onClose,
  });

  if (!isOpen || !mounted || !record) return null;

  const IconComp = record.activityIcon
    ? getFocusIcon(record.activityIcon)
    : Timer;

  const durationLabel = formatFocusRecordDuration(
    record.startTime,
    record.endTime,
    record.durationMinutes,
  );

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      const res = await updateFocusRecord(record.id, {
        notes: notes.trim(),
      });

      if (res.success) {
        toast.success("Anotações da sessão atualizadas!");
        onRecordUpdated?.();
        onClose();
      } else {
        toast.error(res.error || "Falha ao atualizar registro de foco.");
      }
    } catch {
      toast.error("Erro ao salvar anotações no servidor.");
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div
      ref={popoverRef}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      className="fixed z-[100] w-[340px] max-w-[calc(100vw-24px)] rounded-2xl border border-primary/40 bg-card/95 backdrop-blur-xl p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 select-none flex flex-col gap-3.5"
      role="dialog"
      aria-modal="true"
      aria-label="Editar Registro de Foco"
    >
      {/* Header com Ícone, Título e Fechar */}
      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-primary/20">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-center shrink-0 text-gold shadow-glow-gold-xs">
            <IconComp size={18} />
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <h3 className="text-body-m font-bold text-neutral-100 truncate">
              {record.activityName || record.itemName || "Sessão Livre"}
            </h3>
            <span className="text-label-g text-neutral-400 flex items-center gap-1">
              <Calendar size={11} className="text-neutral-500" />
              {formatDateTime(record.endTime, { isLocal: true })}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-100 hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Fechar"
        >
          <X size={16} />
        </button>
      </div>

      {/* Resumo da Sessão (Somente leitura) */}
      <div className="grid grid-cols-2 gap-2 bg-surface/50 border border-primary/20 rounded-xl p-2.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-tiny text-neutral-400 uppercase tracking-wider font-semibold flex items-center gap-1">
            <Clock size={10} className="text-gold" /> Duração
          </span>
          <span className="text-body-s font-bold text-gold font-mono">
            {durationLabel}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-tiny text-neutral-400 uppercase tracking-wider font-semibold flex items-center gap-1">
            <Timer size={10} className="text-gold" /> Modo
          </span>
          <span className="text-body-s font-semibold text-neutral-200">
            {record.recordType === "POMO"
              ? `Pomodoro ${record.completedPomos ? `(${record.completedPomos} ciclo${record.completedPomos > 1 ? "s" : ""})` : ""}`
              : "Cronômetro Livre"}
          </span>
        </div>
      </div>

      {/* Recompensas da Sessão (Atividades pontuam, itens de lazer da mochila pontuam 0) */}
      {!record.inventoryItemId ? (
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gold/10 border border-gold/30 text-xs">
          <span className="text-neutral-400 font-medium">Recompensas:</span>
          <div className="flex items-center gap-2.5 font-bold">
            <span className="text-purple-400 flex items-center gap-1">
              <Award size={13} />+{record.xpEarned ?? 0} XP
            </span>
            <span className="text-neutral-500">•</span>
            <span className="text-gold flex items-center gap-1">
              <Coins size={13} />+{formatCoins(record.coinsEarned ?? 0)}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-neutral-400">
          <span>Lazer / Mochila</span>
          <span className="text-tiny text-neutral-400">
            Sem ganho de XP/ouro
          </span>
        </div>
      )}

      {/* Campo Editável: Anotações da Sessão */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="focus-record-notes-edit"
            className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5"
          >
            <Pencil size={12} className="text-gold" />
            Anotações da Sessão
          </label>
          <span className="text-tiny text-neutral-400 font-mono">
            {notes.length}/500
          </span>
        </div>

        <div className="relative rounded-xl border border-primary/30 bg-surface/60 p-2.5 focus-within:border-gold focus-within:ring-1 focus-within:ring-gold transition-all">
          <textarea
            id="focus-record-notes-edit"
            rows={3}
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="O que você realizou, leu ou estudou nesta sessão de foco..."
            className="w-full bg-transparent text-xs text-neutral-100 placeholder:text-neutral-500 outline-none resize-none custom-scrollbar leading-relaxed"
          />
        </div>
      </div>

      {/* Ações do Rodapé */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-primary/20">
        {/* Botão de Excluir */}
        {onDeleteRecord ? (
          <>
            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/15 transition-colors cursor-pointer"
              title="Excluir este registro"
            >
              <Trash2 size={13} />
              <span>Excluir</span>
            </button>

            <ConfirmationModal
              isOpen={isDeleteConfirmOpen}
              onClose={() => setIsDeleteConfirmOpen(false)}
              onConfirm={() => {
                onDeleteRecord(record.id);
                setIsDeleteConfirmOpen(false);
                onClose();
              }}
              title="Excluir Registro"
              description={
                <p>
                  Tem certeza que deseja excluir permanentemente o registro da
                  sessão{" "}
                  <strong className="text-neutral-100">
                    "{record.activityName || record.itemName || "Sessão Livre"}"
                  </strong>
                  ? Esta ação é irreversível.
                </p>
              }
              confirmText="Sim, excluir"
              variant="danger"
            />
          </>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-300 hover:bg-white/10 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSaveNotes}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-gold text-neutral-900 hover:bg-gold-hover shadow-glow-gold-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles size={13} />
            <span>{isSaving ? "Salvando..." : "Salvar"}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
