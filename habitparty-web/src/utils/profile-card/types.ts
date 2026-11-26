import type { UserRetrospectiveData } from "@/types/social";

export interface CardRenderHighlight {
  title: string;
  badge: string;
  accentHex: string;
}

export interface ProfileCardRenderLabels {
  brandName: string;
  headerBadge: string;
  levelLabel: string;
  highlightsTitle: string;
  noHighlights: string;
  friendCodeLabel: string;
  vipLabel: string;
  founderLabel: string;
  generatedBy: string;
  metricStreakLabel: string;
  metricTasksLabel: string;
  metricFocusLabel: string;
  metricPointsLabel: string;
  retroActiveDaysLabel: string;
  retroActiveDaysSub?: string;
  retroTasksLabel: string;
  retroFocusLabel: string;
  retroXpLabel: string;
  retroBestMonthLabel: string;
  retroRarestLabel: string;
  retroArchetypeLabel: string;
  retroCoinsSub: string;
  retroHardTasksSub: string;
  retroFocusSessionsSub: string;
  retroBestMonthSub: string;
  retroNoRarest: string;
  retroNoBestMonth: string;
}

export interface ProfileCardRenderInput {
  mode: "profile" | "retrospective";
  theme: "dark" | "light";
  isGamified: boolean;
  locale?: string;
  user: {
    fullName: string;
    username: string;
    profilePhotoUrl?: string | null;
    bio?: string | null;
    isPremium?: boolean;
    isFounder?: boolean;
    avatarFrame?: string | null;
    avatarPreset?: string | null;
    equippedTitle?: string | null;
    friendCode?: string | null;
  };
  equippedTitleLabel?: string | null;
  levelTitle: string;
  levelProgressPercent: number;
  includeFriendCode: boolean;
  stats?: {
    highestStreak: number;
    totalTasksCompleted: number;
    totalFocusMinutes: number;
    achievementPoints: number;
  } | null;
  highlights: CardRenderHighlight[];
  retrospective?: UserRetrospectiveData | null;
  archetypeTitle?: string;
  archetypeDesc?: string;
  bestMonthLabel?: string | null;
  rarestAchievementTitle?: string | null;
  rarestAchievementRarityLabel?: string | null;
  labels: ProfileCardRenderLabels;
}

export interface ProfileCardRenderOptions {
  signal?: AbortSignal;
}

export const CARD_DIMENSIONS = {
  profile: { width: 1200, height: 630 },
  retrospective: { width: 1200, height: 675 },
} as const;

export interface ThemePalette {
  bgStart: string;
  bgEnd: string;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  gold: string;
  goldSoftBg: string;
  goldBorder: string;
  accentPurple: string;
  accentCyan: string;
  barTrack: string;
  avatarFallbackBg: string;
}
