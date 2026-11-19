import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

export function XpSourcesGuideTooltip({
  isGamified = false,
}: {
  isGamified?: boolean;
}) {
  const t = useTranslations("showcase.progression.sourcesGuide");

  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-xs font-semibold text-neutral-300">
        {t(isGamified ? "title" : "titleEssential")}
      </span>
      <InfoTooltip
        title={t("tooltipTitle")}
        icon={
          <Sparkles
            size={14}
            className="text-amber-700 dark:text-gold shrink-0"
          />
        }
        ariaLabel={t(isGamified ? "tooltipAria" : "tooltipAriaEssential")}
        size={15}
      >
        <p className="text-neutral-300 leading-relaxed mb-2 text-xs">
          {t(isGamified ? "tooltipIntro" : "tooltipIntroEssential")}
        </p>
        <ul className="flex flex-col gap-1.5 text-neutral-300 text-xs">
          <li>
            <strong className="text-neutral-100">{t("tasksLabel")}</strong>{" "}
            {t(isGamified ? "tasksDesc" : "tasksDescEssential")}
          </li>
          <li>
            <strong className="text-magenta">{t("dailiesLabel")}</strong>{" "}
            {t(isGamified ? "dailiesDesc" : "dailiesDescEssential")}
          </li>
          <li>
            <strong className="text-sky-600 dark:text-sky-300">
              {t("habitsLabel")}
            </strong>{" "}
            {t(isGamified ? "habitsDesc" : "habitsDescEssential")}
          </li>
          <li>
            <strong className="text-emerald-700 dark:text-emerald-300">
              {t("focusLabel")}
            </strong>{" "}
            {t(isGamified ? "focusDesc" : "focusDescEssential")}
          </li>
        </ul>
        <p className="text-amber-700 dark:text-gold text-xs font-medium pt-2 mt-2 border-t border-neutral-700 dark:border-white/10">
          {t(isGamified ? "noSpendNote" : "noSpendNoteEssential")}
        </p>
      </InfoTooltip>
    </div>
  );
}
