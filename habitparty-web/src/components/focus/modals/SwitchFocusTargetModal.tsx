"use client";

import {
  ArrowRight,
  ArrowRightLeft,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Timer,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { BaseModal } from "@/components/ui/BaseModal";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import { cn } from "@/utils";
import { formatDurationMinSec } from "@/utils/focusFormatters";

interface SwitchFocusTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  newTargetName: string;
  isCurrentInventory?: boolean;
  isNewInventory?: boolean;
  isNewTask?: boolean;
  onTransfer: () => void;
  onSaveAndStartNew: () => Promise<boolean> | boolean;
  onDiscardAndStartNew: () => void;
}

export function SwitchFocusTargetModal({
  isOpen,
  onClose,
  currentName,
  newTargetName,
  isCurrentInventory = false,
  isNewInventory = false,
  isNewTask = false,
  onTransfer,
  onSaveAndStartNew,
  onDiscardAndStartNew,
}: SwitchFocusTargetModalProps) {
  const t = useTranslations("focus.switchTargetModal");
  const [isSaving, setIsSaving] = useState(false);
  const elapsedSeconds = useFocusTimerStore((s) => s.elapsedSeconds);

  if (!isOpen) return null;

  const timeDisplay = formatDurationMinSec(elapsedSeconds);

  // Transferência direta só é permitida entre atividades normais
  const canTransfer = !isCurrentInventory && !isNewInventory && !isNewTask;

  // Sessões só podem ser salvas a partir de 1 minuto (60 segundos)
  const canSaveCurrent = elapsedSeconds >= 60;
  const secondsUntilCanSave = Math.max(0, 60 - elapsedSeconds);

  const handleSave = async () => {
    if (!canSaveCurrent || isSaving) return;
    setIsSaving(true);
    try {
      const saved = await onSaveAndStartNew();
      if (saved !== false) {
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleTransfer = () => {
    onTransfer();
    onClose();
  };

  const handleDiscard = () => {
    onDiscardAndStartNew();
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      preventClose={isSaving}
      maxWidth="max-w-lg"
      title={t("title")}
      description={t("description")}
    >
      <div className="flex flex-col gap-4 mt-2">
        {/* Banner de Comparação Visual */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface/70 border border-neutral-700 dark:border-primary/30">
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-label-g text-neutral-400 font-medium">
              {t("currentSessionLabel")}
            </span>
            <span
              className="text-body-s font-bold text-neutral-200 truncate"
              title={currentName}
            >
              {currentName}
            </span>
            <span className="flex items-center gap-1 text-label-g font-semibold text-amber-700 dark:text-gold mt-0.5">
              <Timer size={12} />
              {t("elapsed", { time: timeDisplay })}
            </span>
          </div>

          <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 text-primary dark:bg-primary/20 dark:border-primary/30 flex items-center justify-center shrink-0 dark:text-gold shadow-glow-gold-xs">
            <ArrowRight size={15} />
          </div>

          <div className="flex flex-col min-w-0 flex-1 text-right">
            <span className="text-label-g text-amber-700/90 dark:text-gold/90 font-medium">
              {t("newTargetLabel")}
            </span>
            <span
              className="text-body-s font-bold text-amber-700 dark:text-gold truncate"
              title={newTargetName}
            >
              {newTargetName}
            </span>
            <span className="text-label-g text-neutral-400 mt-0.5">
              {isNewInventory
                ? t("targetTypeInventory")
                : isNewTask
                  ? t("targetTypeTask")
                  : t("targetTypeActivity")}
            </span>
          </div>
        </div>

        {/* Escolhas de Ação (Opções 1, 2 e 3) */}
        <div className="flex flex-col gap-2.5">
          {/* Opção 1: Transferir Tempo Atual (Recomendado entre Atividades) */}
          {canTransfer ? (
            <button
              type="button"
              onClick={handleTransfer}
              disabled={isSaving}
              className="w-full text-left p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 hover:border-amber-500 dark:border-gold/40 dark:bg-gold/10 dark:hover:bg-gold/20 dark:hover:border-gold transition-colors flex items-start gap-3 group cursor-pointer shadow-glow-gold-xs disabled:opacity-50"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-700 dark:bg-gold/20 dark:text-gold flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <ArrowRightLeft size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-body-s font-bold text-neutral-100">
                    {t("transferTitle")}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-tiny font-bold bg-gold text-on-gold">
                    {t("recommendedBadge")}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                  {t.rich("transferDescription", {
                    time: timeDisplay,
                    target: newTargetName,
                    gold: (chunks) => (
                      <strong className="text-amber-700 dark:text-gold font-semibold">
                        {chunks}
                      </strong>
                    ),
                    strong: (chunks) => (
                      <strong className="text-neutral-200 font-semibold">
                        {chunks}
                      </strong>
                    ),
                  })}
                </p>
              </div>
            </button>
          ) : (
            <div className="w-full text-left p-3 rounded-xl border border-neutral-700 bg-surface/60 dark:border-primary/20 dark:bg-surface/40 opacity-60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-hover dark:bg-neutral-800 text-neutral-400 flex items-center justify-center shrink-0 mt-0.5">
                <ArrowRightLeft size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-neutral-300">
                  {t("transferUnavailableTitle")}
                </span>
                <p className="text-label-g text-neutral-400 mt-0.5">
                  {t("transferUnavailableDescription")}
                </p>
              </div>
            </div>
          )}

          {/* Opção 2: Salvar Atual e Iniciar Nova */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSaveCurrent || isSaving}
            className={cn(
              "w-full text-left p-3.5 rounded-xl border transition-colors flex items-start gap-3 group",
              canSaveCurrent
                ? "border-emerald-500/35 bg-emerald-500/10 hover:bg-emerald-500/15 hover:border-emerald-500/60 dark:border-emerald-500/30 dark:hover:bg-emerald-500/20 cursor-pointer disabled:opacity-50"
                : "border-neutral-700 bg-surface/60 dark:border-primary/20 dark:bg-surface/40 opacity-60 cursor-not-allowed",
            )}
          >
            <div
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-transform",
                canSaveCurrent
                  ? "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 group-hover:scale-105"
                  : "bg-surface-hover dark:bg-neutral-800 text-neutral-400",
              )}
            >
              {isSaving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CheckCircle2 size={18} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "text-body-s font-bold",
                    canSaveCurrent ? "text-neutral-100" : "text-neutral-300",
                  )}
                >
                  {t("saveAndStartTitle")}
                </span>
                {!canSaveCurrent && (
                  <span className="px-1.5 py-0.5 rounded text-tiny font-semibold bg-surface dark:bg-neutral-800 text-neutral-400 border border-neutral-700">
                    {t("minOneMinBadge", { seconds: secondsUntilCanSave })}
                  </span>
                )}
              </div>
              {canSaveCurrent ? (
                <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                  {t.rich("saveAndStartDescription", {
                    time: timeDisplay,
                    current: currentName,
                    target: newTargetName,
                    emerald: (chunks) => (
                      <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">
                        {chunks}
                      </strong>
                    ),
                    currentSpan: (chunks) => (
                      <span className="text-neutral-300">{chunks}</span>
                    ),
                    strong: (chunks) => (
                      <strong className="text-neutral-200 font-semibold">
                        {chunks}
                      </strong>
                    ),
                  })}
                </p>
              ) : (
                <p className="text-label-g text-neutral-400 mt-0.5 leading-relaxed">
                  {t.rich("cannotSaveUnderOneMinDescription", {
                    fallbackAction: canTransfer
                      ? t("fallbackTransfer")
                      : t("fallbackKeepSession"),
                    strong: (chunks) => (
                      <strong className="text-neutral-300">{chunks}</strong>
                    ),
                  })}
                </p>
              )}
            </div>
          </button>

          {/* Opção 3: Descartar Atual e Começar Nova */}
          <button
            type="button"
            onClick={handleDiscard}
            disabled={isSaving}
            className="w-full text-left p-3.5 rounded-xl border border-rose-500/25 bg-rose-500/5 hover:bg-rose-500/15 hover:border-rose-500/45 transition-colors flex items-start gap-3 group cursor-pointer disabled:opacity-50"
          >
            <div className="w-9 h-9 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              <RotateCcw size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-body-s font-bold text-neutral-100">
                {t("discardAndStartTitle")}
              </span>
              <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                {t.rich("discardAndStartDescription", {
                  target: newTargetName,
                  strong: (chunks) => (
                    <strong className="text-neutral-200 font-semibold">
                      {chunks}
                    </strong>
                  ),
                })}
              </p>
            </div>
          </button>
        </div>

        {/* Rodapé com botão de Cancelar / Manter Atual */}
        <div className="flex items-center justify-end pt-3 border-t border-neutral-700 dark:border-primary/20">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-semibold text-neutral-400 hover:text-neutral-100 hover:bg-surface dark:hover:bg-white/10 transition-colors cursor-pointer",
              isSaving && "opacity-50 cursor-not-allowed",
            )}
          >
            {t("keepCurrentSession")}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
