import { useTranslations } from "next-intl";
import { ACCOUNT_BADGE_DEFINITIONS } from "@/constants/achievements";
import type { HighlightType } from "@/types/showcase";
import type { UserResponseDTO } from "@/types/user";
import {
  isAccountBadgeUnlocked,
  resolveAccountBadgeCopy,
} from "@/utils/showcaseUtils";
import { type PickerGridItem, PickerItemGrid } from "./PickerItemGrid";

interface PickerBadgesSectionProps {
  user: UserResponseDTO;
  isGamified: boolean;
  levelTitle: string;
  currentXp: number;
  findEquippedSlotIndex: (
    type: HighlightType,
    referenceId?: string | null,
    highlightKey?: string | null,
  ) => number;
  onAssign: (
    type: HighlightType,
    referenceId: string | null,
    highlightKey: string | null,
  ) => void;
}

export function PickerBadgesSection({
  user,
  isGamified,
  levelTitle,
  currentXp,
  findEquippedSlotIndex,
  onAssign,
}: PickerBadgesSectionProps) {
  const t = useTranslations("showcase.pickerModal");
  const tBadges = useTranslations("showcase.accountBadges");

  const items: PickerGridItem[] = ACCOUNT_BADGE_DEFINITIONS.map((badge) => {
    const unlocked = isAccountBadgeUnlocked(badge.id, user);
    const { title, description } = resolveAccountBadgeCopy(
      badge.id,
      isGamified,
      levelTitle,
      currentXp,
      tBadges,
    );

    return {
      key: badge.id,
      iconKey: badge.iconKey,
      title,
      subtitle: unlocked ? description : tBadges(`${badge.id}.lockedHint`),
      subtitleClamp: 2,
      rarity: badge.rarity,
      equippedSlot: findEquippedSlotIndex("ACCOUNT_BADGE", null, badge.id),
      disabled: !unlocked,
      onSelect: () => onAssign("ACCOUNT_BADGE", null, badge.id),
    };
  });

  return (
    <PickerItemGrid
      items={items}
      alreadyEquippedLabel={(slot) => t("alreadyEquipped", { slot })}
      cardPaddingClassName="p-3.5"
    />
  );
}
