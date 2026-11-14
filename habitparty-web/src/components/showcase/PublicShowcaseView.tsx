"use client";

import { ArrowLeft, Lock, Sparkles, Trophy } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { AchievementsGallery } from "@/components/showcase/AchievementsGallery";
import { PublicFriendActionButtons } from "@/components/showcase/PublicFriendActionButtons";
import { RetrospectivePanel } from "@/components/showcase/RetrospectivePanel";
import { ShowcaseHeroHeader } from "@/components/showcase/ShowcaseHeroHeader";
import { ShowcaseHighlightsSection } from "@/components/showcase/ShowcaseHighlightsSection";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  DEFAULT_MAX_ACHIEVEMENT_POINTS,
  DEFAULT_TOTAL_ACHIEVEMENTS_COUNT,
} from "@/constants/achievements";
import { getAvatarFrame } from "@/constants/avatarFrames";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useFriendshipMutations } from "@/hooks/useFriendshipMutations";
import type { ShowcaseStatsResponseDTO } from "@/types/showcase";
import type {
  PublicUserShowcaseData,
  SocialUserSummary,
  UserRetrospectiveData,
} from "@/types/social";
import type { UserResponseDTO } from "@/types/user";
import { cn } from "@/utils";

const ProfilePreviewCardModal = dynamic(
  () =>
    import("@/components/showcase/ProfilePreviewCardModal").then(
      (mod) => mod.ProfilePreviewCardModal,
    ),
  { ssr: false },
);

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

  const [activeTab, setActiveTab] = useState<"overview" | "retrospective">(
    "overview",
  );
  const [previewModalState, setPreviewModalState] = useState<{
    isOpen: boolean;
    mode: "profile" | "retrospective";
    retro: UserRetrospectiveData | null;
  }>({
    isOpen: false,
    mode: "profile",
    retro: retrospective,
  });

  const {
    isMutating,
    sendFriendRequest,
    respondFriendRequest,
    removeConnection,
    blockUser,
  } = useFriendshipMutations({ onMutated: () => router.refresh() });

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

  const canShowRetroTab = Boolean(
    data.canViewProfile && data.canViewStats && retrospective?.eligible,
  );

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto pb-16 gap-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/profile?tab=friends"
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-300 hover:text-amber-800 dark:hover:text-gold transition-colors"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          <span>{t("backToFriends")}</span>
        </Link>

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
                frameId={getAvatarFrame(data.user.avatarFrame ?? undefined).id}
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
            onOpenPreviewCard={() =>
              setPreviewModalState({
                isOpen: true,
                mode: "profile",
                retro: retrospective,
              })
            }
            extraHeaderActions={friendActions}
          />

          {canShowRetroTab && (
            <div
              role="tablist"
              aria-label={tTabs("navAria")}
              className="flex items-center gap-2 p-1.5 rounded-2xl bg-surface dark:bg-surface/90 border border-neutral-700 dark:border-primary/20 w-fit"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "overview"}
                onClick={() => setActiveTab("overview")}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer",
                  activeTab === "overview"
                    ? "bg-gold text-on-gold shadow-glow-gold-xs"
                    : "text-neutral-300 hover:text-neutral-50 hover:bg-white/5",
                )}
              >
                <Trophy size={15} aria-hidden="true" />
                <span>{tTabs("overview")}</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "retrospective"}
                onClick={() => setActiveTab("retrospective")}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer",
                  activeTab === "retrospective"
                    ? "bg-gold text-on-gold shadow-glow-gold-xs"
                    : "text-neutral-300 hover:text-neutral-50 hover:bg-white/5",
                )}
              >
                <Sparkles size={15} aria-hidden="true" />
                <span>{tTabs("retrospective")}</span>
              </button>
            </div>
          )}

          {activeTab === "overview" && (
            <div role="tabpanel" className="flex flex-col gap-7">
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
                <section className="rounded-2xl border border-dashed border-neutral-700 dark:border-primary/25 bg-card/70 dark:bg-surface/40 p-5 flex items-center gap-3">
                  <Lock
                    size={18}
                    className="text-neutral-400 shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <h2 className="text-sm font-bold text-neutral-100">
                      {t("statsLockedTitle")}
                    </h2>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {t("statsLockedDesc")}
                    </p>
                  </div>
                </section>
              )}

              {data.canViewAchievements ? (
                <AchievementsGallery
                  achievements={data.achievements}
                  highlights={data.highlights}
                  isVisitorMode
                  onPinAchievement={() => {}}
                />
              ) : (
                <section className="rounded-2xl border border-dashed border-neutral-700 dark:border-primary/25 bg-card/70 dark:bg-surface/40 p-5 flex items-center gap-3">
                  <Lock
                    size={18}
                    className="text-neutral-400 shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <h2 className="text-sm font-bold text-neutral-100">
                      {t("achievementsLockedTitle")}
                    </h2>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {t("achievementsLockedDesc")}
                    </p>
                  </div>
                </section>
              )}
            </div>
          )}

          {activeTab === "retrospective" && canShowRetroTab && (
            <div role="tabpanel">
              <RetrospectivePanel
                initialRetrospective={retrospective}
                isGamified={isGamified}
                isOwnProfile={false}
                targetUsername={data.user.username}
                onOpenExportModal={(retroData) =>
                  setPreviewModalState({
                    isOpen: true,
                    mode: "retrospective",
                    retro: retroData,
                  })
                }
              />
            </div>
          )}

          {previewModalState.isOpen && (
            <ProfilePreviewCardModal
              isOpen={previewModalState.isOpen}
              onClose={() =>
                setPreviewModalState((prev) => ({ ...prev, isOpen: false }))
              }
              initialMode={previewModalState.mode}
              isGamified={isGamified}
              user={mappedUser}
              activeFrameId={mappedUser.avatarFrame}
              stats={data.canViewStats ? fallbackStats : null}
              highlights={data.highlights}
              achievements={data.canViewAchievements ? data.achievements : []}
              retrospective={
                data.canViewStats
                  ? (previewModalState.retro ?? retrospective)
                  : null
              }
            />
          )}
        </>
      )}
    </div>
  );
}
