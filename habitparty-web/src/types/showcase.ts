import type { UserResponseDTO } from "@/types/user";

export type AchievementCategory =
  | "TASKS"
  | "STREAKS"
  | "FOCUS"
  | "ECONOMY"
  | "PROGRESSION"
  | "SPECIAL";

export type AchievementRarity =
  | "COMMON"
  | "UNCOMMON"
  | "RARE"
  | "EPIC"
  | "LEGENDARY";

export type HighlightType = "ACHIEVEMENT" | "ACCOUNT_BADGE";

export type AccountBadgeId =
  | "FOUNDER"
  | "PREMIUM_GUARDIAN"
  | "VERIFIED_ADVENTURER"
  | "LEVEL_RANK";

export interface AchievementItemResponseDTO {
  id: string;
  code: string;
  title: string;
  description: string;
  iconName: string;
  points: number;
  category: AchievementCategory;
  rarity: AchievementRarity;
  targetValue: number;
  displayOrder: number;
  isSecret: boolean;
  unlocked: boolean;
  unlockedAt: string | null;
  seen: boolean;
  currentValue: number;
  progressPercent: number;
}

export interface ProfileHighlightResponseDTO {
  id: string;
  displayOrder: number;
  highlightType: HighlightType;
  referenceId: string | null;
  highlightKey: string | null;
}

export interface ShowcaseStatsResponseDTO {
  currentStreak: number;
  highestStreak: number;
  totalTasksCompleted: number;
  totalHardTasksCompleted: number;
  totalHardcoreTasksCompleted: number;
  totalFocusMinutes: number;
  totalFocusSessions: number;
  longestFocusSessionMinutes: number;
  totalPomodorosCompleted: number;
  totalRewardsRedeemed: number;
  totalMysteryBoxesOpened: number;
  totalXp: number;
  totalGoldEarned: number;
  achievementPoints: number;
  maxAchievementPoints: number;
  unlockedAchievementsCount: number;
  totalAchievementsCount: number;
}

export interface UserShowcaseResponseDTO {
  user: UserResponseDTO;
  stats: ShowcaseStatsResponseDTO;
  highlights: ProfileHighlightResponseDTO[];
  achievements: AchievementItemResponseDTO[];
}

export interface HighlightSlotInputDTO {
  displayOrder: number;
  highlightType: HighlightType;
  referenceId?: string | null;
  highlightKey?: string | null;
}

export interface UpdateProfileHighlightsRequestDTO {
  highlights: HighlightSlotInputDTO[];
}

export interface UpdateShowcaseProfileRequestDTO {
  bio?: string | null;
  avatarFrame?: string | null;
}
