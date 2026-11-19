"use client";

import {
  Check,
  Compass,
  Crown,
  Lock,
  Moon,
  ScrollText,
  Shield,
  Sun,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { LazyUpgradePremiumModal } from "@/components/subscription/LazyUpgradePremiumModal";
import {
  getThemeDefinition,
  STANDARD_THEMES,
  type ThemeDefinition,
  VIP_THEMES,
} from "@/constants/themes";
import { useThemeMode } from "@/hooks/useThemeMode";
import { useUserStore } from "@/store/userStore";
import type { ThemeId } from "@/types/ui";
import { cn } from "@/utils";

const THEME_ICONS: Record<ThemeId, ReactNode> = {
  dark: <Moon size={16} aria-hidden="true" />,
  light: <Sun size={16} aria-hidden="true" />,
  "dark-knight": <Shield size={16} aria-hidden="true" />,
  "solar-parchment": <ScrollText size={16} aria-hidden="true" />,
  "cyberpunk-neon": <Zap size={16} aria-hidden="true" />,
  "forest-ranger": <Compass size={16} aria-hidden="true" />,
  "royal-gold": <Crown size={16} aria-hidden="true" />,
};

const STATUS_KEY_BY_THEME: Record<
  ThemeId,
  | "statusDark"
  | "statusLight"
  | "statusDark-knight"
  | "statusSolar-parchment"
  | "statusCyberpunk-neon"
  | "statusForest-ranger"
  | "statusRoyal-gold"
> = {
  dark: "statusDark",
  light: "statusLight",
  "dark-knight": "statusDark-knight",
  "solar-parchment": "statusSolar-parchment",
  "cyberpunk-neon": "statusCyberpunk-neon",
  "forest-ranger": "statusForest-ranger",
  "royal-gold": "statusRoyal-gold",
};

interface ThemePreviewCardProps {
  definition: ThemeDefinition;
  title: string;
  description: string;
  polarityLabel: string;
  badgeLabel?: string;
  isSelected: boolean;
  isLocked: boolean;
  onSelect: (id: ThemeId) => void;
}

function ThemePreviewCard({
  definition,
  title,
  description,
  polarityLabel,
  badgeLabel,
  isSelected,
  isLocked,
  onSelect,
}: ThemePreviewCardProps) {
  const { swatches, polarity } = definition;
  const isLightPreview = polarity === "light";

  return (
    <button
      type="button"
      onClick={() => onSelect(definition.id)}
      aria-pressed={isSelected}
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border p-3.5 text-left transition-[border-color,background-color,box-shadow,opacity] cursor-pointer",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
        isSelected
          ? "border-gold bg-gold/10 shadow-glow-gold-xs"
          : isLocked
            ? "border-neutral-700/80 dark:border-white/10 bg-surface/40 opacity-85 hover:opacity-100 hover:border-gold/40"
            : "border-neutral-700 dark:border-primary/20 bg-surface/50 hover:border-primary-light/45 hover:bg-surface/80",
      )}
    >
      {/* Mini Paleta Visual */}
      <div
        aria-hidden="true"
        className={cn(
          "w-full rounded-lg border p-2.5 flex items-center justify-between gap-2 transition-transform duration-150 group-hover:scale-[1.01]",
          isLightPreview ? "border-stone-900/15" : "border-zinc-100/12",
        )}
        style={{ backgroundColor: swatches.background }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={cn(
              "h-6 w-10 rounded-md border flex items-center px-1.5 gap-1 shrink-0",
              isLightPreview ? "border-stone-900/12" : "border-zinc-100/12",
            )}
            style={{ backgroundColor: swatches.card }}
          >
            <span
              className="h-1.5 w-3.5 rounded-full"
              style={{ backgroundColor: swatches.primary }}
            />
            <span
              className="h-1.5 w-2 rounded-full"
              style={{ backgroundColor: swatches.gold }}
            />
          </div>
          <div className="flex items-center gap-1">
            {(["background", "card", "primary", "accent", "gold"] as const).map(
              (role) => (
                <span
                  key={`${definition.id}-${role}`}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full ring-1 shrink-0",
                    isLightPreview ? "ring-stone-900/18" : "ring-zinc-100/20",
                  )}
                  style={{ backgroundColor: swatches[role] }}
                />
              ),
            )}
          </div>
        </div>

        <span
          className={cn(
            "w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors",
            isSelected
              ? "bg-gold text-on-gold shadow-xs"
              : isLightPreview
                ? "bg-stone-900/10 text-stone-800"
                : "bg-zinc-100/12 text-zinc-100",
          )}
        >
          {isSelected ? (
            <Check size={14} strokeWidth={2.75} />
          ) : (
            THEME_ICONS[definition.id]
          )}
        </span>
      </div>

      {/* Título + Badges + Descrição */}
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "text-sm font-bold truncate",
              isSelected ? "text-amber-700 dark:text-gold" : "text-neutral-50",
            )}
          >
            {title}
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-neutral-600/80 bg-surface text-neutral-300 dark:border-zinc-100/12 dark:bg-zinc-100/5">
              {isLightPreview ? (
                <Sun size={10} aria-hidden="true" />
              ) : (
                <Moon size={10} aria-hidden="true" />
              )}
              {polarityLabel}
            </span>

            {badgeLabel && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0",
                  definition.isPremium
                    ? isLocked
                      ? "bg-gold/10 text-amber-700 dark:text-gold border-gold/30"
                      : "bg-gold/20 text-amber-800 dark:text-gold border-gold/45"
                    : definition.isDefault
                      ? "bg-primary/15 text-primary dark:text-primary-light border-primary/30"
                      : "bg-success-500/12 text-success-300 border-success-500/30",
                )}
              >
                {isLocked && <Lock size={10} aria-hidden="true" />}
                {badgeLabel}
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>
    </button>
  );
}

