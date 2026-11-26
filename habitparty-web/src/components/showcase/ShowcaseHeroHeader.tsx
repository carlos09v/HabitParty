"use client";

import {
  Calendar,
  Camera,
  Eye,
  Globe,
  Loader2,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  Users,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { ShowcaseBioEditor } from "@/components/showcase/ShowcaseBioEditor";
import { ShowcaseLevelProgressPanel } from "@/components/showcase/ShowcaseLevelProgressPanel";
import { FounderBadge } from "@/components/ui/FounderBadge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { UserPlanBadge } from "@/components/ui/UserStatusBadges";
import { resolveAvatarFrameId } from "@/constants/avatarFrames";
import { resolveProfileTitleLabel } from "@/constants/cosmetics";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useProfilePhotoUpload } from "@/hooks/useProfilePhotoUpload";
import { useResolvedUser } from "@/hooks/useResolvedUser";
import type { AppLocale } from "@/i18n/config";
import {
  resolveUserAvatarFrame,
  useActiveAvatarFrame,
  useUserStore,
} from "@/store/userStore";
import type {
  AchievementItemResponseDTO,
  ShowcaseStatsResponseDTO,
} from "@/types/showcase";
import type { UserRetrospectiveData } from "@/types/social";
import type { UserResponseDTO } from "@/types/user";
import { cn } from "@/utils/cn";
import { formatMonthYear } from "@/utils/date";
import { resolveUserLevelState } from "@/utils/levels";
import type { VisitorAudience } from "@/utils/showcaseUtils";

const preloadAvatarFramePickerModal = () =>
  import("@/components/showcase/AvatarFramePickerModal").then(
    (mod) => mod.AvatarFramePickerModal,
  );

const AvatarFramePickerModal = dynamic(preloadAvatarFramePickerModal, {
  ssr: false,
});

interface ShowcaseHeroHeaderProps {
  user: UserResponseDTO;
  stats: ShowcaseStatsResponseDTO;
  achievements?: AchievementItemResponseDTO[];
  unlockedArtifactsCount?: number;
  retrospective?: UserRetrospectiveData | null;
  eligibleRetroArchetypes?: readonly string[];
  isVisitorMode: boolean;
  visitorAudience?: VisitorAudience;
  onVisitorAudienceChange?: (audience: VisitorAudience) => void;
  onToggleVisitorMode: () => void;
  isOtherUser?: boolean;
  hideStats?: boolean;
  hideAchievements?: boolean;
  onOpenPreviewCard?: () => void;
  onPreloadPreviewCard?: () => void;
  onRequestRetrospective?: () => void;
  onOpenProgression?: () => void;
  extraHeaderActions?: ReactNode;
}

