import type { LucideIcon } from "lucide-react";
import {
  PACKAGE_LEVEL_COLOR,
  PACKAGE_LEVEL_GLOW,
  PACKAGE_LEVEL_ICON_THEME,
  REWARD_TYPE_META,
} from "@/constants/reward";
import type {
  CategoryMessageKey,
  MysteryBoxTier,
  PackageMessageKey,
  RewardType,
  RewardTypeMessageKey,
  RewardTypeMeta,
} from "@/types/reward";
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
  const isMystery = isMysteryBoxReward(type, iconName);
  const mysteryTier =
    includeMysteryTier && isMystery ? getMysteryBoxTier(packageLevel) : null;

  const packageMessageKey = toPackageMessageKey(packageLevel);
  const categoryMessageKey = toCategoryMessageKey(category);

  const hasValidPackage = packageMessageKey !== "NONE";
  const hasValidCategory = categoryMessageKey !== "NONE";

  return {
    typeKey,
    typeMeta,
    RewardIcon,
    isMystery,
    mysteryTier,
    hasValidPackage,
    hasValidCategory,
    packageMessageKey,
    categoryMessageKey,
    packageBadgeColor:
      PACKAGE_LEVEL_COLOR[packageMessageKey] ||
      "text-neutral-300 bg-white/10 border-white/15",
    packageGlow: PACKAGE_LEVEL_GLOW[packageMessageKey],
    packageIconTheme: PACKAGE_LEVEL_ICON_THEME[packageMessageKey],
    topBarClass: RARITY_TOP_BAR[packageMessageKey],
    leftAccentClass:
      RARITY_LEFT_ACCENT[packageMessageKey] ||
      "border-l-4 border-l-transparent",
    isFocusNavigate: Boolean(isActiveFocusSession),
  };
}
