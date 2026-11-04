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
  PackageLevel,
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

const RARITY_TOP_BAR: Partial<Record<PackageLevel, string>> = {
  Lendário: "via-amber-500 dark:via-gold opacity-90",
  LEGENDARY: "via-amber-500 dark:via-gold opacity-90",
  Épico: "via-magenta opacity-90",
  EPIC: "via-magenta opacity-90",
  Premium: "via-sky-500 dark:via-info opacity-90",
  PREMIUM: "via-sky-500 dark:via-info opacity-90",
  Básico: "via-emerald-500 dark:via-success-500 opacity-85",
  BASIC: "via-emerald-500 dark:via-success-500 opacity-85",
};

const RARITY_LEFT_ACCENT: Record<string, string> = {
  Lendário: "border-l-4 border-l-gold",
  LEGENDARY: "border-l-4 border-l-gold",
  Épico: "border-l-4 border-l-magenta",
  EPIC: "border-l-4 border-l-magenta",
  Premium: "border-l-4 border-l-info",
  PREMIUM: "border-l-4 border-l-info",
  Básico: "border-l-4 border-l-success-500",
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

  const hasValidPackage = Boolean(
    packageLevel && packageLevel !== "Nenhum" && packageLevel !== "NONE",
  );
  const hasValidCategory = Boolean(
    category && category !== "Nenhum" && category !== "NONE",
  );

  const pkg = packageLevel as PackageLevel | undefined;

  return {
    typeKey,
    typeMeta,
    RewardIcon,
    isMystery,
    mysteryTier,
    hasValidPackage,
    hasValidCategory,
    packageMessageKey: toPackageMessageKey(packageLevel),
    categoryMessageKey: toCategoryMessageKey(category),
    packageBadgeColor:
      (pkg && PACKAGE_LEVEL_COLOR[pkg]) ||
      "text-neutral-300 bg-white/10 border-white/15",
    packageGlow: pkg ? PACKAGE_LEVEL_GLOW[pkg] : undefined,
    packageIconTheme: pkg ? PACKAGE_LEVEL_ICON_THEME[pkg] : undefined,
    topBarClass: pkg ? RARITY_TOP_BAR[pkg] : undefined,
    leftAccentClass:
      (packageLevel && RARITY_LEFT_ACCENT[packageLevel]) ||
      "border-l-4 border-l-transparent",
    isFocusNavigate: Boolean(isActiveFocusSession),
  };
}
