import { Clock, Dices, Sparkles, Store } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type MutableRefObject, useMemo, useState } from "react";
import { toast } from "sonner";
import { IconPickerPopover } from "@/components/ui/IconPickerPopover";
import { Input } from "@/components/ui/Input";
import {
  getLocalizedDefaultMysteryBoxLoot,
  getLocalizedMysteryBoxPresetSlots,
} from "@/constants/mysteryBox";
import {
  getMysteryBadgeVariantClass,
  MYSTERY_BOX_PRESETS,
  REWARD_ICONS,
} from "@/constants/reward";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import { useUserStore } from "@/store/userStore";
import type {
  MysteryBoxLootItem,
  MysteryBoxPresetId,
  PackageLevel,
  Reward,
} from "@/types/reward";
import { cn } from "@/utils";
import { isDebtReward } from "@/utils/rewardGrouping";
import {
  getMysteryBoxTier,
  suggestRewardIconFromTitle,
  UI_TO_BACKEND_CATEGORY,
} from "@/utils/rewardMapper";

interface MysteryBoxLootEditorProps {
  packageLevel: PackageLevel;
  lootItems: readonly [
    MysteryBoxLootItem,
    MysteryBoxLootItem,
    MysteryBoxLootItem,
  ];
  onChangeSlot: (index: 0 | 1 | 2, updated: MysteryBoxLootItem) => void;
  onApplyPreset: (
    presetItems: readonly [
      MysteryBoxLootItem,
      MysteryBoxLootItem,
      MysteryBoxLootItem,
    ],
  ) => void;
  existingRewards?: Reward[];
  disabled?: boolean;
  slotInputRefs?: MutableRefObject<Array<HTMLInputElement | null>>;
}

const MAX_SLOT_NAME_LENGTH = 30;

