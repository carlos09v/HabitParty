import type { components } from "@/api/schema";
import type { FriendRequestPolicy, PrivacyLevel } from "@/types/social";

export type UserResponseDTO = components["schemas"]["UserResponseDTO"] & {
  hasPassword?: boolean;
  theme?: string | null;
  equippedTitle?: string | null;
  avatarPreset?: string | null;
  friendCode?: string;
  profileVisibility?: PrivacyLevel;
  statsVisibility?: PrivacyLevel;
  achievementsVisibility?: PrivacyLevel;
  friendRequestPolicy?: FriendRequestPolicy;
};
export type CreateUserDTO = components["schemas"]["CreateUserDTO"];
export type UpdateUserDTO = components["schemas"]["UpdateUserDTO"] & {
  theme?: string;
};
export type UpdateUserPasswordDTO =
  components["schemas"]["UpdateUserPasswordDTO"];
export type ResetAccountDTO = components["schemas"]["ResetAccountDTO"];
export type AccountResetScope = ResetAccountDTO["scope"];

export type GenderType = "MALE" | "FEMALE" | "NON_BINARY" | "PREFER_NOT_TO_SAY";
