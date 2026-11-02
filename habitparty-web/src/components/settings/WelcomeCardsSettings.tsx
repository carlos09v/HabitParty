"use client";

import { Eye, EyeOff, RotateCcw, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Switch } from "@/components/ui/Switch";
import { CONFIGURABLE_WELCOME_CARDS } from "@/constants/welcomeCards";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useWelcomeCards } from "@/store/welcomeCardsStore";
import { cn } from "@/utils";

interface WelcomeCardsSettingsProps {
  isCompact?: boolean;
}

export function WelcomeCardsSettings({
  isCompact = false,
}: WelcomeCardsSettingsProps) {
  const t = useTranslations("settings.welcomeCards");
  const { isGamified } = useExperienceMode();
  const {
    hiddenCards,
    isCardHidden,
    hideCard,
    showCard,
    showAllCards,
    mounted,
  } = useWelcomeCards();

  const getItemText = (key: string, field: string): string => {
    const modeKey = isGamified ? `${field}Gamified` : `${field}Productivity`;
    if (t.has(`items.${key}.${modeKey}`)) {
      return t(`items.${key}.${modeKey}`);
    }
    return t(`items.${key}.${field}`);
  };

  const hiddenCount = mounted
    ? hiddenCards.filter((key) =>
        CONFIGURABLE_WELCOME_CARDS.some((card) => card.key === key),
      ).length
    : 0;

  const totalCards = CONFIGURABLE_WELCOME_CARDS.length;

  const handleToggle = (key: string, currentlyHidden: boolean) => {
    const cardTitle = getItemText(key, "title");
    if (currentlyHidden) {
      showCard(key);
      toast.success(t("cardReactivatedToast", { title: cardTitle }));
    } else {
      hideCard(key);
      toast.info(t("cardHiddenToast", { title: cardTitle }));
    }
  };

  const handleRestoreAll = () => {
    showAllCards();
    toast.success(t("restoreAllSuccess"));
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Barra de Status e Ação Rápida */}
      <div
        className={cn(
          "rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors",
          isCompact ? "p-3" : "p-4",
          hiddenCount > 0
            ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
            : "bg-gold/10 border-gold/30 text-gold",
        )}
      >
        <div className="flex items-center gap-3">
          {hiddenCount > 0 ? (
            <EyeOff size={20} className="shrink-0 text-amber-400" />
          ) : (
            <Sparkles size={20} className="shrink-0 text-gold" />
          )}
          <div className="text-sm">
            <span className="font-bold">{t("statusLabel")}</span>
            {hiddenCount === 0
              ? t("allVisible")
              : t("statusSummary", { count: hiddenCount, total: totalCards })}
          </div>
        </div>

        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={handleRestoreAll}
            className="self-end sm:self-center px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/30 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <RotateCcw size={13} />
            <span>{t("restoreAllBtn")}</span>
          </button>
        )}
      </div>

      {/* Grade de Cards Configuráveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CONFIGURABLE_WELCOME_CARDS.map((card) => {
          const Icon = card.icon;
          const isHidden = isCardHidden(card.key);

          return (
            <div
              key={card.key}
              className={cn(
                "rounded-xl border transition-all flex flex-col justify-between gap-3.5",
                isCompact ? "p-3.5" : "p-4",
                isHidden
                  ? "bg-surface/30 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.06)]"
                  : "bg-surface/50 border-white/10 hover:border-white/20",
              )}
            >
              {/* Header do Mini Card: Ícone + Rota + Switch de Visibilidade */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 transition-colors",
                      isHidden
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                        : "bg-surface border-white/10 text-gold",
                    )}
                  >
                    <Icon size={18} />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <h4 className="text-body-m font-bold text-neutral-100 truncate">
                      {getItemText(card.key, "pageName")}
                    </h4>
                    <span className="text-tiny font-mono text-neutral-400">
                      {card.route}
                    </span>
                  </div>
                </div>

                {/* Switch de Ativação / Desativação */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      "text-tiny font-semibold flex items-center gap-1",
                      isHidden ? "text-amber-400" : "text-emerald-400",
                    )}
                  >
                    {isHidden ? (
                      <>
                        <EyeOff size={12} />
                        <span className="hidden sm:inline">
                          {t("hiddenBadge")}
                        </span>
                      </>
                    ) : (
                      <>
                        <Eye size={12} />
                        <span className="hidden sm:inline">
                          {t("visibleBadge")}
                        </span>
                      </>
                    )}
                  </span>
                  <Switch
                    checked={!isHidden}
                    onCheckedChange={() => handleToggle(card.key, isHidden)}
                    size="sm"
                    aria-label={t("cardAria", {
                      pageName: getItemText(card.key, "pageName"),
                    })}
                  />
                </div>
              </div>

              {/* Informações do Banner */}
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-gold/90 truncate">
                  "{getItemText(card.key, "title")}"
                </p>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {getItemText(card.key, "description")}
                </p>
              </div>

              {/* Botão de Ação Rápida quando Ocultado */}
              {isHidden && (
                <button
                  type="button"
                  onClick={() => handleToggle(card.key, true)}
                  className="w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  <RotateCcw size={13} />
                  <span>{t("reactivateBtn")}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
