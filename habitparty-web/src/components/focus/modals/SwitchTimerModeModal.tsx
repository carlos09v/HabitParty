"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { BaseModal } from "@/components/ui/BaseModal";
import type { FocusRecordType } from "@/types/focus";

interface SwitchTimerModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: FocusRecordType;
  newMode: FocusRecordType;
  onConfirm: () => void;
}

export function SwitchTimerModeModal({
  isOpen,
  onClose,
  currentMode,
  newMode,
  onConfirm,
}: SwitchTimerModeModalProps) {
  const t = useTranslations("focus.switchTimerModal");
  const currentModeLabel = t(`modes.${currentMode}`);
  const newModeLabel = t(`modes.${newMode}`);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("title")}
      description={t("description")}
    >
      <div className="flex flex-col gap-4 mt-2">
        {/* Aviso visual */}
        <div className="flex items-start gap-3 p-3 rounded-xl border border-amber-500/35 bg-amber-500/10 text-amber-800 dark:border-amber-500/30 dark:text-amber-200">
          <AlertTriangle
            size={18}
            className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
          />
          <div className="text-xs leading-relaxed text-neutral-300">
            <p>
              {t.rich("warningBody", {
                currentMode: currentModeLabel,
                newMode: newModeLabel,
                amber: (chunks) => (
                  <strong className="text-amber-800 dark:text-amber-300">
                    {chunks}
                  </strong>
                ),
                gold: (chunks) => (
                  <strong className="text-amber-700 dark:text-gold">
                    {chunks}
                  </strong>
                ),
              })}
            </p>
          </div>
        </div>

        {/* Comparação visual: Atual -> Novo */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface/70 border border-neutral-700 dark:border-primary/30">
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-label-g text-neutral-400 font-medium">
              {t("currentModeLabel")}
            </span>
            <span
              className="text-body-s font-bold text-neutral-200 truncate"
              title={currentModeLabel}
            >
              {currentModeLabel}
            </span>
          </div>

          <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 text-primary dark:bg-primary/20 dark:border-primary/30 flex items-center justify-center shrink-0 dark:text-gold shadow-glow-gold-xs">
            <ArrowRight size={15} />
          </div>

          <div className="flex flex-col min-w-0 flex-1 text-right">
            <span className="text-label-g text-amber-700/90 dark:text-gold/90 font-medium">
              {t("newModeLabel")}
            </span>
            <span
              className="text-body-s font-bold text-amber-700 dark:text-gold truncate"
              title={newModeLabel}
            >
              {newModeLabel}
            </span>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-neutral-700 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-300 hover:bg-surface dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            {t("keepCurrent")}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2 rounded-lg text-xs font-bold bg-gold text-on-gold hover:bg-gold-hover shadow-glow-gold-xs transition-colors cursor-pointer"
          >
            {t("switchAndReset")}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