export function ShowcaseHeroHeader({
  user: initialUser,
  stats,
  achievements = [],
  unlockedArtifactsCount,
  retrospective = null,
  eligibleRetroArchetypes,
  isVisitorMode,
  visitorAudience = "public",
  onVisitorAudienceChange,
  onToggleVisitorMode,
  isOtherUser = false,
  hideStats = false,
  hideAchievements = false,
  onOpenPreviewCard,
  onPreloadPreviewCard,
  onRequestRetrospective,
  onOpenProgression,
  extraHeaderActions,
}: ShowcaseHeroHeaderProps) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("showcase.header");
  const tTitles = useTranslations("showcase.titles");
  const { isGamified } = useExperienceMode();

  const storeUser = useUserStore((s) => s.user);
  const storeFrameId = useActiveAvatarFrame();
  const resolvedOwnUser = useResolvedUser(initialUser);
  const user = isOtherUser ? initialUser : resolvedOwnUser;
  const activeFrameId = isOtherUser
    ? resolveAvatarFrameId(initialUser.avatarFrame)
    : storeUser && storeUser.id === initialUser.id
      ? storeFrameId
      : resolveUserAvatarFrame(user?.avatarFrame, Boolean(user?.isPremium));
  const [isFramePickerOpen, setIsFramePickerOpen] = useState(false);

  const {
    fileInputRef,
    isPending: isPhotoPending,
    previewUrl,
    isDraggingOver,
    fileInputProps,
    dropzoneHandlers,
  } = useProfilePhotoUpload({
    disabled: isVisitorMode || isOtherUser,
    messages: {
      invalidImageToast: t("invalidImageToast"),
      imageSizeToast: t("imageSizeToast"),
      photoSuccessToast: t("photoSuccessToast"),
      photoErrorToast: t("photoErrorToast"),
    },
  });

  const fallbackDisplayName = t(
    isGamified ? "defaultDisplayNameGamified" : "defaultDisplayNameEssential",
  );
  const displayName = user?.fullName || user?.username || fallbackDisplayName;
  const username = user?.username ? `@${user.username}` : "";
  const isPremium = Boolean(user?.isPremium);

  const { currentXp, progress, levelTitle, nextLevelTitle } =
    resolveUserLevelState(user, locale, isGamified, stats.totalXp);

  const storeTimezone = useUserStore((s) => s.user?.timezone);
  const formattedMemberSince = formatMonthYear(
    user?.createdAt,
    locale,
    isOtherUser ? user?.timezone : (storeTimezone ?? user?.timezone),
  );
  const equippedTitleLabel = resolveProfileTitleLabel(
    user?.equippedTitle,
    isGamified,
    tTitles,
  );
  const activePresetId = previewUrl ? null : user?.avatarPreset;

  return (
    <>
      <section className="@container relative overflow-hidden rounded-2xl border border-neutral-700 dark:border-primary/30 bg-card dark:bg-surface/65 shadow-card-deep dark:shadow-xl p-5 sm:p-7">
        {/* Luz ambiente periférica pré-composta (Zero Blur Filter GPU) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-35 dark:opacity-100"
          style={{
            background:
              "radial-gradient(280px circle at 94% 8%, var(--hero-glow-top, rgba(237, 229, 57, 0.14)), transparent 70%), radial-gradient(280px circle at 6% 92%, var(--hero-glow-bottom, rgba(124, 58, 237, 0.2)), transparent 70%)",
          }}
        />

        {/* BARRA SUPERIOR: Selo da Vitrine + Controles de Visualização */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-neutral-700 dark:border-primary/15">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 dark:bg-gold/10 border border-primary/30 dark:border-gold/30">
            {isGamified ? (
              <Swords size={14} className="text-amber-700 dark:text-gold" />
            ) : (
              <Target size={14} className="text-sky-700 dark:text-cyan-400" />
            )}
            <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-100">
              {isGamified ? t("badgeGamified") : t("badgeEssential")}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {extraHeaderActions}

            {!isOtherUser && !isVisitorMode && onOpenPreviewCard && (
              <button
                type="button"
                onClick={onOpenPreviewCard}
                onMouseEnter={onPreloadPreviewCard}
                onFocus={onPreloadPreviewCard}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-gold text-on-gold hover:bg-amber-300 shadow-glow-gold-xs transition-colors cursor-pointer"
              >
                <Share2 size={13} aria-hidden="true" />
                <span>{t("shareCardButton")}</span>
              </button>
            )}

            {!isVisitorMode && !isOtherUser && (
              <button
                type="button"
                onClick={() => setIsFramePickerOpen(true)}
                onMouseEnter={preloadAvatarFramePickerModal}
                onFocus={preloadAvatarFramePickerModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border bg-surface/70 hover:bg-surface border-neutral-700 text-neutral-200 hover:border-gold/40 hover:text-neutral-50 dark:border-primary/25 transition-colors cursor-pointer"
              >
                <Sparkles
                  size={13}
                  className="text-amber-700 dark:text-gold"
                  aria-hidden="true"
                />
                <span>{t("changeFrameButton")}</span>
              </button>
            )}

            {!isOtherUser && (
              <button
                type="button"
                onClick={() => {
                  setIsFramePickerOpen(false);
                  onToggleVisitorMode();
                }}
                aria-pressed={isVisitorMode}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer",
                  isVisitorMode
                    ? "bg-amber-500/15 dark:bg-gold/20 border-amber-500/40 dark:border-gold text-amber-800 dark:text-gold shadow-glow-gold-xs"
                    : "bg-surface/70 hover:bg-surface border-neutral-700 text-neutral-200 hover:border-primary/45 hover:text-neutral-50 dark:border-primary/25",
                )}
              >
                <Eye size={13} aria-hidden="true" />
                <span>
                  {isVisitorMode
                    ? t("ownerModeActive")
                    : t("visitorModeActive")}
                </span>
              </button>
            )}

            {!isVisitorMode && !isOtherUser && (
              <Link
                href="/settings?tab=profile"
                aria-label={t("settingsButton")}
                title={t("settingsButton")}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-surface/70 hover:bg-surface border border-neutral-700 text-neutral-200 hover:border-primary/45 hover:text-neutral-50 dark:border-primary/25 transition-colors"
              >
                <Settings size={13} aria-hidden="true" />
                <span className="hidden sm:inline">{t("settingsButton")}</span>
              </Link>
            )}
          </div>
        </div>

        {/* AVISO DE MODO VISITANTE COM SELETOR DE PÚBLICO */}
        {isVisitorMode && !isOtherUser && (
          <div className="relative z-10 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3.5 py-2.5 text-xs font-medium text-amber-800 dark:text-gold">
            <div className="flex items-center gap-2">
              <Eye size={14} className="shrink-0" aria-hidden="true" />
              <span>{t("visitorBanner")}</span>
            </div>

            {onVisitorAudienceChange && (
              <fieldset className="m-0 inline-flex items-center gap-1 p-0.5 rounded-lg bg-surface/80 border border-amber-500/35 shrink-0 self-start sm:self-auto">
                <legend className="sr-only">{t("visitorAudienceAria")}</legend>
                <button
                  type="button"
                  aria-pressed={visitorAudience === "public"}
                  onClick={() => onVisitorAudienceChange("public")}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer",
                    visitorAudience === "public"
                      ? "bg-gold text-on-gold shadow-xs"
                      : "text-neutral-300 hover:text-neutral-100",
                  )}
                >
                  <Globe size={11} aria-hidden="true" />
                  <span>{t("visitorAudiencePublic")}</span>
                </button>
                <button
                  type="button"
                  aria-pressed={visitorAudience === "friend"}
                  onClick={() => onVisitorAudienceChange("friend")}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer",
                    visitorAudience === "friend"
                      ? "bg-gold text-on-gold shadow-xs"
                      : "text-neutral-300 hover:text-neutral-100",
                  )}
                >
                  <Users size={11} aria-hidden="true" />
                  <span>{t("visitorAudienceFriend")}</span>
                </button>
              </fieldset>
            )}
          </div>
        )}

        {/* CORPO DO CARTÃO HERO */}
        <div className="relative z-10 flex flex-col @4xl:flex-row items-start @4xl:items-center justify-between gap-6">
          {/* IDENTIDADE + AVATAR + BIO */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 flex-1 min-w-0 w-full">
            <div className="shrink-0 pl-1">
              {!isVisitorMode && !isOtherUser ? (
                <div className="relative group shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    {...dropzoneHandlers}
                    disabled={isPhotoPending}
                    className="relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-gold cursor-pointer transition-transform group-hover:scale-[1.02] block disabled:cursor-not-allowed"
                    title={t("changePhoto")}
                    aria-label={t("changePhoto")}
                  >
                    <UserAvatar
                      src={previewUrl || user?.profilePhotoUrl}
                      name={displayName}
                      size="xl"
                      hasRing={isPremium}
                      frameId={activeFrameId}
                      presetId={activePresetId}
                    />

                    {/* Overlay sutil de câmera no hover */}
                    <div
                      className={cn(
                        "absolute inset-0 rounded-full bg-black/65 flex flex-col items-center justify-center text-white transition-opacity z-20",
                        isDraggingOver || isPhotoPending
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100",
                      )}
                    >
                      {isPhotoPending ? (
                        <Loader2
                          size={22}
                          className="animate-spin text-amber-400 dark:text-gold"
                          aria-hidden="true"
                        />
                      ) : (
                        <Camera
                          size={22}
                          className="text-white drop-shadow-sm"
                          aria-hidden="true"
                        />
                      )}
                      <span className="text-label-m font-bold mt-1 text-white drop-shadow-sm">
                        {isPhotoPending
                          ? t("uploadingPhoto")
                          : t("changePhoto")}
                      </span>
                    </div>

                    {/* Selo persistente de edição de foto em telas touch (< md) */}
                    <span
                      aria-hidden="true"
                      className="md:hidden absolute -bottom-0.5 -right-0.5 z-30 w-7 h-7 rounded-full bg-surface border border-neutral-600 dark:border-primary/40 text-neutral-100 shadow-md flex items-center justify-center"
                    >
                      {isPhotoPending ? (
                        <Loader2
                          size={13}
                          className="animate-spin text-amber-400 dark:text-gold"
                        />
                      ) : (
                        <Camera size={13} />
                      )}
                    </span>
                  </button>

                  <input {...fileInputProps} />
                </div>
              ) : (
                <UserAvatar
                  src={previewUrl || user?.profilePhotoUrl}
                  name={displayName}
                  size="xl"
                  hasRing={isPremium}
                  frameId={activeFrameId}
                  presetId={activePresetId}
                />
              )}
            </div>

            <div className="flex flex-col gap-2 min-w-0 flex-1 w-full">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <h1 className="text-2xl sm:text-headline-s font-extrabold text-neutral-50 truncate max-w-full">
                  {displayName}
                </h1>

                {username && (
                  <span className="text-body-s font-medium text-neutral-400 truncate max-w-full">
                    {username}
                  </span>
                )}

                {user?.isFounder && <FounderBadge size="md" showLabel />}

                {isPremium && (
                  <UserPlanBadge
                    isPremium
                    premiumLabel="VIP"
                    freeLabel=""
                    className="uppercase tracking-wider font-black"
                  />
                )}

                {user?.emailVerified && (
                  <span
                    role="img"
                    aria-label={t("verifiedEmailBadge")}
                    title={t("verifiedEmailBadge")}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-tiny font-semibold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30"
                  >
                    <ShieldCheck size={11} aria-hidden="true" />
                  </span>
                )}
              </div>

              {equippedTitleLabel && (
                <p
                  title={t("equippedTitleAria", {
                    title: equippedTitleLabel,
                  })}
                  className="inline-flex items-center gap-1.5 w-fit px-2.5 py-0.5 rounded-full bg-gold/15 border border-gold/40 text-xs font-extrabold text-amber-800 dark:text-gold"
                >
                  <Sparkles size={12} aria-hidden="true" />
                  <span className="break-words">{equippedTitleLabel}</span>
                </p>
              )}

              {formattedMemberSince && (
                <div className="flex items-center gap-1.5 text-tiny text-neutral-400">
                  <Calendar size={12} />
                  <span>
                    {t("memberSince", { date: formattedMemberSince })}
                  </span>
                </div>
              )}

              {/* BIO / LEMA DO PERFIL */}
              <ShowcaseBioEditor
                currentBio={user?.bio}
                isVisitorMode={isVisitorMode || isOtherUser}
                isGamified={isGamified}
              />
            </div>
          </div>

          {/* PAINEL DE NÍVEL & PONTOS DE CONQUISTA */}
          <ShowcaseLevelProgressPanel
            stats={stats}
            currentXp={currentXp}
            levelTitle={levelTitle}
            nextLevelTitle={nextLevelTitle}
            progress={progress}
            isGamified={isGamified}
            hideStats={hideStats}
            hideAchievements={hideAchievements}
            onOpenProgression={onOpenProgression}
          />
        </div>
      </section>

      {isFramePickerOpen && (
        <AvatarFramePickerModal
          isOpen={isFramePickerOpen}
          onClose={() => setIsFramePickerOpen(false)}
          achievements={achievements}
          stats={stats}
          unlockedArtifactsCount={unlockedArtifactsCount}
          retrospective={retrospective}
          eligibleRetroArchetypes={eligibleRetroArchetypes}
          onRequestRetrospective={onRequestRetrospective}
        />
      )}
    </>
  );
}
