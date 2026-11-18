"use client";

import { Lock, Mountain, Sparkles, Trophy } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useId, useState } from "react";
import { AchievementsGallery } from "@/components/showcase/AchievementsGallery";
import { LockedSectionNotice } from "@/components/showcase/LockedSectionNotice";
import { PublicFriendActionButtons } from "@/components/showcase/PublicFriendActionButtons";
import { ShowcaseHeroHeader } from "@/components/showcase/ShowcaseHeroHeader";
import { ShowcaseHighlightsSection } from "@/components/showcase/ShowcaseHighlightsSection";
import {
  getShowcaseTabIds,
  type ShowcaseTabItem,
  ShowcaseTabPanelFallback,
  ShowcaseTabs,
} from "@/components/showcase/ShowcaseTabs";
import { ContextualBackButton } from "@/components/ui/ContextualBackButton";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  DEFAULT_MAX_ACHIEVEMENT_POINTS,
  DEFAULT_TOTAL_ACHIEVEMENTS_COUNT,
} from "@/constants/achievements";
import { resolveAvatarFrameId } from "@/constants/avatarFrames";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useFriendshipMutations } from "@/hooks/useFriendshipMutations";
import { useIdlePreload } from "@/hooks/useIdlePreload";
import type { ShowcaseStatsResponseDTO } from "@/types/showcase";
import type {
  FriendConnectionItem,
  PublicUserShowcaseData,
  SocialUserSummary,
  UserRetrospectiveData,
} from "@/types/social";
import type { UserResponseDTO } from "@/types/user";

const EMPTY_FRIENDS: FriendConnectionItem[] = [];

type PublicShowcaseTabId = "overview" | "progression" | "retrospective";

const preloadProgressionPanel = () =>
  import("@/components/showcase/ProgressionPyramidPanel").then(
    (mod) => mod.ProgressionPyramidPanel,
  );

const ProgressionPyramidPanel = dynamic(preloadProgressionPanel, {
  loading: ShowcaseTabPanelFallback,
});

const preloadRetrospectivePanel = () =>
  import("@/components/showcase/RetrospectivePanel").then(
    (mod) => mod.RetrospectivePanel,
  );

const RetrospectivePanel = dynamic(preloadRetrospectivePanel, {
  loading: ShowcaseTabPanelFallback,
});

function mapSocialSummaryToUserDTO(
  summary: SocialUserSummary,
): UserResponseDTO {
  return {
    id: summary.id,
    fullName: summary.fullName,
    username: summary.username,
    email: "",
    profilePhotoUrl: summary.profilePhotoUrl ?? undefined,
    bio: summary.bio ?? undefined,
    avatarFrame: summary.avatarFrame ?? undefined,
    isPremium: summary.isPremium,
    isFounder: summary.isFounder,
    currentLevelTitle: summary.levelTitle,
    totalXp: summary.totalXp,
    currentStreak: summary.currentStreak,
    highestStreak: summary.highestStreak,
    achievementPoints: summary.achievementPoints,
    profileVisibility: summary.profileVisibility,
    statsVisibility: summary.statsVisibility,
    achievementsVisibility: summary.achievementsVisibility,
    friendRequestPolicy: summary.friendRequestPolicy,
    friendCode: summary.friendCode ?? undefined,
  };
}

interface PublicShowcaseViewProps {
  data: PublicUserShowcaseData;
  retrospective: UserRetrospectiveData | null;
  statsSlot?: ReactNode;
}