export function MysteryBoxLootEditor({
  packageLevel,
  lootItems,
  onChangeSlot,
  onApplyPreset,
  existingRewards = [],
  disabled = false,
  slotInputRefs,
}: MysteryBoxLootEditorProps) {
  const t = useTranslations("rewards.mysteryBox.lootEditor");
  const locale = useLocale() as AppLocale;
  const isPremium = useUserStore((s) => s.is_Premium);
  const { isGamified } = useExperienceMode();
  const tier = getMysteryBoxTier(packageLevel);
  const tierId = tier.id;
  const slotMaxMinutes = tier.slotMaxMinutes;
  const [manualIconSlots, setManualIconSlots] = useState<
    [boolean, boolean, boolean]
  >([false, false, false]);
  const [draftMinutesBySlot, setDraftMinutesBySlot] = useState<
    [string | null, string | null, string | null]
  >([null, null, null]);

  const { storeCandidates, hasAnyStoreRewards } = useMemo(() => {
    const eligibleRegular = existingRewards.filter(
      (r) =>
        !isDebtReward(r) && (r.type === "SingleUse" || r.type === "TimeBased"),
    );
    const candidates = eligibleRegular.filter(
      (r) => r.price > 0 && r.price <= tier.recommendedPrice * 2,
    );
    return {
      storeCandidates: candidates,
      hasAnyStoreRewards: eligibleRegular.length > 0,
    };
  }, [existingRewards, tier.recommendedPrice]);

  const handleSelectPreset = (presetId: MysteryBoxPresetId) => {
    const preset = MYSTERY_BOX_PRESETS.find((p) => p.id === presetId);
    const tierSlots = getLocalizedMysteryBoxPresetSlots(
      presetId,
      tierId,
      locale,
    );
    if (!preset || !tierSlots) return;
    const presetCategory = UI_TO_BACKEND_CATEGORY[preset.category];
    setManualIconSlots([false, false, false]);
    setDraftMinutesBySlot([null, null, null]);
    onApplyPreset([
      { ...tierSlots[0], category: tierSlots[0].category ?? presetCategory },
      { ...tierSlots[1], category: tierSlots[1].category ?? presetCategory },
      { ...tierSlots[2], category: tierSlots[2].category ?? presetCategory },
    ]);
  };

  const handlePullFromStore = () => {
    if (storeCandidates.length === 0) {
      toast.info(
        hasAnyStoreRewards
          ? t(
              isGamified
                ? "storeNoCompatibleToast"
                : "storeNoCompatibleToastProductivity",
              { max: tier.recommendedPrice * 2 },
            )
          : t("storeEmptyToast"),
      );
      return;
    }

    // Seleciona itens distintos mais próximos dos 3 degraus de valor do tier (0.7x, 1.0x, 1.6x) sem duplicar
    const targets = [
      tier.recommendedPrice * 0.7,
      tier.recommendedPrice,
      tier.recommendedPrice * 1.6,
    ];
    const remaining = [...storeCandidates];
    const chosenRewards: Array<Reward | null> = [null, null, null];

    for (let slotIdx = 0; slotIdx < 3; slotIdx += 1) {
      if (remaining.length === 0) break;
      const targetPrice = targets[slotIdx];
      let bestIdx = 0;
      let bestDist = Math.abs(remaining[0].price - targetPrice);
      for (let i = 1; i < remaining.length; i += 1) {
        const dist = Math.abs(remaining[i].price - targetPrice);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }
      chosenRewards[slotIdx] = remaining.splice(bestIdx, 1)[0];
    }

    // Ordena os escolhidos em ordem crescente de preço (comum -> raro -> jackpot)
    const orderedChosen = chosenRewards
      .filter((item): item is Reward => item !== null)
      .sort((a, b) => a.price - b.price);
    const tierDefaults = getLocalizedDefaultMysteryBoxLoot(tierId, locale);

    const picked: [MysteryBoxLootItem, MysteryBoxLootItem, MysteryBoxLootItem] =
      ([0, 1, 2] as const).map((slotIdx) => {
        const candidate = orderedChosen[slotIdx];
        if (!candidate) {
          return { ...tierDefaults[slotIdx] };
        }
        const maxCap = slotMaxMinutes[slotIdx];
        const rawMinutes =
          candidate.type === "TimeBased"
            ? candidate.baseDurationMinutes || 30
            : null;
        const clampedMinutes =
          rawMinutes != null ? Math.min(Math.max(5, rawMinutes), maxCap) : null;

        return {
          name: candidate.title.slice(0, MAX_SLOT_NAME_LENGTH),
          icon: candidate.icon || "gift",
          minutes: clampedMinutes,
          category: UI_TO_BACKEND_CATEGORY[candidate.category] || undefined,
          description: candidate.description?.trim() || undefined,
        };
      }) as [MysteryBoxLootItem, MysteryBoxLootItem, MysteryBoxLootItem];

    setManualIconSlots([false, false, false]);
    setDraftMinutesBySlot([null, null, null]);
    onApplyPreset(picked);
    toast.success(t("pulledFromStoreToast"));
  };

  return (
    <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-background border border-neutral-700 dark:bg-surface/30 dark:border-white/10 animate-in fade-in duration-150">
      {/* Cabeçalho + Presets de Estilo de Vida */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <div className="flex items-center gap-1.5">
              {isGamified ? (
                <Sparkles
                  size={14}
                  className="text-gold shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <Dices
                  size={14}
                  className="text-sky-700 dark:text-sky-400 shrink-0"
                  aria-hidden="true"
                />
              )}
              <span className="text-body-s font-bold text-neutral-100">
                {isGamified ? t("title") : t("titleProductivity")}
              </span>
            </div>
            <span className="text-tiny text-neutral-400">
              <span aria-hidden="true">• </span>
              {isGamified ? t("subtitle") : t("subtitleProductivity")}
            </span>
          </div>

          {hasAnyStoreRewards && (
            <button
              type="button"
              disabled={disabled}
              onClick={handlePullFromStore}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-primary/40 bg-primary/15 hover:bg-primary/25 text-primary dark:text-primary-light hover:text-primary-dark dark:hover:text-neutral-50 text-tiny font-semibold transition-[color,background-color,border-color,transform] cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
              title={t("pullFromStoreHint")}
            >
              <Store size={11} className="shrink-0" aria-hidden="true" />
              <span>{t("pullFromStore")}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-tiny font-semibold text-neutral-400 mr-0.5">
            {t("presetsLabel")}
          </span>
          {MYSTERY_BOX_PRESETS.map((preset) => {
            const PresetIcon = preset.icon;
            return (
              <button
                key={preset.id}
                type="button"
                disabled={disabled}
                onClick={() => handleSelectPreset(preset.id)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-neutral-700 bg-card hover:bg-amber-500/15 hover:border-amber-500/45 hover:text-amber-800 dark:border-white/10 dark:bg-white/5 dark:hover:bg-gold/15 dark:hover:border-gold/40 dark:hover:text-gold text-neutral-200 text-tiny font-semibold transition-[color,background-color,border-color,transform] cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <PresetIcon size={11} className="shrink-0" aria-hidden="true" />
                <span>{t(`presets.${preset.id}`)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3 Slots de Raridade */}
      <div className="flex flex-col gap-2">
        {([0, 1, 2] as const).map((slotIndex) => {
          const slot = lootItems[slotIndex];
          const drop = tier.dropRates[slotIndex];
          const maxCap = slotMaxMinutes[slotIndex];
          const isTimeBased =
            slot.minutes !== null &&
            slot.minutes !== undefined &&
            slot.minutes > 0;
          const slotInputId = `mystery-slot-name-${slotIndex}`;
          const slotMinutesId = `mystery-slot-min-${slotIndex}`;

          const badgeColor = getMysteryBadgeVariantClass(drop?.badgeVariant);

          return (
            <div
              key={slotIndex}
              className="flex flex-col gap-1.5 p-2 rounded-xl bg-card dark:bg-surface/50 border border-neutral-700 dark:border-white/10"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label
                  htmlFor={slotInputId}
                  className="flex items-center gap-1.5 text-tiny font-bold text-neutral-200 cursor-pointer"
                >
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded border font-black tabular-nums leading-none",
                      badgeColor,
                    )}
                  >
                    {drop?.percentage ?? 33}%
                  </span>
                  <span>
                    {t(
                      isGamified
                        ? `slotRarity.${slotIndex}`
                        : `slotRarityProductivity.${slotIndex}`,
                    )}
                  </span>
                </label>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={disabled}
                    aria-pressed={!isTimeBased}
                    onClick={() =>
                      onChangeSlot(slotIndex, {
                        ...slot,
                        minutes: null,
                      })
                    }
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer",
                      !isTimeBased
                        ? "bg-primary/15 border-primary text-primary-dark dark:bg-primary/25 dark:text-neutral-50"
                        : "bg-surface dark:bg-white/5 border-neutral-700 dark:border-white/10 text-neutral-400 hover:text-neutral-200",
                    )}
                  >
                    {t("modeSingleUse")}
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    aria-pressed={isTimeBased}
                    onClick={() =>
                      onChangeSlot(slotIndex, {
                        ...slot,
                        minutes: isTimeBased
                          ? slot.minutes
                          : Math.min(30, maxCap),
                      })
                    }
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer inline-flex items-center gap-1",
                      isTimeBased
                        ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:bg-emerald-500/20 dark:border-emerald-500/60 dark:text-emerald-300"
                        : "bg-surface dark:bg-white/5 border-neutral-700 dark:border-white/10 text-neutral-400 hover:text-neutral-200",
                    )}
                  >
                    <Clock size={10} aria-hidden="true" />
                    <span>{t("modeTimeBased", { max: maxCap })}</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <IconPickerPopover
                  options={REWARD_ICONS}
                  value={slot.icon || "gift"}
                  onChange={(newIcon) => {
                    setManualIconSlots((prev) => {
                      const next: [boolean, boolean, boolean] = [...prev];
                      next[slotIndex] = true;
                      return next;
                    });
                    onChangeSlot(slotIndex, {
                      ...slot,
                      icon: newIcon,
                    });
                  }}
                  disabled={disabled}
                  title={t("iconPickerTitle")}
                  className="h-[36px] px-2.5"
                />

                <div className="flex-1 min-w-[140px]">
                  <Input
                    ref={(el) => {
                      if (slotInputRefs) {
                        slotInputRefs.current[slotIndex] = el;
                      }
                    }}
                    id={slotInputId}
                    type="text"
                    value={slot.name}
                    onChange={(e) => {
                      const nextName = e.target.value.slice(
                        0,
                        MAX_SLOT_NAME_LENGTH,
                      );
                      const autoIcon = !manualIconSlots[slotIndex]
                        ? suggestRewardIconFromTitle(nextName, isPremium)
                        : null;
                      onChangeSlot(slotIndex, {
                        ...slot,
                        name: nextName,
                        icon: autoIcon || slot.icon || "gift",
                      });
                    }}
                    placeholder={t(`slotPlaceholder.${slotIndex}`)}
                    compact
                    maxLength={MAX_SLOT_NAME_LENGTH}
                    disabled={disabled}
                    required
                    className="h-[36px] text-xs"
                  />
                </div>

                {isTimeBased && (
                  <div className="w-full sm:w-24 sm:shrink-0">
                    <label htmlFor={slotMinutesId} className="sr-only">
                      {t("minutesAriaLabel", { max: maxCap })}
                    </label>
                    <Input
                      id={slotMinutesId}
                      type="number"
                      min={5}
                      max={maxCap}
                      step={5}
                      value={
                        draftMinutesBySlot[slotIndex] ??
                        String(slot.minutes ?? Math.min(15, maxCap))
                      }
                      onChange={(e) => {
                        const rawText = e.target.value;
                        setDraftMinutesBySlot((prev) => {
                          const next: [
                            string | null,
                            string | null,
                            string | null,
                          ] = [...prev];
                          next[slotIndex] = rawText;
                          return next;
                        });
                        const raw = Number.parseInt(rawText, 10);
                        if (!Number.isNaN(raw) && raw >= 1) {
                          onChangeSlot(slotIndex, {
                            ...slot,
                            minutes: Math.min(raw, maxCap),
                          });
                        }
                      }}
                      onBlur={() => {
                        const draft = draftMinutesBySlot[slotIndex];
                        const parsed =
                          draft !== null
                            ? Number.parseInt(draft, 10)
                            : (slot.minutes ?? 15);
                        const clamped = Number.isFinite(parsed)
                          ? Math.min(Math.max(5, parsed), maxCap)
                          : Math.min(15, maxCap);
                        setDraftMinutesBySlot((prev) => {
                          const next: [
                            string | null,
                            string | null,
                            string | null,
                          ] = [...prev];
                          next[slotIndex] = null;
                          return next;
                        });
                        if (clamped !== slot.minutes) {
                          onChangeSlot(slotIndex, {
                            ...slot,
                            minutes: clamped,
                          });
                        }
                      }}
                      compact
                      disabled={disabled}
                      className="h-[36px] text-xs font-bold text-center"
                      title={t("minutesMaxHint", { max: maxCap })}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
