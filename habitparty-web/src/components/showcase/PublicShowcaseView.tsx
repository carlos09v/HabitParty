"use client";

import { Mountain, Sparkles, Trophy } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { type ReactNode, useId, useState } from "react";
import { AchievementsGallery } from "@/components/showcase/AchievementsGallery";
import { ArtifactsGallery } from "@/components/showcase/ArtifactsGallery";
import { LockedSectionNotice } from "@/components/showcase/LockedSectionNotice";
import { PublicFriendActionsBar } from "@/components/showcase/PublicFriendActionsBar";
import { ShowcaseHeroHeader } from "@/components/showcase/ShowcaseHeroHeader";
import { ShowcaseHighlightsSection } from "@/components/showcase/ShowcaseHighlightsSection";
import {
  getShowcaseTabIds,
  type ShowcaseTabItem,
  ShowcaseTabPanelFallback,
  ShowcaseTabs,
} from "@/components/showcase/ShowcaseTabs";
import { ContextualBackButton } from "@/components/ui/ContextualBackButton";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { ShowcaseStatsResponseDTO } from "@/types/showcase";
import type {
  FriendConnectionItem,
  PublicUserShowcaseData,
  SocialUserSummary,
  UserRetrospectiveData,
} from "@/types/social";
import type { UserResponseDTO } from "@/types/user";
import { createEmptyShowcaseData } from "@/utils";

const EMPTY_FRIENDS: FriendConnectionItem[] = [];

type PublicShowcaseTabId = "overview" | "progression" | "retrospective";

const preloadProgressionPanel = () =>
  import("@/components/showcase/progression/ProgressionPyramidPanel").then(
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
    equippedTitle: summary.equippedTitle ?? undefined,
    avatarPreset: summary.avatarPreset ?? undefined,
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
  const t = useTranslations("showcase.publicProfile");
  const tTabs = useTranslations("showcase.tabs");
  const { isGamified } = useExperienceMode();
  const tabsBaseId = useId();

  const [activeTab, setActiveTab] = useState<PublicShowcaseTabId>("overview");

  const canShowProgressionTab = Boolean(
    data.canViewProfile && data.canViewStats,
  );
  const canShowRetroTab = Boolean(
    data.canViewProfile && data.canViewStats && retrospective?.eligible,
  );

  const mappedUser = mapSocialSummaryToUserDTO(data.user);

  const fallbackStats: ShowcaseStatsResponseDTO = data.stats ?? {
    ...createEmptyShowcaseData(mappedUser).stats,
    achievementPoints: data.canViewAchievements
      ? data.user.achievementPoints
      : 0,
    unlockedAchievementsCount: data.canViewAchievements
      ? data.achievements.filter((a) => a.unlocked).length
      : 0,
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
            artifacts={data.artifacts ?? []}
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
            <>
              <ArtifactsGallery
                artifacts={data.artifacts ?? []}
                highlights={data.highlights}
                isVisitorMode
                onPinArtifact={() => {}}
              />
              <AchievementsGallery
                achievements={data.achievements}
                highlights={data.highlights}
                isVisitorMode
                onPinAchievement={() => {}}
              />
            </>
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
    </div>
  );
}
