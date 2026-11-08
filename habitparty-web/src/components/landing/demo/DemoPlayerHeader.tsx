import { useTranslations } from "next-intl";

interface DemoPlayerHeaderProps {
  level: number;
  xp: number;
  maxXp: number;
}

export function DemoPlayerHeader({ level, xp, maxXp }: DemoPlayerHeaderProps) {
  const t = useTranslations("landing.demo.playerHeader");
  const xpPercent = Math.min(100, Math.round((xp / maxXp) * 100));

  return (
    <div className="p-4 sm:p-6 bg-surface/50 dark:bg-card/60 border-b border-neutral-700 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3.5 w-full sm:w-auto">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-magenta p-0.5 shadow-glow-magenta">
            <div className="w-full h-full rounded-full bg-card dark:bg-surface flex items-center justify-center text-lg font-black text-gold">
              ⚔️
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-gold text-on-gold text-[10px] font-extrabold shadow-sm">
            {t("levelBadge", { level })}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-bold text-neutral-50 flex items-center gap-2">
            {t("name")}
            <span className="text-[10px] font-semibold text-primary-dark dark:text-primary-light px-2 py-0.5 rounded bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30">
              {t("titleBadge")}
            </span>
          </h3>
          <p className="text-xs text-neutral-400">
            {t("xpNextLevel", { xp, maxXp })}
          </p>
        </div>
      </div>

      {/* Barra de Progresso de XP Dinâmica */}
      <div className="w-full sm:w-72">
        <div className="flex justify-between text-xs font-semibold mb-1">
          <span className="text-neutral-400">{t("xpProgressLabel")}</span>
          <span className="text-amber-700 dark:text-gold font-bold">
            {xpPercent}%
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-neutral-700/60 dark:bg-neutral-900/80 border border-neutral-700 dark:border-white/10 overflow-hidden relative">
          <div
            className="h-full w-full origin-left rounded-full bg-gradient-to-r from-primary via-primary-light to-gold transition-transform duration-500 dark:shadow-glow-gold-sm"
            style={{ transform: `scaleX(${xpPercent / 100})` }}
          />
        </div>
      </div>
    </div>
  );
}
