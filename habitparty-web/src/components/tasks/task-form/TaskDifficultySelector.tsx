import { Gauge, Sword, Swords } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Select } from "@/components/ui/Select";
import {
  DIFFICULTY_DOT_COLORS,
  DIFFICULTY_REWARDS,
  DIFFICULTY_SWORD_COLORS,
  TASK_DIFFICULTY_META,
  TASK_DIFFICULTY_OPTIONS,
} from "@/constants/task";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import type { TaskDifficultyOption } from "@/types/task";
import { cn } from "@/utils";
import { formatCoins } from "@/utils/economy";

interface TaskDifficultySelectorProps {
  value: TaskDifficultyOption;
  onChange: (value: TaskDifficultyOption) => void;
  disabled?: boolean;
}

export function TaskDifficultySelector({
  value,
  onChange,
  disabled = false,
}: TaskDifficultySelectorProps) {
  const t = useTranslations("tasks.taskModal.basicFields");
  const tOptions = useTranslations("tasks.options");
  const locale = useLocale() as AppLocale;
  const { isGamified } = useExperienceMode();

  return (
    <Select
      label={
        <div className="flex items-center justify-between w-full gap-2">
          <span className="text-body-s text-neutral-100 font-medium">
            {isGamified ? t("difficultyLabel") : t("effortLabel")}
          </span>
          <InfoTooltip
            title={
              isGamified ? t("difficultyTooltipTitle") : t("effortTooltipTitle")
            }
            icon={
              isGamified ? (
                <Swords size={14} className="text-gold shrink-0" />
              ) : (
                <Gauge size={14} className="text-gold shrink-0" />
              )
            }
            triggerLabel={t("stillInDoubt")}
            align="right"
            ariaLabel={
              isGamified ? t("difficultyTooltipAria") : t("effortTooltipAria")
            }
          >
            <p className="text-neutral-300 leading-relaxed text-label-g">
              {isGamified
                ? t("difficultyTooltipIntro")
                : t("effortTooltipIntro")}
            </p>

            <ul className="flex flex-col gap-1.5 py-1 text-label-g text-neutral-200">
              {TASK_DIFFICULTY_OPTIONS.map((opt) => {
                const meta = TASK_DIFFICULTY_META[opt.id];
                const reward = DIFFICULTY_REWARDS[opt.id];
                const coinsFormatted = formatCoins(reward.gold, { locale });
                const DifficultyIcon =
                  opt.id === "MEDIUM" || opt.id === "HARD" ? Swords : Sword;
                return (
                  <li key={opt.id} className="flex items-start gap-1.5">
                    <span
                      className={cn(
                        "font-bold shrink-0 flex items-center gap-1.5",
                        meta.color,
                      )}
                    >
                      {isGamified ? (
                        <DifficultyIcon
                          size={12}
                          className={cn(
                            "shrink-0",
                            DIFFICULTY_SWORD_COLORS[opt.id],
                          )}
                        />
                      ) : (
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            DIFFICULTY_DOT_COLORS[opt.id],
                          )}
                        />
                      )}
                      {tOptions(`difficulties.${opt.id}`)}:
                    </span>
                    <span className="text-neutral-300">
                      {isGamified && (
                        <>
                          <strong className="text-neutral-100">
                            +{reward.xp} XP • +{coinsFormatted} 🪙
                          </strong>{" "}
                          —{" "}
                        </>
                      )}
                      {t(`difficultyDescriptions.${opt.id}`)}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="text-tiny text-neutral-300 bg-white/5 rounded-md p-2 border border-white/10">
              <strong className="text-gold block mb-0.5">
                {t("difficultyGuideTitle")}
              </strong>
              {t.rich("difficultyGuideTrivial", {
                bold: (chunks) => <strong>{chunks}</strong>,
              })}
              <br />
              {t.rich("difficultyGuideEasy", {
                bold: (chunks) => <strong>{chunks}</strong>,
              })}
              <br />
              {t.rich("difficultyGuideMedium", {
                bold: (chunks) => <strong>{chunks}</strong>,
              })}
              <br />
              {t.rich("difficultyGuideHard", {
                bold: (chunks) => <strong>{chunks}</strong>,
              })}
            </div>
          </InfoTooltip>
        </div>
      }
      options={TASK_DIFFICULTY_OPTIONS.map((opt) => {
        const DifficultyIcon =
          opt.id === "MEDIUM" || opt.id === "HARD" ? Swords : Sword;
        return {
          value: opt.id,
          label: tOptions(`difficulties.${opt.id}`),
          icon: isGamified ? (
            <DifficultyIcon
              size={14}
              className={cn(
                "shrink-0",
                DIFFICULTY_SWORD_COLORS[opt.id] || "text-neutral-400",
              )}
            />
          ) : (
            <span
              className={cn(
                "w-2.5 h-2.5 rounded-full shrink-0",
                DIFFICULTY_DOT_COLORS[opt.id] || "bg-neutral-400",
              )}
            />
          ),
        };
      })}
      value={value}
      onChange={(val) => onChange(val as TaskDifficultyOption)}
      disabled={disabled}
      compact
    />
  );
}
