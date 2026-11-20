import { Dices, Sparkles, Ticket, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useMemo } from "react";
import {
  SegmentedControl,
  type SegmentedControlOption,
} from "@/components/ui/SegmentedControl";
import { REWARD_FORM_TYPE_KEYS, REWARD_TYPE_META } from "@/constants/reward";
import type { RewardType } from "@/types/reward";
import { cn } from "@/utils";
import { toRewardTypeMessageKey } from "@/utils/rewardMapper";

interface RewardTypeSelectorProps {
  value: RewardType;
  resolvedTypeKey: string;
  isGamified: boolean;
  disabled: boolean;
  onChange: (type: RewardType) => void;
}

export function RewardTypeSelector({
  value,
  resolvedTypeKey,
  isGamified,
  disabled,
  onChange,
}: RewardTypeSelectorProps) {
  const t = useTranslations("rewards.formModal");
  const tOptions = useTranslations("rewards.options");
  const typeGuideId = useId();

  const segmentedTypeOptions: SegmentedControlOption<RewardType>[] = useMemo(
    () =>
      REWARD_FORM_TYPE_KEYS.map((typeKey) => {
        const meta = REWARD_TYPE_META[typeKey];
        const isMysteryOpt = typeKey === "MysteryBox";
        const Icon = !isGamified && isMysteryOpt ? Dices : meta?.icon;
        const label = isMysteryOpt
          ? isGamified
            ? tOptions("types.MysteryBox")
            : tOptions("types.MysteryBoxProductivity")
          : tOptions(`types.${toRewardTypeMessageKey(typeKey)}`);
        return {
          value: typeKey,
          label,
          icon: Icon,
        };
      }),
    [isGamified, tOptions],
  );

  const typeGuideConfig =
    resolvedTypeKey === "TimeBased"
      ? {
          icon: Ticket,
          badgeClass:
            "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300",
          containerClass:
            "bg-emerald-500/[0.06] border-emerald-500/25 dark:bg-emerald-500/10 dark:border-emerald-500/25",
          title: t("typeGuides.TimeBased.title"),
          description: isGamified
            ? t("typeGuides.TimeBased.descriptionGamified")
            : t("typeGuides.TimeBased.descriptionProductivity"),
        }
      : resolvedTypeKey === "MysteryBox"
        ? {
            icon: isGamified ? Sparkles : Dices,
            badgeClass: isGamified
              ? "bg-amber-500/15 text-amber-700 border-amber-500/35 dark:text-gold"
              : "bg-sky-500/15 text-sky-700 border-sky-500/35 dark:text-sky-300",
            containerClass: isGamified
              ? "bg-amber-500/[0.06] border-amber-500/25 dark:bg-gold/10 dark:border-gold/25"
              : "bg-sky-500/[0.06] border-sky-500/25 dark:bg-sky-500/10 dark:border-sky-400/25",
            title: isGamified
              ? t("typeGuides.MysteryBox.title")
              : t("typeGuides.MysteryBox.titleProductivity"),
            description: isGamified
              ? t("typeGuides.MysteryBox.description")
              : t("typeGuides.MysteryBox.descriptionProductivity"),
          }
        : {
            icon: Zap,
            badgeClass:
              "bg-purple-500/15 text-purple-700 border-purple-500/30 dark:text-purple-300",
            containerClass:
              "bg-purple-500/[0.06] border-purple-500/25 dark:bg-primary/10 dark:border-primary/30",
            title: t("typeGuides.SingleUse.title"),
            description: isGamified
              ? t("typeGuides.SingleUse.descriptionGamified")
              : t("typeGuides.SingleUse.descriptionProductivity"),
          };

  const GuideIcon = typeGuideConfig.icon;

  return (
    <fieldset
      aria-describedby={typeGuideId}
      className="border-0 p-0 m-0 min-w-0"
    >
      <legend className="text-body-s text-neutral-100 font-medium select-none mb-1.5 p-0">
        {t("typeLabel")} <span className="text-gold">*</span>
      </legend>
      <div className="flex flex-col gap-1.5">
        <SegmentedControl<RewardType>
          options={segmentedTypeOptions}
          value={value}
          onChange={onChange}
          disabled={disabled}
          size="md"
          ariaLabel={t("typeLabel")}
        />

        <div
          id={typeGuideId}
          className={cn(
            "flex items-start sm:items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition-colors",
            typeGuideConfig.containerClass,
          )}
        >
          <span
            className={cn(
              "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 sm:mt-0",
              typeGuideConfig.badgeClass,
            )}
            aria-hidden="true"
          >
            <GuideIcon size={12} />
          </span>
          <p className="text-label-g text-neutral-300 leading-snug min-w-0">
            <strong className="font-bold text-neutral-100">
              {typeGuideConfig.title}
            </strong>
            {" · "}
            <span>{typeGuideConfig.description}</span>
          </p>
        </div>
      </div>
    </fieldset>
  );
}
