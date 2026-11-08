"use client";

import { Clock, Sparkles, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { IconPickerPopover } from "@/components/ui/IconPickerPopover";
import { Input } from "@/components/ui/Input";
import { MYSTERY_BOX_PRESETS, REWARD_ICONS } from "@/constants/reward";
import type {
  MysteryBoxLootItem,
  MysteryBoxPresetId,
  PackageLevel,
  Reward,
} from "@/types/reward";
import { cn } from "@/utils";
import {
  getMysteryBoxTier,
  suggestRewardIconFromTitle,
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
}

const MAX_SLOT_NAME_LENGTH = 30;

export function MysteryBoxLootEditor({
  packageLevel,
  lootItems,
  onChangeSlot,
  onApplyPreset,
  existingRewards = [],
  disabled = false,
}: MysteryBoxLootEditorProps) {
  const t = useTranslations("rewards.mysteryBox.lootEditor");
  const tier = getMysteryBoxTier(packageLevel);
  const tierId = tier.id;
  const slotMaxMinutes = tier.slotMaxMinutes;

  const storeCandidates = existingRewards.filter(
    (r) => r.type === "SingleUse" || r.type === "TimeBased",
  );

  const handleSelectPreset = (presetId: MysteryBoxPresetId) => {
    const preset = MYSTERY_BOX_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const tierSlots = preset.tiers[tierId] || preset.tiers.Básico;
    onApplyPreset([
      { ...tierSlots[0] },
      { ...tierSlots[1] },
      { ...tierSlots[2] },
    ]);
    toast.success(
      t("presetAppliedToast", { preset: t(`presets.${presetId}`) }),
    );
  };

  const handlePullFromStore = () => {
    if (storeCandidates.length === 0) {
      toast.info(t("storeEmptyToast"));
      return;
    }

    const sorted = [...storeCandidates].sort((a, b) => a.price - b.price);
    const picked: [MysteryBoxLootItem, MysteryBoxLootItem, MysteryBoxLootItem] =
      [0, 1, 2].map((slotIdx) => {
        const candidate =
          sorted[Math.min(slotIdx, sorted.length - 1)] || sorted[0];
        const maxCap = slotMaxMinutes[slotIdx as 0 | 1 | 2];
        const rawMinutes =
          candidate.type === "TimeBased"
            ? candidate.baseDurationMinutes || 30
            : null;
        const clampedMinutes =
          rawMinutes != null ? Math.min(Math.max(5, rawMinutes), maxCap) : null;

        return {
          name: candidate.title.slice(0, MAX_SLOT_NAME_LENGTH),
          icon: candidate.icon || candidate.iconName || "gift",
          minutes: clampedMinutes,
        };
      }) as [MysteryBoxLootItem, MysteryBoxLootItem, MysteryBoxLootItem];

    onApplyPreset(picked);
    toast.success(t("pulledFromStoreToast"));
  };

  return (
    <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-background border border-neutral-700 dark:bg-surface/30 dark:border-white/10 animate-in fade-in duration-150">
      {/* Cabeçalho + Presets de Estilo de Vida */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Sparkles
              size={14}
              className="text-gold shrink-0"
              aria-hidden="true"
            />
            <span className="text-body-s font-bold text-neutral-100">
              {t("title")}
            </span>
          </div>
          <span className="text-tiny text-neutral-400">{t("subtitle")}</span>
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

          {storeCandidates.length > 0 && (
            <button
              type="button"
              disabled={disabled}
              onClick={handlePullFromStore}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-primary/40 bg-primary/15 hover:bg-primary/25 text-primary dark:text-primary-light hover:text-primary-dark dark:hover:text-neutral-50 text-tiny font-semibold transition-[color,background-color,border-color,transform] cursor-pointer active:scale-95 disabled:opacity-50"
              title={t("pullFromStoreHint")}
            >
              <Store size={11} className="shrink-0" aria-hidden="true" />
              <span>{t("pullFromStore")}</span>
            </button>
          )}
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

          const badgeColor =
            drop?.badgeVariant === "emerald"
              ? "text-emerald-700 bg-emerald-500/15 border-emerald-500/35 dark:text-success-400 dark:bg-success-500/15 dark:border-success-500/30"
              : drop?.badgeVariant === "amber"
                ? "text-amber-700 bg-amber-500/15 border-amber-500/35 dark:text-amber-400 dark:bg-amber-500/15 dark:border-amber-500/30"
                : drop?.badgeVariant === "purple"
                  ? "text-magenta bg-magenta/10 border-magenta/30 dark:bg-magenta/15 dark:border-magenta/30"
                  : "text-amber-700 bg-amber-500/15 border-amber-500/35 dark:text-gold dark:bg-gold/15 dark:border-gold/30";

          return (
            <div
              key={slotIndex}
              className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-card dark:bg-surface/50 border border-neutral-700 dark:border-white/10"
            >
              <div className="flex items-center justify-between gap-2">
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
                  <span>{t(`slotRarity.${slotIndex}`)}</span>
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

              <div className="flex items-center gap-2">
                <IconPickerPopover
                  options={REWARD_ICONS}
                  value={slot.icon || "gift"}
                  onChange={(newIcon) =>
                    onChangeSlot(slotIndex, {
                      ...slot,
                      icon: newIcon,
                    })
                  }
                  disabled={disabled}
                  title={t("iconPickerTitle")}
                />

                <div className="flex-1 min-w-0">
                  <Input
                    id={slotInputId}
                    type="text"
                    value={slot.name}
                    onChange={(e) => {
                      const nextName = e.target.value.slice(
                        0,
                        MAX_SLOT_NAME_LENGTH,
                      );
                      const autoIcon = suggestRewardIconFromTitle(nextName);
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
                    className="h-[38px] text-xs"
                  />
                </div>

                {isTimeBased && (
                  <div className="w-24 shrink-0">
                    <label htmlFor={slotMinutesId} className="sr-only">
                      {t("minutesAriaLabel", { max: maxCap })}
                    </label>
                    <Input
                      id={slotMinutesId}
                      type="number"
                      min={5}
                      max={maxCap}
                      step={5}
                      value={String(slot.minutes ?? Math.min(15, maxCap))}
                      onChange={(e) => {
                        const raw = parseInt(e.target.value, 10);
                        const clamped = Number.isNaN(raw)
                          ? 5
                          : Math.min(Math.max(1, raw), maxCap);
                        onChangeSlot(slotIndex, {
                          ...slot,
                          minutes: clamped,
                        });
                      }}
                      onBlur={() => {
                        const current = slot.minutes ?? 15;
                        const clamped = Math.min(Math.max(5, current), maxCap);
                        if (clamped !== slot.minutes) {
                          onChangeSlot(slotIndex, {
                            ...slot,
                            minutes: clamped,
                          });
                        }
                      }}
                      compact
                      disabled={disabled}
                      className="h-[38px] text-xs font-bold text-center"
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
