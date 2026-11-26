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

export type HighlightType =
  | "ACHIEVEMENT"
  | "ACCOUNT_BADGE"
  | "STAT_METRIC"
  | "ARTIFACT"
  | "TASK_STREAK";

export interface TaskStreakHighlightDTO {
  id: string;
  name: string;
  taskType: "DAILY" | "HABIT";
  currentStreak: number;
  highestStreak: number;
  isCycleBased: boolean;
}

export type ArtifactSourceType = "ACHIEVEMENT" | "MYSTERY_BOX" | "SPECIAL";

export interface ArtifactSummaryDTO {
  id: string;
  code: string;
  iconName: string;
  rarity: AchievementRarity;
}

export interface ArtifactItemResponseDTO {
  id: string;
  code: string;
  iconName: string;
  rarity: AchievementRarity;
  sourceType: ArtifactSourceType;
  requiredAchievementCode: string | null;
  displayOrder: number;
  unlocked: boolean;
  unlockedAt: string | null;
  obtainedSource: string | null;
  seen: boolean;
}

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
  grantedArtifact?: ArtifactSummaryDTO | null;
}

export interface ProfileHighlightResponseDTO {
  id: string;
  displayOrder: number;
  highlightType: HighlightType;
  referenceId: string | null;
  highlightKey: string | null;
  taskStreak?: TaskStreakHighlightDTO | null;
}

export interface ShowcaseStatsResponseDTO {
  currentStreak: number;
  highestStreak: number;
  highestTaskStreak?: number;
  highestTaskStreakTitle?: string | null;
  highestTaskStreakType?: "DAILY" | "HABIT" | null;
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
  unlockedArtifactsCount?: number;
  totalArtifactsCount?: number;
}

export interface UserShowcaseResponseDTO {
  user: UserResponseDTO;
  stats: ShowcaseStatsResponseDTO;
  highlights: ProfileHighlightResponseDTO[];
  achievements: AchievementItemResponseDTO[];
  artifacts?: ArtifactItemResponseDTO[];
  taskStreaks?: TaskStreakHighlightDTO[];
  friendsCount?: number;
  pendingFriendRequestsCount?: number;
  hasSeasonalRetroBanner?: boolean;
  seasonalRetroYear?: number | null;
  eligibleRetroArchetypes?: string[];
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
  equippedTitle?: string | null;
  avatarPreset?: string | null;
}
