"use client";

import {
  Award,
  Calendar,
  Clock,
  Pencil,
  Sparkles,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { updateFocusRecord } from "@/actions/focusActions";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { getFocusIcon } from "@/constants/focus";
import { useAnchoredPopoverPosition } from "@/hooks/useAnchoredPopoverPosition";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useDateFormat } from "@/hooks/useDateFormat";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useIsClient } from "@/hooks/useIsClient";
import { useTimeFormat } from "@/hooks/useTimeFormat";
import type { AppLocale } from "@/i18n/config";
import { useUserStore } from "@/store/userStore";
import type { FocusRecord } from "@/types/focus";
import { formatCoins, formatDateTime } from "@/utils";
import { formatFocusRecordDuration } from "@/utils/focusFormatters";

interface FocusRecordDetailsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  record: FocusRecord | null;
  anchorRect: DOMRect | null;
  /** Solicita a exclusão do registro (confirmação exibida pelo pai). */
  onRequestDelete?: (record: FocusRecord) => void;
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
  onRequestDelete,
}: FocusRecordDetailsPopoverProps) {
  const t = useTranslations("focus.recordDetails");
  const { isGamified } = useExperienceMode();
  const locale = useLocale() as AppLocale;
  const { dateFormat } = useDateFormat();
  const { timeFormat } = useTimeFormat();
  const mounted = useIsClient();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [notes, setNotes] = useState(record?.notes || "");
  const [isSaving, setIsSaving] = useState(false);

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
    enabled: isOpen,
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
        toast.success(t("toasts.notesUpdated"));
        onClose();
      } else {
        toast.error(res.error || t("toasts.updateFailed"));
      }
    } catch {
      toast.error(t("toasts.saveError"));
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
      className="fixed z-[100] w-[340px] max-w-[calc(100vw-24px)] rounded-2xl border border-neutral-700 dark:border-primary/40 bg-card dark:bg-popover p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 select-none flex flex-col gap-3.5"
      role="dialog"
      aria-modal="true"
      aria-label={t("dialogAriaLabel")}
    >
      {/* Header com Ícone, Título e Fechar */}
      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-neutral-700 dark:border-primary/20">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:bg-gold/15 dark:border-gold/40 flex items-center justify-center shrink-0 dark:text-gold shadow-glow-gold-xs">
            <IconComp size={18} />
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <h3 className="text-body-m font-bold text-neutral-100 truncate">
              {record.activityName ||
                record.taskNameSnapshot ||
                record.itemName ||
                t("freeSession")}
            </h3>
            {record.activityName && record.taskNameSnapshot && (
              <span className="text-tiny text-gold font-medium truncate">
                📌 {record.taskNameSnapshot}
              </span>
            )}
            <span className="text-label-g text-neutral-400 flex items-center gap-1">
              <Calendar size={11} className="text-neutral-500" />
              {formatDateTime(record.endTime, {
                isLocal: true,
                timeZone: useUserStore.getState().user?.timezone,
                locale,
                dateFormat,
                timeFormat,
              })}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-100 hover:bg-surface dark:hover:bg-white/10 transition-colors cursor-pointer"
          aria-label={t("closeAria")}
        >
          <X size={16} />
        </button>
      </div>

      {/* Resumo da Sessão (Somente leitura) */}
      <div className="grid grid-cols-2 gap-2 bg-surface/60 dark:bg-surface/50 border border-neutral-700 dark:border-primary/20 rounded-xl p-2.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-tiny text-neutral-400 uppercase tracking-wider font-semibold flex items-center gap-1">
            <Clock size={10} className="text-amber-600 dark:text-gold" />{" "}
            {t("durationLabel")}
          </span>
          <span className="text-body-s font-bold text-amber-700 dark:text-gold font-mono">
            {durationLabel}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-tiny text-neutral-400 uppercase tracking-wider font-semibold flex items-center gap-1">
            <Timer size={10} className="text-amber-600 dark:text-gold" />{" "}
            {t("modeLabel")}
          </span>
          <span className="text-body-s font-semibold text-neutral-200">
            {record.recordType === "POMO"
              ? record.completedPomos
                ? t("modePomoWithCycles", { count: record.completedPomos })
                : t("modePomo")
              : t("modeStopwatch")}
          </span>
        </div>
      </div>

      {/* Recompensas da Sessão (Atividades pontuam, itens de lazer da mochila pontuam 0) */}
      {!record.inventoryItemId ? (
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 dark:bg-gold/10 dark:border-gold/30 text-xs">
          <span className="text-neutral-400 font-medium">
            {t("rewardsLabel")}
          </span>
          <div className="flex items-center gap-2.5 font-bold">
            <span className="text-primary dark:text-purple-400 flex items-center gap-1">
              <Award size={13} />+{record.xpEarned ?? 0}{" "}
              {isGamified ? "XP" : "pts"}
            </span>
            <span className="text-neutral-500">•</span>
            <span className="text-amber-700 dark:text-gold flex items-center gap-1">
              <CoinIcon size={13} />+
              {formatCoins(record.coinsEarned ?? 0, { locale })}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface border border-neutral-700 dark:bg-white/5 dark:border-white/10 text-xs text-neutral-400">
          <span>
            {isGamified
              ? t("leisureBackpackLabel")
              : t("leisureInventoryLabel")}
          </span>
          <span className="text-tiny text-neutral-400">
            {isGamified ? t("noXpOrGold") : t("noPointsOrCredits")}
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
            <Pencil size={12} className="text-amber-600 dark:text-gold" />
            {t("sessionNotesLabel")}
          </label>
          <span className="text-tiny text-neutral-400 font-mono">
            {notes.length}/500
          </span>
        </div>

        <div className="relative rounded-xl border border-neutral-600 dark:border-primary/30 bg-card dark:bg-surface/60 p-2.5 focus-within:border-primary dark:focus-within:border-gold focus-within:ring-1 focus-within:ring-primary dark:focus-within:ring-gold transition-colors">
          <textarea
            id="focus-record-notes-edit"
            rows={3}
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("notesPlaceholder")}
            className="w-full bg-transparent text-xs text-neutral-100 placeholder:text-neutral-500 outline-none resize-none custom-scrollbar leading-relaxed"
          />
        </div>
      </div>

      {/* Ações do Rodapé */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-700 dark:border-primary/20">
        {/* Botão de Excluir */}
        {onRequestDelete ? (
          <button
            type="button"
            onClick={() => {
              // A confirmação (com opção de limpar o Histórico) é exibida pelo componente pai
              onRequestDelete(record);
              onClose();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-500/15 transition-colors cursor-pointer"
            title={t("deleteRecordTitle")}
          >
            <Trash2 size={13} />
            <span>{t("deleteButton")}</span>
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-300 hover:bg-surface dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            {t("cancelButton")}
          </button>

          <button
            type="button"
            onClick={handleSaveNotes}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-gold text-on-gold hover:bg-gold-hover shadow-glow-gold-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Sparkles size={13} />
            <span>{isSaving ? t("savingButton") : t("saveButton")}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
