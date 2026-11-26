import { Award } from "lucide-react";
import { useTranslations } from "next-intl";
import { AchievementIcon } from "@/components/showcase/AchievementIcon";
import type { RarityThemeTokens } from "@/constants/achievements";
import type { AchievementItemResponseDTO } from "@/types/showcase";
import { cn } from "@/utils/cn";

interface LinkedAchievementCardProps {
  achievement?: AchievementItemResponseDTO;
  theme: RarityThemeTokens | null;
  copy: { title: string; description: string } | null;
}

export function LinkedAchievementCard({
  achievement,
  theme,
  copy,
}: LinkedAchievementCardProps) {
  const t = useTranslations("showcase.progression.achievement");
  const tRarities = useTranslations("showcase.rarities");

  return (
    <section
      className={cn(
        "rounded-2xl border p-5 flex flex-col gap-3",
        theme
          ? cn(theme.cardBorder, theme.cardGlow, "bg-card dark:bg-surface/65")
          : "border-neutral-700 dark:border-primary/30 bg-card dark:bg-surface/65",
      )}
    >
      <div className="flex items-center gap-2">
        <Award
          size={16}
          className="text-amber-700 dark:text-gold shrink-0"
          aria-hidden="true"
        />
        <h3 className="text-sm font-black text-neutral-100">{t("title")}</h3>
      </div>

      {achievement && theme && copy ? (
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border",
              achievement.unlocked
                ? cn(theme.iconBg, theme.iconText, theme.cardBorder)
                : "bg-surface/70 border-neutral-700 text-neutral-400",
            )}
          >
            <AchievementIcon iconKey={achievement.iconName} size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-extrabold text-neutral-100 truncate">
                {copy.title}
              </span>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                  theme.badgeBg,
                  theme.badgeText,
                  theme.badgeBorder,
                )}
              >
                {tRarities(achievement.rarity)}
              </span>
            </div>

            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              {copy.description}
            </p>

            <div className="flex items-center justify-between gap-2 mt-2 text-[11px] font-bold">
              <span
                className={
                  achievement.unlocked
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-neutral-400"
                }
              >
                {achievement.unlocked ? t("unlockedStatus") : t("lockedStatus")}
              </span>
              <span className="text-amber-700 dark:text-gold tabular-nums">
                {t("pointsValue", {
                  points: achievement.points,
                })}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-neutral-400 leading-relaxed">
          {t("noAchievementRank")}
        </p>
      )}
    </section>
  );
}
