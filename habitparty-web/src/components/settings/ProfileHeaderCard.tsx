"use client";

import { ExternalLink, Sparkles, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { FounderBadge } from "@/components/ui/FounderBadge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { UserPlanBadge, UserRoleBadge } from "@/components/ui/UserStatusBadges";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useProfilePhotoUpload } from "@/hooks/useProfilePhotoUpload";
import type { AppLocale } from "@/i18n/config";
import { useActiveAvatarFrame } from "@/store/avatarFrameStore";
import { useUserStore } from "@/store/userStore";
import type { ProfileHeaderCardProps } from "@/types/settings";
import { cn, formatCoins, resolveUserLevelState } from "@/utils";

export function ProfileHeaderCard({
  initialUser,
  isCompact,
}: ProfileHeaderCardProps) {
  const t = useTranslations("settings.profileHeader");
  const { isGamified } = useExperienceMode();
  const locale = useLocale() as AppLocale;

  const storeUser = useUserStore((s) => s.user);
  const user = storeUser || initialUser;
  const activeFrameId = useActiveAvatarFrame();

  const {
    fileInputRef,
    isPending,
    previewUrl,
    isDraggingOver,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useProfilePhotoUpload({
    messages: {
      invalidImageToast: t("invalidImageToast"),
      imageSizeToast: t("imageSizeToast"),
      photoSuccessToast: t("photoSuccessToast"),
      photoErrorToast: t("photoErrorToast"),
    },
  });

  const displayName =
    user?.fullName ||
    user?.username ||
    (isGamified ? t("adventurer") : t("member"));
  const displayPhoto = previewUrl || user?.profilePhotoUrl;
  const { levelTitle } = resolveUserLevelState(user, locale, isGamified);

  return (
    <div
      className={cn(
        "rounded-2xl border border-neutral-700 dark:border-primary/20 bg-card dark:bg-surface/45 shadow-xs dark:shadow-none flex flex-col md:flex-row items-center md:items-start justify-between gap-6 md:gap-8",
        isCompact ? "p-4 sm:p-5" : "p-6 sm:p-7",
      )}
    >
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 min-w-0 flex-1 w-full">
        {/* AVATAR COM LINK PARA VITRINE DE PERFIL (/profile) */}
        <div className="relative group shrink-0">
          <Link
            href="/profile"
            className="relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-gold cursor-pointer transition-transform group-hover:scale-[1.02] block"
            title={t("viewProfileTitle")}
            aria-label={t("viewProfileTitle")}
          >
            <UserAvatar
              src={displayPhoto}
              name={displayName}
              size="xl"
              hasRing={Boolean(user?.isPremium)}
              frameId={activeFrameId}
              className="shadow-md dark:shadow-xl"
            />

            {/* Overlay sutil de navegação para /profile no hover */}
            <div className="absolute inset-0 rounded-full bg-black/65 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <ExternalLink size={20} className="text-white drop-shadow-sm" />
              <span className="text-tiny font-bold mt-1 text-white drop-shadow-sm">
                {t("viewProfile")}
              </span>
            </div>
          </Link>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            tabIndex={-1}
            onChange={handleFileChange}
          />
        </div>

        {/* INFORMAÇÕES DE TEXTO E STATUS */}
        <div className="flex flex-col items-center sm:items-start gap-2 text-center sm:text-left min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-50 truncate">
              {displayName}
            </h2>

            {user?.isFounder && <FounderBadge size="sm" />}

            <UserPlanBadge
              isPremium={user?.isPremium}
              premiumLabel={t("premiumBadge")}
              freeLabel={t("freeBadge")}
            />

            <UserRoleBadge role={user?.role} adminLabel={t("adminBadge")} />
          </div>

          {user?.username && (
            <p className="text-body-s text-neutral-300 font-medium">
              @{user.username}
            </p>
          )}

          {user?.email && (
            <p className="text-tiny text-neutral-400">{user.email}</p>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap justify-center sm:justify-start">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface/60 border border-neutral-700 dark:border-primary/20 text-xs text-neutral-200">
              <Sparkles size={14} className="text-gold" />
              <span>{levelTitle}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface/60 border border-neutral-700 dark:border-primary/20 text-xs text-neutral-200">
              <span className="text-gold font-bold">
                {formatCoins(user?.currentCoins ?? 0, { locale })}
              </span>
              <span>{isGamified ? t("coinsLabel") : t("creditsLabel")}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface/60 border border-neutral-700 dark:border-primary/20 text-xs text-neutral-200">
              <span className="text-magenta font-bold">
                {user?.totalXp ?? 0}
              </span>
              <span>{isGamified ? t("xpLabel") : t("pointsLabel")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* DROPZONE INTERATIVA DE UPLOAD DE FOTO */}
      <div className="shrink-0 w-full md:w-auto self-stretch md:self-center flex items-center justify-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          disabled={isPending}
          className={cn(
            "w-full md:w-56 rounded-xl border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center text-center group/drop select-none",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
            isCompact ? "p-3 gap-1" : "p-4 gap-1.5",
            isDraggingOver
              ? "border-primary bg-primary/10 text-primary dark:border-gold dark:bg-gold/15 dark:text-gold shadow-glow-gold-xs"
              : "border-neutral-600 bg-surface/50 hover:bg-surface hover:border-primary/50 dark:border-primary/35 dark:bg-surface/40 dark:hover:bg-surface/70 dark:hover:border-gold/50 text-neutral-300 hover:text-neutral-100",
            isPending && "opacity-60 cursor-not-allowed",
          )}
        >
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
              isDraggingOver
                ? "bg-primary/20 text-primary dark:bg-gold/25 dark:text-gold"
                : "bg-primary/10 text-primary dark:bg-primary-dark/40 dark:text-gold group-hover/drop:bg-primary/15 dark:group-hover/drop:bg-gold/20",
            )}
          >
            <UploadCloud
              size={18}
              className={isPending ? "animate-pulse opacity-70" : ""}
            />
          </div>
          <span className="text-xs font-bold text-neutral-100 group-hover/drop:text-primary dark:group-hover/drop:text-gold transition-colors">
            {isPending
              ? t("uploadingPhoto")
              : isDraggingOver
                ? t("dropzoneActive")
                : t("dropzoneDefault")}
          </span>
          <span className="text-label-g text-neutral-400 leading-tight font-normal">
            {t("dropzoneHint")}
          </span>
        </button>
      </div>
    </div>
  );
}
