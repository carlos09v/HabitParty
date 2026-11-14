"use client";

import {
  Calendar,
  Camera,
  Eye,
  Settings,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { ShowcaseBioEditor } from "@/components/showcase/ShowcaseBioEditor";
import { ShowcaseLevelProgressPanel } from "@/components/showcase/ShowcaseLevelProgressPanel";
import { FounderBadge } from "@/components/ui/FounderBadge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { UserPlanBadge } from "@/components/ui/UserStatusBadges";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useIdlePreload } from "@/hooks/useIdlePreload";
import { useProfilePhotoUpload } from "@/hooks/useProfilePhotoUpload";
import type { AppLocale } from "@/i18n/config";
import { useActiveAvatarFrame } from "@/store/avatarFrameStore";
import { useUserStore } from "@/store/userStore";
import type { ShowcaseStatsResponseDTO } from "@/types/showcase";
import type { UserResponseDTO } from "@/types/user";
import { cn, formatMonthYear, resolveUserLevelState } from "@/utils";

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
  isVisitorMode: boolean;
  onToggleVisitorMode: () => void;
  isCompact?: boolean;
}

export function ShowcaseHeroHeader({
  user: initialUser,
  stats,
  isVisitorMode,
  onToggleVisitorMode,
  isCompact = false,
}: ShowcaseHeroHeaderProps) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("showcase.header");
  const { isGamified } = useExperienceMode();

  const storeUser = useUserStore((s) => s.user);
  const user = storeUser || initialUser;
  const activeFrameId = useActiveAvatarFrame();
  const [isFramePickerOpen, setIsFramePickerOpen] = useState(false);

  const {
    fileInputRef,
    isPending: isPhotoPending,
    previewUrl,
    isDraggingOver,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useProfilePhotoUpload({
    disabled: isVisitorMode,
    messages: {
      invalidImageToast: t("invalidImageToast"),
      imageSizeToast: t("imageSizeToast"),
      photoSuccessToast: t("photoSuccessToast"),
      photoErrorToast: t("photoErrorToast"),
    },
  });

  useIdlePreload(preloadAvatarFramePickerModal);

  const displayName = user?.fullName || user?.username || "Aventureiro";
  const username = user?.username ? `@${user.username}` : "";
  const isPremium = Boolean(user?.isPremium);

  const { currentXp, progress, levelTitle, nextLevelTitle } =
    resolveUserLevelState(user, locale, isGamified, stats.totalXp);

  const storeTimezone = useUserStore((s) => s.user?.timezone);
  const formattedMemberSince = formatMonthYear(
    user?.createdAt,
    locale,
    storeTimezone ?? user?.timezone,
  );

  return (
    <>
      <section
        className={cn(
          "relative overflow-hidden rounded-2xl border border-neutral-700 dark:border-primary/30 bg-card dark:bg-surface/65 shadow-card-deep dark:shadow-xl",
          isCompact ? "p-4 sm:p-6" : "p-5 sm:p-7",
        )}
      >
        {/* Luz ambiente periférica pré-composta (Zero Blur Filter GPU) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-35 dark:opacity-100"
          style={{
            background:
              "radial-gradient(280px circle at 94% 8%, rgba(237, 229, 57, 0.14), transparent 70%), radial-gradient(280px circle at 6% 92%, rgba(124, 58, 237, 0.2), transparent 70%)",
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
            {!isVisitorMode && (
              <button
                type="button"
                onClick={() => setIsFramePickerOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border bg-surface/70 hover:bg-surface border-neutral-700 text-neutral-200 hover:border-gold/40 hover:text-neutral-50 dark:border-primary/25 transition-colors cursor-pointer"
              >
                <Sparkles size={13} className="text-amber-700 dark:text-gold" />
                <span>{t("changeFrameButton")}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsFramePickerOpen(false);
                onToggleVisitorMode();
              }}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer",
                isVisitorMode
                  ? "bg-amber-500/15 dark:bg-gold/20 border-amber-500/40 dark:border-gold text-amber-700 dark:text-gold shadow-glow-gold-xs"
                  : "bg-surface/70 hover:bg-surface border-neutral-700 text-neutral-200 hover:border-primary/45 hover:text-neutral-50 dark:border-primary/25",
              )}
            >
              <Eye size={13} />
              <span>
                {isVisitorMode ? t("ownerModeActive") : t("visitorModeActive")}
              </span>
            </button>

            {!isVisitorMode && (
              <Link
                href="/settings?tab=profile"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-surface/70 hover:bg-surface border border-neutral-700 text-neutral-200 hover:border-primary/45 hover:text-neutral-50 dark:border-primary/25 transition-colors"
              >
                <Settings size={13} />
                <span>{t("settingsButton")}</span>
              </Link>
            )}
          </div>
        </div>

        {/* AVISO DE MODO VISITANTE */}
        {isVisitorMode && (
          <div className="relative z-10 mb-5 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-medium text-amber-700 dark:text-gold">
            <Eye size={14} className="shrink-0" />
            <span>{t("visitorBanner")}</span>
          </div>
        )}

        {/* CORPO DO CARTÃO HERO */}
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* IDENTIDADE + AVATAR + BIO */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 flex-1 min-w-0 w-full">
            <div className="shrink-0 pl-1">
              {!isVisitorMode ? (
                <div className="relative group shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
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
                      <Camera
                        size={22}
                        className={
                          isPhotoPending
                            ? "animate-spin text-amber-400 dark:text-gold"
                            : "text-white drop-shadow-sm"
                        }
                      />
                      <span className="text-label-m font-bold mt-1 text-white drop-shadow-sm">
                        {isPhotoPending
                          ? t("uploadingPhoto")
                          : t("changePhoto")}
                      </span>
                    </div>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    tabIndex={-1}
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <UserAvatar
                  src={previewUrl || user?.profilePhotoUrl}
                  name={displayName}
                  size="xl"
                  hasRing={isPremium}
                  frameId={activeFrameId}
                />
              )}
            </div>

            <div className="flex flex-col gap-2 min-w-0 flex-1 w-full">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-headline-s font-extrabold text-neutral-50 truncate">
                  {displayName}
                </h1>

                {username && (
                  <span className="text-body-s font-medium text-neutral-400">
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
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-tiny font-semibold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                    <ShieldCheck size={11} />
                  </span>
                )}
              </div>

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
                isVisitorMode={isVisitorMode}
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
          />
        </div>
      </section>

      {isFramePickerOpen && (
        <AvatarFramePickerModal
          isOpen={isFramePickerOpen}
          onClose={() => setIsFramePickerOpen(false)}
          title={t("changeFrameButton")}
        />
      )}
    </>
  );
}
