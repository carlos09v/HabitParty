"use client";

import {
  Award,
  Calendar,
  Clock,
  ListTodo,
  Pencil,
  Sparkles,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { updateFocusRecord } from "@/actions/focusActions";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { useAnchoredPopoverPosition } from "@/hooks/useAnchoredPopoverPosition";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useDateFormat } from "@/hooks/useDateFormat";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useIsClient } from "@/hooks/useIsClient";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useNativeModalDialog } from "@/hooks/useNativeModalDialog";
import { useTimeFormat } from "@/hooks/useTimeFormat";
import type { AppLocale } from "@/i18n/config";
import { useUserStore } from "@/store/userStore";
import type { FocusRecord } from "@/types/focus";
import { formatCoins, formatDateTime } from "@/utils";
import { formatFocusRecordDuration } from "@/utils/focusFormatters";
import { resolveFocusRecordDisplay } from "@/utils/focusIcons";

interface FocusRecordDetailsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  record: FocusRecord | null;
  anchorRect: DOMRect | null;
  /** Elemento acionador para reposicionamento durante scroll e restauração de foco no desktop. */
  anchorElement?: HTMLElement | null;
  onRequestEdit?: (record: FocusRecord) => void;
  onRequestDelete?: (record: FocusRecord) => void;
  onRecordUpdated?: (updatedRecord: FocusRecord) => void;
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
  anchorElement,
  onRequestEdit,
  onRequestDelete,
  onRecordUpdated,
}: FocusRecordDetailsPopoverProps) {
  const t = useTranslations("focus.recordDetails");
  const { isGamified } = useExperienceMode();
  const locale = useLocale() as AppLocale;
  const { dateFormat } = useDateFormat();
  const { timeFormat } = useTimeFormat();
  const userTimeZone = useUserStore((s) => s.user?.timezone);
  const mounted = useIsClient();
  const isMobileScreen = useMediaQuery("(max-width: 639px)", false);

  const titleId = useId();
  const notesFieldId = useId();
  const popoverRef = useRef<HTMLDivElement>(null);
  const previousFocusedRef = useRef<HTMLElement | null>(null);

  const [notes, setNotes] = useState(record?.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [liveAnchorRect, setLiveAnchorRect] = useState<DOMRect | null>(
    anchorRect,
  );

  useEffect(() => {
    setNotes(record?.notes || "");
  }, [record]);

  useEffect(() => {
    setLiveAnchorRect(anchorRect);
  }, [anchorRect]);

  const handleClose = useCallback(() => {
    if (isSaving) return;
    onClose();
  }, [isSaving, onClose]);

  // Mobile: usa <dialog> nativo na Top Layer (focus trap, background inert, Esc e scroll containment nativos)
  const { dialogRef, dialogEventHandlers } = useNativeModalDialog({
    isOpen: isOpen && mounted && isMobileScreen && Boolean(record),
    onClose: handleClose,
    preventClose: isSaving,
  });

  // Desktop: gestão de foco (move para o popover ao abrir, restaura para o acionador ao fechar)
  useEffect(() => {
    if (!isOpen || !mounted || isMobileScreen) return;
    previousFocusedRef.current =
      anchorElement ?? (document.activeElement as HTMLElement | null);
    const frameId = window.requestAnimationFrame(() => {
      popoverRef.current?.focus({ preventScroll: true });
    });
    return () => {
      window.cancelAnimationFrame(frameId);
      const targetToRestore = previousFocusedRef.current;
      if (targetToRestore?.isConnected) {
        targetToRestore.focus({ preventScroll: true });
      }
    };
  }, [isOpen, mounted, isMobileScreen, anchorElement]);

  // Desktop: reposiciona o popover se a lista lateral rolar enquanto ele está aberto
  useEffect(() => {
    if (!isOpen || !mounted || isMobileScreen || !anchorElement) return;
    let rafId: number | null = null;
    const syncRect = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        if (anchorElement.isConnected) {
          setLiveAnchorRect(anchorElement.getBoundingClientRect());
        }
      });
    };
    window.addEventListener("scroll", syncRect, true);
    window.addEventListener("resize", syncRect);
    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", syncRect, true);
      window.removeEventListener("resize", syncRect);
    };
  }, [isOpen, mounted, isMobileScreen, anchorElement]);

  const position = useAnchoredPopoverPosition(
    isOpen && !isMobileScreen,
    liveAnchorRect,
    popoverRef,
    POPOVER_OPTIONS,
    mounted,
  );

  useClickOutside(popoverRef, handleClose, {
    enabled: isOpen && !isMobileScreen && !isSaving,
    onEscape: handleClose,
  });

  if (!isOpen || !mounted || !record) return null;

  const {
    title: displayTitle,
    subtitle: displaySubtitle,
    IconComp,
  } = resolveFocusRecordDisplay(record, t("freeSession"));

  const durationLabel = formatFocusRecordDuration(
    record.startTime,
    record.endTime,
    record.durationMinutes,
  );

  const trimmedOriginalNotes = (record.notes ?? "").trim();
  const trimmedCurrentNotes = notes.trim();
  const isDirty = trimmedCurrentNotes !== trimmedOriginalNotes;

  const handleSaveNotes = async () => {
    if (isSaving) return;
    if (!isDirty) {
      onClose();
      return;
    }
    setIsSaving(true);
    try {
      const res = await updateFocusRecord(record.id, {
        notes: trimmedCurrentNotes,
      });

      if (res.success) {
        onRecordUpdated?.({
          ...record,
          notes: res.data?.notes ?? trimmedCurrentNotes,
        });
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

  const panelBody = (
    <>
      {/* Header com Ícone, Título e Fechar */}
      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-neutral-700 dark:border-primary/20">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:bg-gold/15 dark:border-gold/40 flex items-center justify-center shrink-0 dark:text-gold shadow-glow-gold-xs">
            <IconComp size={18} aria-hidden="true" />
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <h2
              id={titleId}
              className="text-body-m font-bold text-neutral-100 truncate"
            >
              {displayTitle}
            </h2>
            {displaySubtitle && (
              <span className="text-tiny text-amber-700 dark:text-gold font-medium truncate inline-flex items-center gap-1">
                <ListTodo size={11} className="shrink-0" aria-hidden="true" />
                <span className="truncate">{displaySubtitle}</span>
              </span>
            )}
            <span className="text-[11px] text-neutral-400 flex items-center gap-1">
              <Calendar
                size={11}
                aria-hidden="true"
                className="text-neutral-500"
              />
              {formatDateTime(record.endTime, {
                isLocal: true,
                timeZone: userTimeZone,
                locale,
                dateFormat,
                timeFormat,
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onRequestEdit && (
            <button
              type="button"
              onClick={() => {
                onRequestEdit(record);
                onClose();
              }}
              className="min-w-8 min-h-8 pointer-coarse:min-w-10 pointer-coarse:min-h-10 p-1.5 rounded-lg flex items-center justify-center text-neutral-400 hover:text-amber-700 dark:hover:text-gold hover:bg-surface dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              aria-label={t("editFullAria")}
              title={t("editFullTitle")}
            >
              <Pencil size={15} aria-hidden="true" />
            </button>
          )}

          <button
            type="button"
            onClick={handleClose}
            className="min-w-8 min-h-8 pointer-coarse:min-w-10 pointer-coarse:min-h-10 p-1.5 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-100 hover:bg-surface dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label={t("closeAria")}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Resumo da Sessão */}
      <div className="grid grid-cols-2 gap-2 bg-surface/60 dark:bg-surface/50 border border-neutral-700 dark:border-primary/20 rounded-xl p-2.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-tiny text-neutral-400 uppercase tracking-wider font-semibold flex items-center gap-1">
            <Clock
              size={10}
              aria-hidden="true"
              className="text-amber-800 dark:text-gold"
            />
            {t("durationLabel")}
          </span>
          <span className="text-body-s font-bold text-amber-700 dark:text-gold font-mono tabular-nums">
            {durationLabel}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-tiny text-neutral-400 uppercase tracking-wider font-semibold flex items-center gap-1">
            <Timer
              size={10}
              aria-hidden="true"
              className="text-amber-800 dark:text-gold"
            />
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

      {/* Recompensas */}
      {!record.inventoryItemId ? (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 dark:bg-gold/10 dark:border-gold/30 text-xs">
          <span className="text-neutral-400 font-medium">
            {t("rewardsLabel")}
          </span>
          <div className="flex items-center gap-2.5 font-bold tabular-nums">
            <span className="text-magenta dark:text-fuchsia-300 flex items-center gap-1">
              <Award size={13} aria-hidden="true" />+{record.xpEarned ?? 0}{" "}
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
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-surface border border-neutral-700 dark:bg-white/5 dark:border-white/10 text-xs text-neutral-400">
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

      {/* Campo Editável: Anotações da Sessão (suporta Ctrl/Cmd+Enter) */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor={notesFieldId}
            className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5"
          >
            <Pencil
              size={12}
              aria-hidden="true"
              className="text-amber-800 dark:text-gold"
            />
            {t("sessionNotesLabel")}
          </label>
          <span className="text-tiny text-neutral-400 font-mono tabular-nums">
            {notes.length}/500
          </span>
        </div>

        <div className="relative rounded-xl border border-neutral-600 dark:border-primary/30 bg-card dark:bg-surface/60 p-2.5 focus-within:border-primary dark:focus-within:border-gold focus-within:ring-1 focus-within:ring-primary dark:focus-within:ring-gold transition-colors">
          <textarea
            id={notesFieldId}
            rows={3}
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                if (isDirty && !isSaving) {
                  void handleSaveNotes();
                }
              }
            }}
            placeholder={t("notesPlaceholder")}
            className="w-full bg-transparent text-xs text-neutral-100 placeholder:text-neutral-500 outline-none resize-none custom-scrollbar leading-relaxed"
          />
        </div>
      </div>

      {/* Ações do Rodapé */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-700 dark:border-primary/20">
        {onRequestDelete ? (
          <button
            type="button"
            onClick={() => {
              onRequestDelete(record);
              onClose();
            }}
            className="flex items-center gap-1 px-2.5 min-h-9 pointer-coarse:min-h-10 rounded-lg text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-500/15 transition-colors cursor-pointer"
            title={t("deleteRecordTitle")}
          >
            <Trash2 size={13} aria-hidden="true" />
            <span>{t("deleteButton")}</span>
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={handleClose}
            className="px-3 min-h-9 pointer-coarse:min-h-10 rounded-lg text-xs font-semibold text-neutral-300 hover:bg-surface dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            {t("cancelButton")}
          </button>

          <button
            type="button"
            onClick={() => void handleSaveNotes()}
            disabled={isSaving || !isDirty}
            className="flex items-center gap-1.5 px-4 min-h-9 pointer-coarse:min-h-10 rounded-lg text-xs font-bold bg-gold text-on-gold hover:bg-gold-hover shadow-glow-gold-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={13} aria-hidden="true" />
            <span>{isSaving ? t("savingButton") : t("saveButton")}</span>
          </button>
        </div>
      </div>
    </>
  );

  // Mobile: bottom sheet em <dialog> nativo modal (sem role/aria-modal redundantes)
  if (isMobileScreen) {
    return createPortal(
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        {...dialogEventHandlers}
        className="hp-dialog-modal fixed inset-0 w-screen h-dvh open:flex items-end justify-center p-0 animate-in fade-in duration-150"
      >
        <div className="w-full max-w-lg max-h-[85dvh] overflow-y-auto overscroll-contain custom-scrollbar rounded-t-2xl border-t border-x border-neutral-700 dark:border-primary/40 bg-card dark:bg-popover p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl animate-in slide-in-from-bottom duration-200 select-none flex flex-col gap-3.5">
          {panelBody}
        </div>
      </dialog>,
      document.body,
    );
  }

  // Desktop: popover não-modal ancorado à esquerda com gestão de foco e scroll tracking
  return createPortal(
    <div
      ref={popoverRef}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      tabIndex={-1}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      className="fixed z-[100] w-[340px] max-w-[calc(100vw-24px)] max-h-[calc(100dvh-24px)] overflow-y-auto overscroll-contain custom-scrollbar rounded-2xl border border-neutral-700 dark:border-primary/40 bg-card dark:bg-popover p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 select-none flex flex-col gap-3.5 outline-none"
    >
      {panelBody}
    </div>,
    document.body,
  );
}
