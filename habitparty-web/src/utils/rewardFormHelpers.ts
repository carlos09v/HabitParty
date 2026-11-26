import type { EditableGroupVariant } from "@/components/reward/form/RewardGroupPackagesEditor";
import { getLocalizedDefaultMysteryBoxLoot } from "@/constants/mysteryBox";
import { COUPON_PACKAGE_OPTIONS } from "@/constants/reward";
import type { AppLocale } from "@/i18n/config";
import type {
  CreateRewardDTO,
  MysteryBoxLootItem,
  MysteryBoxTier,
  PackageLevel,
  PackageMessageKey,
  RewardCategory,
  RewardGroupContext,
  RewardType,
  UpdateRewardGroupDTO,
} from "@/types/reward";
import { formatFocusMinutes } from "@/utils/focusFormatters";
import {
  parseLocalizedPrice,
  resolveSuggestedPackagePrice,
} from "@/utils/rewardEconomy";
import {
  buildRewardVariantTitle,
  extractRewardGroupBaseTitle,
} from "@/utils/rewardGrouping";
import {
  getMysteryBoxTier,
  mapRewardFormToCreatePayload,
  type RewardFormInput,
  toCategoryMessageKey,
  toPackageMessageKey,
  toRewardTypeMessageKey,
  UI_TO_BACKEND_CATEGORY,
  UI_TO_BACKEND_PACKAGE,
} from "@/utils/rewardMapper";

export type LootTuple = [
  MysteryBoxLootItem,
  MysteryBoxLootItem,
  MysteryBoxLootItem,
];

export const MAX_REWARD_TITLE_LENGTH = 30;

export function createDefaultLootTuple(
  tierId: MysteryBoxTier["id"] = "Básico",
  locale: AppLocale = "pt-BR",
): LootTuple {
  const source = getLocalizedDefaultMysteryBoxLoot(tierId, locale);
  return [{ ...source[0] }, { ...source[1] }, { ...source[2] }];
}

/**
 * Monta o título pré-preenchido para um novo pacote sem truncar o nome-base
 * quando isso quebraria a chave de agrupamento com os pacotes existentes.
 */
export function buildPrefillPackageTitle(
  baseTitle: string,
  durationMinutes?: number | null,
  maxLength = MAX_REWARD_TITLE_LENGTH,
): string {
  const cleanBase = baseTitle.trim().replace(/\s+/g, " ");
  if (!cleanBase) return "";
  if (!durationMinutes || durationMinutes <= 0) {
    return cleanBase.slice(0, maxLength).trim();
  }
  const suffix = ` (${formatFocusMinutes(durationMinutes)})`;
  if (cleanBase.length + suffix.length <= maxLength) {
    return `${cleanBase}${suffix}`;
  }
  return cleanBase.slice(0, maxLength).trim();
}

export function buildGroupUpdateDto(params: {
  groupToEdit: RewardGroupContext;
  groupVariants: EditableGroupVariant[];
  title: string;
  description: string;
  selectedIcon: string;
  type: RewardType;
  category: RewardCategory;
  formatPackageLabel?: (pkgKey: PackageMessageKey) => string;
}):
  | { ok: true; dto: UpdateRewardGroupDTO }
  | {
      ok: false;
      errorKey:
        | "batchPackagesRequired"
        | "invalidPrice"
        | "duplicatePackageTierError";
    } {
  const {
    groupToEdit,
    groupVariants,
    title,
    description,
    selectedIcon,
    type,
    category,
    formatPackageLabel,
  } = params;

  if (groupVariants.length === 0) {
    return { ok: false, errorKey: "batchPackagesRequired" };
  }

  const isTimeBasedGroup = toRewardTypeMessageKey(type) === "TimeBased";
  const parsedVariants = groupVariants.map((variant) => ({
    variant,
    numericPrice: parseLocalizedPrice(variant.price),
    numericDuration: isTimeBasedGroup
      ? Math.max(
          5,
          Math.min(1440, Number.parseInt(variant.durationMinutes, 10) || 30),
        )
      : undefined,
  }));

  if (
    parsedVariants.some(
      (item) => Number.isNaN(item.numericPrice) || item.numericPrice <= 0,
    )
  ) {
    return { ok: false, errorKey: "invalidPrice" };
  }

  const seenNamedPkgKeys = new Set<string>();
  for (const { variant } of parsedVariants) {
    const pkgKey = toPackageMessageKey(variant.packageLevel);
    if (pkgKey !== "NONE") {
      if (seenNamedPkgKeys.has(pkgKey)) {
        return { ok: false, errorKey: "duplicatePackageTierError" };
      }
      seenNamedPkgKeys.add(pkgKey);
    }
  }

  const getLocalizedTierSuffix = (variant: EditableGroupVariant) => {
    const pkgKey = toPackageMessageKey(variant.packageLevel);
    if (pkgKey === "NONE") return "";
    return formatPackageLabel
      ? formatPackageLabel(pkgKey)
      : String(variant.packageLevel);
  };

  const rawSuffixes = parsedVariants.map(({ variant, numericDuration }) => {
    if (isTimeBasedGroup && numericDuration) {
      return ` (${formatFocusMinutes(numericDuration)})`;
    }
    const pkgKey = toPackageMessageKey(variant.packageLevel);
    const origKey = toPackageMessageKey(variant.originalPackageLevel);
    if (pkgKey === origKey && variant.originalSuffix) {
      return variant.originalSuffix;
    }
    const label = getLocalizedTierSuffix(variant);
    return label ? ` - ${label}` : "";
  });

  const suffixCounts = new Map<string, number>();
  for (const s of rawSuffixes) {
    suffixCounts.set(s, (suffixCounts.get(s) ?? 0) + 1);
  }

  const finalSuffixes = rawSuffixes.map((raw, idx) => {
    const variant = parsedVariants[idx].variant;
    if (
      isTimeBasedGroup &&
      (suffixCounts.get(raw) ?? 0) > 1 &&
      toPackageMessageKey(variant.packageLevel) !== "NONE"
    ) {
      return ` - ${getLocalizedTierSuffix(variant)}${raw}`;
    }
    return raw;
  });

  const maxSuffixLength = finalSuffixes.reduce(
    (max, suffix) => Math.max(max, suffix.length),
    0,
  );
  const sharedBase = title
    .trim()
    .slice(0, Math.max(1, MAX_REWARD_TITLE_LENGTH - maxSuffixLength))
    .trim();

  return {
    ok: true,
    dto: {
      sourceRewardIds: groupToEdit.variants.map((v) => v.id),
      baseName: title.trim().slice(0, MAX_REWARD_TITLE_LENGTH),
      icon: selectedIcon,
      description: description.trim(),
      category: UI_TO_BACKEND_CATEGORY[category] || "NONE",
      variants: parsedVariants.map(
        ({ variant, numericPrice, numericDuration }, idx) => ({
          ...(variant.id ? { id: variant.id } : {}),
          name: buildRewardVariantTitle(
            sharedBase,
            finalSuffixes[idx],
            MAX_REWARD_TITLE_LENGTH,
          ),
          price: numericPrice,
          packageLevel:
            UI_TO_BACKEND_PACKAGE[variant.packageLevel || "Nenhum"] || "NONE",
          baseDurationMinutes: numericDuration,
        }),
      ),
      deleteRemovedHistory: false,
    },
  };
}

