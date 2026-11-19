import { Lock, UserX } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { PublicFriendActionsBar } from "@/components/showcase/PublicFriendActionsBar";
import { PublicShowcaseView } from "@/components/showcase/PublicShowcaseView";
import { ShowcaseStatsGrid } from "@/components/showcase/ShowcaseStatsGrid";
import { ContextualBackButton } from "@/components/ui/ContextualBackButton";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { resolveAvatarFrameId } from "@/constants/avatarFrames";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";
import {
  getPublicUserRetrospective,
  getPublicUserShowcase,
} from "@/services/showcaseService";
import { getCurrentUser } from "@/services/userService";

type PublicProfilePageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({
  params,
}: PublicProfilePageProps): Promise<Metadata> {
  const [{ username }, t] = await Promise.all([
    params,
    getTranslations("showcase.metadata"),
  ]);
  const cleanHandle = decodeURIComponent(username);
  return {
    title: `@${cleanHandle} | HabitParty`,
    description: t("description"),
  };
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);

  const [currentUser, publicShowcase, publicRetrospective, t] =
    await Promise.all([
      getCurrentUser(),
      getPublicUserShowcase(decodedUsername),
      getPublicUserRetrospective(decodedUsername),
      getTranslations("showcase.publicProfile"),
    ]);

  if (!currentUser) {
    redirect("/signIn");
  }

  const isGamified = currentUser.experienceMode === "GAMIFIED";

  return (
    <ScopedIntlProvider scope="showcase">
      <PageWrapper>
        {!publicShowcase ? (
          <div className="flex flex-col items-center justify-center max-w-lg mx-auto my-12 rounded-2xl border border-neutral-700 dark:border-primary/25 bg-card dark:bg-surface/55 p-8 text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-surface border border-neutral-700 flex items-center justify-center text-neutral-400">
              <UserX size={28} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-neutral-100">
                {t("notFoundTitle")}
              </h1>
              <p className="text-xs text-neutral-400 mt-1">
                {t("notFoundDesc")}
              </p>
            </div>
            <ContextualBackButton
              fallbackHref="/profile?tab=friends"
              preferHistoryBack
              label={t("backToFriends")}
              historyLabel={t("backToPrevious")}
              className="px-4 py-2 rounded-xl bg-gold text-on-gold hover:bg-amber-300 hover:text-on-gold dark:hover:bg-amber-300 dark:hover:text-on-gold font-extrabold"
            />
          </div>
        ) : !publicShowcase.canViewProfile ? (
          <div className="flex flex-col w-full max-w-6xl mx-auto pb-16 gap-6">
            <div className="flex items-center justify-between gap-3">
              <ContextualBackButton
                fallbackHref="/profile?tab=friends"
                preferHistoryBack
                label={t("backToFriends")}
                historyLabel={t("backToPrevious")}
              />

              {publicShowcase.relationshipStatus === "SELF" && (
                <span className="text-xs font-medium text-neutral-400">
                  {t("ownProfileNotice")}
                </span>
              )}
            </div>

            <section className="rounded-2xl border border-neutral-700 dark:border-primary/30 bg-card dark:bg-surface/55 p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <UserAvatar
                    src={publicShowcase.user.profilePhotoUrl}
                    name={
                      publicShowcase.user.fullName ||
                      publicShowcase.user.username
                    }
                    size="lg"
                    hasRing={publicShowcase.user.isPremium}
                    frameId={resolveAvatarFrameId(
                      publicShowcase.user.avatarFrame,
                    )}
                    presetId={publicShowcase.user.avatarPreset}
                  />
                  <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-50 truncate">
                      {publicShowcase.user.fullName ||
                        publicShowcase.user.username}
                    </h1>
                    <p className="text-sm text-neutral-400 truncate">
                      @{publicShowcase.user.username}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <PublicFriendActionsBar data={publicShowcase} />
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
                    {publicShowcase.user.profileVisibility === "FRIENDS_ONLY"
                      ? t("privateProfileFriendsDesc")
                      : t("privateProfilePrivateDesc")}
                  </p>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <PublicShowcaseView
            data={publicShowcase}
            retrospective={publicRetrospective}
            statsSlot={
              publicShowcase.canViewStats && publicShowcase.stats ? (
                <ShowcaseStatsGrid
                  stats={publicShowcase.stats}
                  isGamified={isGamified}
                />
              ) : undefined
            }
          />
        )}
      </PageWrapper>
    </ScopedIntlProvider>
  );
}