export function PublicShowcaseView({
  data,
  retrospective,
  statsSlot,
}: PublicShowcaseViewProps) {
  const router = useRouter();
  const t = useTranslations("showcase.publicProfile");
  const tTabs = useTranslations("showcase.tabs");
  const { isGamified } = useExperienceMode();
  const tabsBaseId = useId();

  const [activeTab, setActiveTab] = useState<PublicShowcaseTabId>("overview");

  const {
    isMutating,
    sendFriendRequest,
    respondFriendRequest,
    removeConnection,
    blockUser,
  } = useFriendshipMutations({ onMutated: () => router.refresh() });

  const canShowProgressionTab = Boolean(
    data.canViewProfile && data.canViewStats,
  );
  const canShowRetroTab = Boolean(
    data.canViewProfile && data.canViewStats && retrospective?.eligible,
  );

  useIdlePreload(preloadProgressionPanel, undefined, canShowProgressionTab);
  useIdlePreload(preloadRetrospectivePanel, undefined, canShowRetroTab);

  const mappedUser = mapSocialSummaryToUserDTO(data.user);
  const displayName = data.user.fullName || data.user.username;

  const fallbackStats: ShowcaseStatsResponseDTO = data.stats ?? {
    currentStreak: data.user.currentStreak,
    highestStreak: data.user.highestStreak,
    totalTasksCompleted: 0,
    totalHardTasksCompleted: 0,
    totalHardcoreTasksCompleted: 0,
    totalFocusMinutes: 0,
    totalFocusSessions: 0,
    longestFocusSessionMinutes: 0,
    totalPomodorosCompleted: 0,
    totalRewardsRedeemed: 0,
    totalMysteryBoxesOpened: 0,
    totalXp: data.user.totalXp,
    totalGoldEarned: 0,
    achievementPoints: data.canViewAchievements
      ? data.user.achievementPoints
      : 0,
    maxAchievementPoints: DEFAULT_MAX_ACHIEVEMENT_POINTS,
    unlockedAchievementsCount: data.canViewAchievements
      ? data.achievements.filter((a) => a.unlocked).length
      : 0,
    totalAchievementsCount: DEFAULT_TOTAL_ACHIEVEMENTS_COUNT,
  };

  const friendActions = (
    <PublicFriendActionButtons
      data={data}
      isMutating={isMutating}
      onSendRequest={() =>
        sendFriendRequest({ username: data.user.username }, data.user.username)
      }
      onRespondRequest={(accept) => {
        if (data.friendshipId) {
          respondFriendRequest(data.friendshipId, accept);
        }
      }}
      onRemoveConnection={(wasBlocked = false) => {
        if (data.friendshipId) {
          removeConnection(data.friendshipId, wasBlocked);
        }
      }}
      onBlockUser={() => blockUser(data.user.id)}
    />
  );

  const tabs: ShowcaseTabItem<PublicShowcaseTabId>[] = [
    { id: "overview", label: tTabs("overview"), icon: Trophy },
    ...(canShowProgressionTab
      ? [
          {
            id: "progression" as const,
            label: tTabs("progression"),
            icon: Mountain,
          },
        ]
      : []),
    ...(canShowRetroTab
      ? [
          {
            id: "retrospective" as const,
            label: tTabs("retrospective"),
            icon: Sparkles,
          },
        ]
      : []),
  ];

  const overviewIds = getShowcaseTabIds(tabsBaseId, "overview");
  const progressionIds = getShowcaseTabIds(tabsBaseId, "progression");
  const retrospectiveIds = getShowcaseTabIds(tabsBaseId, "retrospective");

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto pb-16 gap-6">
      <div className="flex items-center justify-between gap-3">
        <ContextualBackButton
          fallbackHref="/profile?tab=friends"
          preferHistoryBack
          label={t("backToFriends")}
          historyLabel={t("backToPrevious")}
        />

        {data.relationshipStatus === "SELF" && (
          <span className="text-xs font-medium text-neutral-400">
            {t("ownProfileNotice")}
          </span>
        )}
      </div>

      {!data.canViewProfile ? (
        <section className="rounded-2xl border border-neutral-700 dark:border-primary/30 bg-card dark:bg-surface/55 p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <UserAvatar
                src={data.user.profilePhotoUrl}
                name={displayName}
                size="lg"
                hasRing={data.user.isPremium}
                frameId={resolveAvatarFrameId(data.user.avatarFrame)}
              />
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-50 truncate">
                  {displayName}
                </h1>
                <p className="text-sm text-neutral-400 truncate">
                  @{data.user.username}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {friendActions}
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-neutral-700 dark:border-primary/25 bg-surface/50 p-6 flex items-start gap-3">
            <Lock
              size={20}
              className="text-amber-800 dark:text-gold shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <h2 className="text-body-m font-bold text-neutral-100">
                {t("privateProfileTitle")}
              </h2>
              <p className="text-xs text-neutral-400 mt-1 max-w-xl leading-relaxed">
                {data.user.profileVisibility === "FRIENDS_ONLY"
                  ? t("privateProfileFriendsDesc")
                  : t("privateProfilePrivateDesc")}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <>
          <ShowcaseHeroHeader
            user={mappedUser}
            stats={fallbackStats}
            isVisitorMode
            isOtherUser
            onToggleVisitorMode={() => {}}
            onOpenProgression={
              canShowProgressionTab
                ? () => setActiveTab("progression")
                : undefined
            }
            extraHeaderActions={friendActions}
          />

          {(canShowProgressionTab || canShowRetroTab) && (
            <ShowcaseTabs
              baseId={tabsBaseId}
              ariaLabel={tTabs("navAria")}
              tabs={tabs}
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              className="w-fit max-w-full"
            />
          )}

          {activeTab === "overview" && (
            <div
              id={overviewIds.panelId}
              role="tabpanel"
              aria-labelledby={overviewIds.tabId}
              className="flex flex-col gap-7"
            >
              <ShowcaseHighlightsSection
                user={mappedUser}
                stats={fallbackStats}
                highlights={data.highlights}
                achievements={data.achievements}
                isVisitorMode
                onOpenPicker={() => {}}
              />

              {data.canViewStats && statsSlot ? (
                statsSlot
              ) : (
                <LockedSectionNotice
                  title={t("statsLockedTitle")}
                  description={t("statsLockedDesc")}
                />
              )}

              {data.canViewAchievements ? (
                <AchievementsGallery
                  achievements={data.achievements}
                  highlights={data.highlights}
                  isVisitorMode
                  onPinAchievement={() => {}}
                />
              ) : (
                <LockedSectionNotice
                  title={t("achievementsLockedTitle")}
                  description={t("achievementsLockedDesc")}
                />
              )}
            </div>
          )}

          {activeTab === "progression" && canShowProgressionTab && (
            <div
              id={progressionIds.panelId}
              role="tabpanel"
              aria-labelledby={progressionIds.tabId}
            >
              <ProgressionPyramidPanel
                user={mappedUser}
                stats={fallbackStats}
                achievements={data.canViewAchievements ? data.achievements : []}
                friends={EMPTY_FRIENDS}
                isVisitorMode
              />
            </div>
          )}

          {activeTab === "retrospective" && canShowRetroTab && (
            <div
              id={retrospectiveIds.panelId}
              role="tabpanel"
              aria-labelledby={retrospectiveIds.tabId}
            >
              <RetrospectivePanel
                initialRetrospective={retrospective}
                isGamified={isGamified}
                isOwnProfile={false}
                targetUsername={data.user.username}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
