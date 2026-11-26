"use client";

import { Mountain, Sparkles, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useId, useState } from "react";
import { getPublicUserRetrospectiveAction } from "@/actions/socialActions";
import { PublicFriendActionsBar } from "@/components/showcase/PublicFriendActionsBar";
import { ShowcaseHeroHeader } from "@/components/showcase/ShowcaseHeroHeader";
import { ShowcaseOverviewLayout } from "@/components/showcase/ShowcaseOverviewLayout";
import {
  getShowcaseTabIds,
  type ShowcaseTabItem,
  ShowcaseTabs,
} from "@/components/showcase/ShowcaseTabs";
import {
  EMPTY_ARTIFACTS,
  EMPTY_FRIENDS,
  ProgressionPyramidPanel,
  preloadProgressionPanel,
  preloadRetrospectivePanel,
  RetrospectivePanel,
} from "@/components/showcase/showcaseDynamicPanels";
import { ContextualBackButton } from "@/components/ui/ContextualBackButton";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useLazyRetrospective } from "@/hooks/useLazyRetrospective";
import type { ShowcaseStatsResponseDTO } from "@/types/showcase";
import type { PublicUserShowcaseData, SocialUserSummary } from "@/types/social";
import type { UserResponseDTO } from "@/types/user";
import { createEmptyShowcaseData } from "@/utils/showcaseUtils";

type PublicShowcaseTabId = "overview" | "progression" | "retrospective";

const noop = () => {};

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
    equippedTitle: summary.equippedTitle ?? undefined,
    avatarPreset: summary.avatarPreset ?? undefined,
    isPremium: summary.isPremium,
    isFounder: summary.isFounder,
    emailVerified: summary.emailVerified,
    createdAt: summary.createdAt ?? undefined,
    currentLevelTitle: summary.levelTitle ?? undefined,
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
  statsSlot?: ReactNode;
}

export function PublicShowcaseView({
  data,
  statsSlot,
}: PublicShowcaseViewProps) {
  const t = useTranslations("showcase.publicProfile");
  const tTabs = useTranslations("showcase.tabs");
  const { isGamified } = useExperienceMode();
  const tabsBaseId = useId();

  const [activeTab, setActiveTab] = useState<PublicShowcaseTabId>("overview");

  const canShowProgressionTab = Boolean(
    data.canViewProfile && data.canViewStats,
  );
  // Exibe a aba Retrospectiva quando estatísticas são visíveis, carregando sob demanda
  // (também permite consultar anos anteriores elegíveis mesmo se o ano atual ainda não liberou).
  const canShowRetroTab = Boolean(data.canViewProfile && data.canViewStats);

  const {
    retrospective,
    status: retroStatus,
    isLoading: isRetroLoading,
    loadError: isRetroLoadError,
    ensureLoaded: ensurePublicRetroLoaded,
    setRetrospectiveData: setRetrospective,
  } = useLazyRetrospective({
    enabled: canShowRetroTab,
    fetcher: (year) =>
      getPublicUserRetrospectiveAction(data.user.username, year),
  });

  useEffect(() => {
    if (activeTab === "retrospective" && retroStatus === "idle") {
      void ensurePublicRetroLoaded();
    }
  }, [activeTab, retroStatus, ensurePublicRetroLoaded]);

  const mappedUser = mapSocialSummaryToUserDTO(data.user);
  const artifactsList = data.artifacts ?? EMPTY_ARTIFACTS;

  const fallbackStats: ShowcaseStatsResponseDTO = data.stats ?? {
    ...createEmptyShowcaseData(mappedUser).stats,
    achievementPoints: data.canViewAchievements
      ? data.user.achievementPoints
      : 0,
    unlockedAchievementsCount: data.canViewAchievements
      ? data.achievements.filter((a) => a.unlocked).length
      : 0,
    totalAchievementsCount: data.canViewAchievements
      ? data.achievements.length
      : 0,
    unlockedArtifactsCount: data.canViewAchievements
      ? artifactsList.filter((a) => a.unlocked).length
      : 0,
    totalArtifactsCount: data.canViewAchievements ? artifactsList.length : 0,
  };

  const friendActions = <PublicFriendActionsBar data={data} />;

  const tabs: ShowcaseTabItem<PublicShowcaseTabId>[] = [
    { id: "overview", label: tTabs("overview"), icon: Trophy },
    ...(canShowProgressionTab
      ? [
          {
            id: "progression" as const,
            label: tTabs("progression"),
            icon: Mountain,
            onPreload: preloadProgressionPanel,
          },
        ]
      : []),
    ...(canShowRetroTab
      ? [
          {
            id: "retrospective" as const,
            label: tTabs("retrospective"),
            icon: Sparkles,
            onPreload: preloadRetrospectivePanel,
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

      <ShowcaseHeroHeader
        user={mappedUser}
        stats={fallbackStats}
        isVisitorMode
        isOtherUser
        hideStats={!data.canViewStats}
        hideAchievements={!data.canViewAchievements}
        onToggleVisitorMode={() => {}}
        onOpenProgression={
          canShowProgressionTab ? () => setActiveTab("progression") : undefined
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
        <ShowcaseOverviewLayout
          panelId={overviewIds.panelId}
          labelledById={overviewIds.tabId}
          user={mappedUser}
          stats={fallbackStats}
          highlights={data.highlights}
          achievements={data.achievements}
          artifacts={artifactsList}
          isVisitorMode
          canViewStats={data.canViewStats}
          canViewAchievements={data.canViewAchievements}
          statsSlot={statsSlot}
          onOpenPicker={noop}
          totalAchievementsCount={fallbackStats.totalAchievementsCount}
          totalArtifactsCount={fallbackStats.totalArtifactsCount}
        />
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
            isLoading={isRetroLoading}
            loadError={isRetroLoadError}
            onRetry={() => void ensurePublicRetroLoaded(true)}
            isGamified={isGamified}
            isOwnProfile={false}
            targetUsername={data.user.username}
            onRetrospectiveChange={setRetrospective}
          />
        </div>
      )}
    </div>
  );
}
