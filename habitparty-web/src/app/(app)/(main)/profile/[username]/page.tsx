import { AlertTriangle, UserX } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { PrivateProfileNotice } from "@/components/showcase/PrivateProfileNotice";
import { PublicFriendActionsBar } from "@/components/showcase/PublicFriendActionsBar";
import { PublicShowcaseView } from "@/components/showcase/PublicShowcaseView";
import { ShowcaseStatsGrid } from "@/components/showcase/ShowcaseStatsGrid";
import { ContextualBackButton } from "@/components/ui/ContextualBackButton";
import { RetryRefreshButton } from "@/components/ui/RetryRefreshButton";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { resolveAvatarFrameId } from "@/constants/avatarFrames";
import { ExperienceModeFallbackProvider } from "@/hooks/useExperienceMode";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";
import { getPublicUserShowcaseWithStatus } from "@/services/showcaseService";
import { getCurrentUser } from "@/services/userService";
import { resolveExperienceMode } from "@/utils/experienceMode";
import { safeDecodeURIComponent } from "@/utils/showcaseUtils";

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
  const cleanHandle = safeDecodeURIComponent(username);
  return {
    title: cleanHandle ? `@${cleanHandle} | HabitParty` : t("title"),
    description: t("description"),
  };
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { username } = await params;
  const decodedUsername = safeDecodeURIComponent(username);

  const [currentUser, showcaseResult, t, tError] = await Promise.all([
    getCurrentUser(),
    decodedUsername
      ? getPublicUserShowcaseWithStatus(decodedUsername)
      : Promise.resolve({ status: "not_found" as const }),
    getTranslations("showcase.publicProfile"),
    getTranslations("showcase.errorState"),
  ]);

  if (!currentUser || showcaseResult.status === "unauthorized") {
    redirect("/signIn");
  }

  const resolvedMode = resolveExperienceMode(currentUser.experienceMode);

  if (showcaseResult.status === "error") {
    return (
      <ExperienceModeFallbackProvider mode={resolvedMode}>
        <PageWrapper>
          <div
            role="alert"
            className="flex flex-col items-center justify-center max-w-lg mx-auto my-12 rounded-2xl border border-red-500/35 bg-card dark:bg-surface/60 p-8 text-center gap-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/35 flex items-center justify-center text-red-700 dark:text-red-400">
              <AlertTriangle size={26} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-neutral-100">
                {t("loadErrorTitle")}
              </h1>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                {t("loadErrorDesc")}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <RetryRefreshButton
                label={tError("retry")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-gold text-on-gold hover:bg-amber-300 shadow-glow-gold-xs transition-colors cursor-pointer disabled:opacity-60"
              />
              <ContextualBackButton
                fallbackHref="/profile?tab=friends"
                preferHistoryBack
                label={t("backToFriends")}
                historyLabel={t("backToPrevious")}
                className="px-4 py-2 rounded-xl border border-neutral-700 bg-surface/70 hover:bg-surface text-neutral-200 font-bold"
              />
            </div>
          </div>
        </PageWrapper>
      </ExperienceModeFallbackProvider>
    );
  }

  if (showcaseResult.status === "not_found") {
    return (
      <ExperienceModeFallbackProvider mode={resolvedMode}>
        <PageWrapper>
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
        </PageWrapper>
      </ExperienceModeFallbackProvider>
    );
  }

  const publicShowcase = showcaseResult.data;

  return (
    <ScopedIntlProvider scope="showcase">
      <ExperienceModeFallbackProvider mode={resolvedMode}>
        <PageWrapper>
          {!publicShowcase.canViewProfile ? (
            <div className="flex flex-col w-full max-w-6xl mx-auto pb-16 gap-6">
              <div className="flex items-center justify-between gap-3">
                <ContextualBackButton
                  fallbackHref="/profile?tab=friends"
                  preferHistoryBack
                  label={t("backToFriends")}
                  historyLabel={t("backToPrevious")}
                />
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

                <PrivateProfileNotice
                  variant="embedded"
                  title={t("privateProfileTitle")}
                  description={
                    publicShowcase.user.profileVisibility === "FRIENDS_ONLY"
                      ? t("privateProfileFriendsDesc")
                      : t("privateProfilePrivateDesc")
                  }
                />
              </section>
            </div>
          ) : (
            <PublicShowcaseView
              key={publicShowcase.user.id}
              data={publicShowcase}
              statsSlot={
                publicShowcase.canViewStats && publicShowcase.stats ? (
                  <ShowcaseStatsGrid
                    stats={publicShowcase.stats}
                    canViewAchievements={publicShowcase.canViewAchievements}
                  />
                ) : undefined
              }
            />
          )}
        </PageWrapper>
      </ExperienceModeFallbackProvider>
    </ScopedIntlProvider>
  );
}