export function buildBatchCouponPayloads(params: {
  title: string;
  description: string;
  category: RewardCategory;
  selectedIcon: string;
  selectedBatchPackages: PackageLevel[];
  usedPackageKeys: Set<PackageMessageKey>;
}): { baseName: string; payloads: CreateRewardDTO[] } {
  const selectedOptions = COUPON_PACKAGE_OPTIONS.filter((opt) => {
    const optKey = toPackageMessageKey(opt.id);
    return (
      opt.id !== "Nenhum" &&
      !params.usedPackageKeys.has(optKey) &&
      params.selectedBatchPackages.some(
        (selected) => toPackageMessageKey(selected) === optKey,
      )
    );
  });

  const baseName =
    extractRewardGroupBaseTitle(params.title) || params.title.trim();
  const optionVariants = selectedOptions.map((opt) => ({
    opt,
    suffix: opt.suggestedMinutes
      ? ` (${formatFocusMinutes(opt.suggestedMinutes)})`
      : ` - ${opt.id}`,
  }));

  // Truncar a base pelo maior sufixo selecionado garante que todo o lote compartilhe o mesmo prefixo ao agrupar na vitrine
  const maxSuffixLength = optionVariants.reduce(
    (max, item) => Math.max(max, item.suffix.length),
    0,
  );
  const safeBase = baseName
    .slice(0, Math.max(1, MAX_REWARD_TITLE_LENGTH - maxSuffixLength))
    .trim();

  const payloads = optionVariants.map(({ opt, suffix }) =>
    mapRewardFormToCreatePayload({
      title: `${safeBase}${suffix}`,
      description: params.description.trim(),
      price: resolveSuggestedPackagePrice(opt, params.category),
      type: "TimeBased",
      category: params.category,
      packageLevel: opt.id,
      baseDurationMinutes: opt.suggestedMinutes ?? 30,
      icon: params.selectedIcon,
    }),
  );

  return { baseName, payloads };
}

export function buildSingleRewardFormInput(params: {
  title: string;
  description: string;
  numericPrice: number;
  type: RewardType;
  category: RewardCategory;
  packageLevel: PackageLevel;
  baseDurationMinutes: string;
  selectedIcon: string;
  lootItems: LootTuple;
  locale?: AppLocale;
}): RewardFormInput {
  const isDebtSubmission = toCategoryMessageKey(params.category) === "DEBT";
  const parsedDuration =
    params.type === "TimeBased"
      ? Math.min(
          1440,
          Math.max(5, Number.parseInt(params.baseDurationMinutes, 10) || 30),
        )
      : undefined;

  const tier = getMysteryBoxTier(params.packageLevel);
  const tierDefaultLoot = getLocalizedDefaultMysteryBoxLoot(
    tier.id,
    params.locale ?? "pt-BR",
  );

  const normalizedLootItems =
    params.type === "MysteryBox"
      ? params.lootItems.map((slot, idx) => {
          const slotIdx = idx as 0 | 1 | 2;
          const tierCap = tier.slotMaxMinutes[slotIdx];
          const normalizedCategory = slot.category?.trim() || undefined;
          const normalizedDescription = slot.description?.trim() || undefined;
          return {
            name: slot.name.trim() || tierDefaultLoot[slotIdx].name,
            icon: slot.icon || "gift",
            minutes:
              slot.minutes && slot.minutes > 0
                ? Math.min(Math.max(5, slot.minutes), tierCap)
                : null,
            ...(normalizedCategory ? { category: normalizedCategory } : {}),
            ...(normalizedDescription
              ? { description: normalizedDescription }
              : {}),
          };
        })
      : undefined;

  return {
    title: params.title.trim(),
    description: params.description.trim(),
    price: params.numericPrice,
    type: params.type,
    category: params.category,
    packageLevel: isDebtSubmission ? "Nenhum" : params.packageLevel,
    baseDurationMinutes: parsedDuration,
    icon: params.selectedIcon,
    lootItems: normalizedLootItems,
  };
}