export function ThemeSettings() {
  const t = useTranslations("settings.theme");
  const { theme, setTheme, mounted } = useThemeMode();
  const isPremium = useUserStore((s) => s.is_Premium);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  if (!mounted) {
    return (
      <div className="animate-pulse flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="h-36 bg-surface/60 dark:bg-white/5 rounded-xl" />
          <div className="h-36 bg-surface/60 dark:bg-white/5 rounded-xl" />
          <div className="h-36 bg-surface/60 dark:bg-white/5 rounded-xl" />
          <div className="h-36 bg-surface/60 dark:bg-white/5 rounded-xl" />
        </div>
        <div className="h-px w-full bg-neutral-700/40 dark:bg-white/10" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="h-36 bg-surface/60 dark:bg-white/5 rounded-xl" />
          <div className="h-36 bg-surface/60 dark:bg-white/5 rounded-xl" />
          <div className="h-36 bg-surface/60 dark:bg-white/5 rounded-xl" />
        </div>
      </div>
    );
  }

  const handleSelectTheme = (themeId: ThemeId) => {
    const def = getThemeDefinition(themeId);
    if (def.isPremium && !isPremium) {
      toast.info(t("lockedToast"));
      setIsUpgradeModalOpen(true);
      return;
    }
    if (theme !== themeId) {
      setTheme(themeId);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* BLOCO 1: TEMAS GRATUITOS (2 ESCUROS + 2 CLAROS) */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            {t("standardSectionTitle")}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {STANDARD_THEMES.map((item) => (
              <ThemePreviewCard
                key={item.id}
                definition={item}
                title={t(item.id)}
                description={t(`${item.id}Desc`)}
                polarityLabel={
                  item.polarity === "light"
                    ? t("polarityLight")
                    : t("polarityDark")
                }
                badgeLabel={item.isDefault ? t("defaultBadge") : t("freeBadge")}
                isSelected={theme === item.id}
                isLocked={false}
                onSelect={handleSelectTheme}
              />
            ))}
          </div>
        </div>

        <div className="h-px w-full bg-neutral-700 dark:bg-white/10" />

        {/* BLOCO 2: TEMAS ATMOSFÉRICOS VIP */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-amber-700 dark:text-gold shrink-0 mt-0.5">
                <Crown size={18} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-neutral-50">
                    {t("vipSectionTitle")}
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-gold/20 text-amber-800 dark:text-gold border border-gold/40">
                    {t("vipBadge")}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                  {t("vipSectionDesc")}
                </p>
              </div>
            </div>

            {!isPremium && (
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(true)}
                className="px-3.5 py-2 rounded-lg text-xs font-bold bg-gold text-on-gold hover:bg-gold-hover transition-colors cursor-pointer shrink-0 shadow-xs self-start sm:self-center"
              >
                {t("unlockVip")}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {VIP_THEMES.map((item) => (
              <ThemePreviewCard
                key={item.id}
                definition={item}
                title={t(item.id)}
                description={t(`${item.id}Desc`)}
                polarityLabel={
                  item.polarity === "light"
                    ? t("polarityLight")
                    : t("polarityDark")
                }
                badgeLabel={t("vipBadge")}
                isSelected={theme === item.id}
                isLocked={!isPremium}
                onSelect={handleSelectTheme}
              />
            ))}
          </div>
        </div>

        {/* BANNER INFORMATIVO DE TEMA ATIVO */}
        <div className="rounded-xl border border-gold/25 bg-gold/10 p-3.5 flex items-center gap-3 text-xs">
          <span className="w-7 h-7 rounded-lg bg-gold text-on-gold flex items-center justify-center shrink-0 shadow-xs">
            {THEME_ICONS[theme]}
          </span>
          <p className="text-neutral-200 leading-relaxed">
            <strong className="text-amber-800 dark:text-gold font-bold">
              {t("statusActiveLabel")}
            </strong>
            {t(STATUS_KEY_BY_THEME[theme])}
          </p>
        </div>
      </div>

      {isUpgradeModalOpen && (
        <LazyUpgradePremiumModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
        />
      )}
    </>
  );
}
