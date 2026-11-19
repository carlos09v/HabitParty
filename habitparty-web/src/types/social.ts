import type {
  AchievementItemResponseDTO,
  ArtifactItemResponseDTO,
  ProfileHighlightResponseDTO,
  ShowcaseStatsResponseDTO,
} from "./showcase";

export type PrivacyLevel = "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE";

export type FriendRequestPolicy = "EVERYONE" | "FRIEND_CODE_ONLY" | "NONE";

export type SocialRelationshipStatus =
  | "SELF"
  | "NONE"
  | "PENDING_SENT"
  | "PENDING_RECEIVED"
  | "FRIENDS"
  | "BLOCKED_BY_VIEWER"
  | "BLOCKED";

export type SocialNotificationType =
  | "FRIEND_REQUEST_RECEIVED"
  | "FRIEND_REQUEST_ACCEPTED"
  | "FRIEND_MILESTONE_LEVEL"
  | "FRIEND_MILESTONE_ACHIEVEMENT";

export type RetrospectiveArchetype =
  | "DEEP_FOCUS_SAGE"
  | "STREAK_GUARDIAN"
  | "CHALLENGE_SEEKER"
  | "ARCHITECT"
  | "RISING_SPARK";

export interface SocialUserSummary {
  id: string;
  fullName: string;
  username: string;
  profilePhotoUrl?: string | null;
  bio?: string | null;
  avatarFrame?: string | null;
  equippedTitle?: string | null;
  avatarPreset?: string | null;
  isPremium: boolean;
  isFounder: boolean;
  levelTitle: string;
  totalXp: number;
  currentStreak: number;
  highestStreak: number;
  achievementPoints: number;
  profileVisibility: PrivacyLevel;
  statsVisibility: PrivacyLevel;
  achievementsVisibility: PrivacyLevel;
  friendRequestPolicy: FriendRequestPolicy;
  friendCode?: string | null;
}

export interface FriendConnectionItem {
  friendshipId: string;
  relationshipStatus: SocialRelationshipStatus;
  connectedAt?: string | null;
  requestedAt?: string | null;
  user: SocialUserSummary;
}

export interface FriendsOverviewData {
  myFriendCode: string;
  friendsCount: number;
  maxFriends: number;
  friends: FriendConnectionItem[];
  incomingRequests: FriendConnectionItem[];
  outgoingRequests: FriendConnectionItem[];
  blockedUsers: FriendConnectionItem[];
}

export interface SearchSocialUserItem {
  user: SocialUserSummary;
  relationshipStatus: SocialRelationshipStatus;
  friendshipId?: string | null;
  matchedByFriendCode: boolean;
  canSendRequest: boolean;
}

export interface SendFriendRequestResponse {
  friendshipId: string;
  relationshipStatus: SocialRelationshipStatus;
  autoAccepted: boolean;
  targetUser: SocialUserSummary;
}

export interface RespondFriendRequestResponse {
  friendshipId: string;
  accepted: boolean;
}

export interface SocialNotificationItem {
  id: string;
  type: SocialNotificationType;
  referenceId?: string | null;
  payload?: string | null;
  seen: boolean;
  createdAt: string;
  actorId?: string | null;
  actorUsername?: string | null;
  actorFullName?: string | null;
  actorAvatarUrl?: string | null;
  actorAvatarFrame?: string | null;
  actorIsPremium: boolean;
}

export interface SocialNotificationsFeed {
  unseenCount: number;
  notifications: SocialNotificationItem[];
}

export interface PublicUserShowcaseData {
  user: SocialUserSummary;
  relationshipStatus: SocialRelationshipStatus;
  friendshipId?: string | null;
  canViewProfile: boolean;
  canViewStats: boolean;
  canViewAchievements: boolean;
  stats?: ShowcaseStatsResponseDTO | null;
  highlights: ProfileHighlightResponseDTO[];
  achievements: AchievementItemResponseDTO[];
  artifacts?: ArtifactItemResponseDTO[];
}

export interface UserRetrospectiveData {
  year: number;
  timezone: string;
  eligible: boolean;
  inSeasonalWindow: boolean;
  criteriaMet: number;
  criteriaRequired: number;
  minActiveDaysRequired: number;
  minTasksRequired: number;
  minFocusMinutesRequired: number;
  activeDays: number;
  tasksCompleted: number;
  hardTasksCompleted: number;
  focusMinutes: number;
  focusSessionsCount: number;
  pomodorosCompleted: number;
  xpEarned: number;
  coinsEarned: number;
  achievementsUnlockedCount: number;
  bestMonth?: number | null;
  bestMonthTasksCount: number;
  rarestAchievementCode?: string | null;
  rarestAchievementTitle?: string | null;
  rarestAchievementRarity?: string | null;
  archetype: RetrospectiveArchetype;
  availableYears: number[];
}

export interface UpdatePrivacySettingsPayload {
  profileVisibility: PrivacyLevel;
  statsVisibility: PrivacyLevel;
  achievementsVisibility: PrivacyLevel;
  friendRequestPolicy: FriendRequestPolicy;
}
