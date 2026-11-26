import { Dices, type LucideIcon } from "lucide-react";
import {
  PACKAGE_LEVEL_COLOR,
  PACKAGE_LEVEL_GLOW,
  PACKAGE_LEVEL_ICON_THEME,
  REWARD_TYPE_META,
} from "@/constants/reward";
import type { AppLocale } from "@/i18n/config";
import type {
  CategoryMessageKey,
  MysteryBoxTier,
  PackageMessageKey,
  RewardType,
  RewardTypeMessageKey,
  RewardTypeMeta,
} from "@/types/reward";
import { formatCoins } from "@/utils/economy";
import {
  getMysteryBoxTier,
  getRewardIcon,
  isMysteryBoxReward,
  toCategoryMessageKey,
  toPackageMessageKey,
  toRewardTypeMessageKey,
} from "./rewardMapper";

const RARITY_TOP_BAR: Partial<Record<PackageMessageKey, string>> = {
  LEGENDARY: "via-amber-500 dark:via-gold opacity-90",
  EPIC: "via-magenta opacity-90",
  PREMIUM: "via-sky-500 dark:via-info opacity-90",
  BASIC: "via-emerald-500 dark:via-success-500 opacity-85",
};

const RARITY_LEFT_ACCENT: Partial<Record<PackageMessageKey, string>> = {
  LEGENDARY: "border-l-4 border-l-gold",
  EPIC: "border-l-4 border-l-magenta",
  PREMIUM: "border-l-4 border-l-info",
  BASIC: "border-l-4 border-l-success-500",
};

export interface CatalogItemVisualInput {
  type: string;
  iconName?: string | null;
  packageLevel?: string | null;
  category?: string | null;
  isActiveFocusSession?: boolean;
  includeMysteryTier?: boolean;
}

export interface CatalogItemVisuals {
  typeKey: RewardTypeMessageKey;
  typeMeta: RewardTypeMeta | undefined;
  RewardIcon: LucideIcon;
  isMystery: boolean;
  isDebt: boolean;
  mysteryTier: MysteryBoxTier | null;
  hasValidPackage: boolean;
  hasValidCategory: boolean;
  packageMessageKey: PackageMessageKey;
  categoryMessageKey: CategoryMessageKey;
  packageBadgeColor: string;
  packageGlow: string | undefined;
  packageIconTheme: string | undefined;
  topBarClass: string | undefined;
  leftAccentClass: string;
  isFocusNavigate: boolean;
}

/**
 * Resolve de forma unificada todos os metadados visuais, temas de raridade,
 * ícones e chaves de tradução compartilhados entre GamifiedItemCard e ItemRow.
 */
export function resolveCatalogItemVisuals({
  type,
  iconName,
  packageLevel,
  category,
  isActiveFocusSession,
  includeMysteryTier = false,
}: CatalogItemVisualInput): CatalogItemVisuals {
  const typeKey = toRewardTypeMessageKey(type);
  const typeMeta = REWARD_TYPE_META[typeKey as RewardType];
  const RewardIcon = getRewardIcon(iconName, type);
  const isMystery = isMysteryBoxReward(type);
  const mysteryTier =
    includeMysteryTier && isMystery ? getMysteryBoxTier(packageLevel) : null;

  const packageMessageKey = toPackageMessageKey(packageLevel);
  const categoryMessageKey = toCategoryMessageKey(category);
  const isDebt = categoryMessageKey === "DEBT";

  const hasValidPackage = packageMessageKey !== "NONE";
  const hasValidCategory = categoryMessageKey !== "NONE";

  return {
    typeKey,
    typeMeta,
    RewardIcon,
    isMystery,
    isDebt,
    mysteryTier,
    hasValidPackage,
    hasValidCategory,
    packageMessageKey,
    categoryMessageKey,
    packageBadgeColor:
      PACKAGE_LEVEL_COLOR[packageMessageKey] ||
      "text-neutral-300 bg-white/10 border-white/15",
    packageGlow: isDebt ? undefined : PACKAGE_LEVEL_GLOW[packageMessageKey],
    packageIconTheme: isDebt
      ? "bg-rose-500/15 text-rose-700 border-rose-500/35 group-hover:border-rose-500/60 dark:bg-rose-500/15 dark:border-rose-400/35 dark:text-rose-300 dark:group-hover:border-rose-400/60"
      : PACKAGE_LEVEL_ICON_THEME[packageMessageKey],
    topBarClass: isDebt
      ? "via-rose-500 opacity-95"
      : RARITY_TOP_BAR[packageMessageKey],
    leftAccentClass: isDebt
      ? "border-l-4 border-l-rose-500"
      : RARITY_LEFT_ACCENT[packageMessageKey] ||
        "border-l-4 border-l-transparent",
    isFocusNavigate: Boolean(isActiveFocusSession),
  };
}

/**
 * Resolve o ícone e o rótulo de tipo compartilhados entre cards e linhas do catálogo/inventário.
 */
export function resolveCatalogTypePresentation(
  visuals: Pick<CatalogItemVisuals, "isMystery" | "typeKey" | "typeMeta">,
  isGamified: boolean,
  t: (key: never) => string,
): { TypeIcon: LucideIcon | undefined; typeLabel: string } {
  const TypeIcon =
    !isGamified && visuals.isMystery ? Dices : visuals.typeMeta?.icon;
  const typeLabel =
    visuals.typeKey === "MysteryBox"
      ? t(
          (isGamified
            ? "types.MysteryBox"
            : "types.MysteryBoxProductivity") as never,
        )
      : t(`types.${visuals.typeKey}` as never);

  return { TypeIcon, typeLabel };
}

type CatalogTooltipTranslator = ((
  key:
    | "tooltips.openFocusSession"
    | "tooltips.inUse"
    | "tooltips.insufficientCoins"
    | "tooltips.insufficientCredits",
) => string) &
  ((
    key: "tooltips.actionForPrice" | "tooltips.actionForPriceCredits",
    values: { action: string; price: string },
  ) => string) &
  ((
    key: "tooltips.actionTarget",
    values: { action: string; title: string },
  ) => string);

/**
 * Resolve o tooltip acessível e padronizado do botão de ação principal
 * compartilhado entre GamifiedItemCard e ItemRow.
 */
export function resolveCatalogActionTooltip(params: {
  isFocusNavigate: boolean;
  inUse: boolean;
  canAfford: boolean;
  isGamified: boolean;
  actionLabel: string;
  title: string;
  price?: number;
  disabledTitle?: string;
  locale: AppLocale;
  t: CatalogTooltipTranslator;
}): string {
  const {
    isFocusNavigate,
    inUse,
    canAfford,
    isGamified,
    actionLabel,
    title,
    price,
    disabledTitle,
    locale,
    t,
  } = params;

  if (isFocusNavigate) {
    return t("tooltips.openFocusSession");
  }
  if (inUse) {
    return t("tooltips.inUse");
  }
  if (!canAfford) {
    return (
      disabledTitle ||
      t(
        isGamified
          ? "tooltips.insufficientCoins"
          : "tooltips.insufficientCredits",
      )
    );
  }
  if (typeof price === "number") {
    return t(
      isGamified ? "tooltips.actionForPrice" : "tooltips.actionForPriceCredits",
      {
        action: actionLabel,
        price: formatCoins(price, { locale }),
      },
    );
  }
  return t("tooltips.actionTarget", {
    action: actionLabel,
    title,
  });
}
