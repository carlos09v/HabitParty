"use client";

import {
  Calendar,
  Camera,
  Crown,
  Eye,
  Pencil,
  Settings,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  Trophy,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateShowcaseProfileAction } from "@/actions/showcaseActions";
import { FounderBadge } from "@/components/ui/FounderBadge";
import { UserAvatar } from "@/components/ui/UserAvatar";
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
  import("@/components/settings/AvatarFrameSettings").then(
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
  const updateUserPartial = useUserStore((s) => s.updateUserPartial);
  const user = storeUser || initialUser;

  const activeFrameId = useActiveAvatarFrame();

  const [bio, setBio] = useState(user?.bio || "");
  const [draftBio, setDraftBio] = useState(user?.bio || "");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isFramePickerOpen, setIsFramePickerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

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

  const formattedMemberSince = formatMonthYear(user?.createdAt, locale);

  const handleSaveBio = () => {
    const trimmed = draftBio.trim();
    startTransition(async () => {
      const res = await updateShowcaseProfileAction({ bio: trimmed });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setBio(trimmed);
      updateUserPartial({ bio: trimmed });
      setIsEditingBio(false);
      toast.success(t("bioSaved"));
    });
  };

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
                setIsEditingBio(false);
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
                      <span className="text-[10px] font-bold mt-1 text-white drop-shadow-sm">
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
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-gold/20 text-amber-700 dark:text-gold border border-gold/45">
                    <Crown size={11} />
                    <span>VIP</span>
                  </span>
                )}

                {user?.emailVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
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
              <div className="mt-1">
                {isEditingBio && !isVisitorMode ? (
                  <div className="flex flex-col gap-2 max-w-xl">
                    <textarea
                      rows={2}
                      maxLength={160}
                      value={draftBio}
                      onChange={(e) => setDraftBio(e.target.value)}
                      placeholder={t("bioPlaceholder")}
                      className="w-full rounded-xl border border-neutral-600 bg-card focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-primary/35 dark:bg-surface/90 dark:focus:border-gold dark:focus:ring-2 dark:focus:ring-gold/50 px-3 py-2 text-body-s text-neutral-50 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none resize-none"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-tiny text-neutral-400">
                        {draftBio.length}/160
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => {
                            setDraftBio(bio);
                            setIsEditingBio(false);
                          }}
                          className="px-3 py-1 rounded-lg text-xs font-semibold text-neutral-300 hover:bg-surface-hover cursor-pointer"
                        >
                          {t("cancelBio")}
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={handleSaveBio}
                          className="px-3 py-1 rounded-lg text-xs font-bold bg-gold text-on-gold hover:bg-gold-hover cursor-pointer"
                        >
                          {t("saveBio")}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 group max-w-xl">
                    <p
                      className={cn(
                        "text-body-s leading-relaxed",
                        bio ? "text-neutral-200" : "text-neutral-400 italic",
                      )}
                    >
                      {bio ||
                        (isVisitorMode
                          ? isGamified
                            ? t("emptyBioVisitor")
                            : t("emptyBioVisitorEssential")
                          : t("addBio"))}
                    </p>
                    {!isVisitorMode && (
                      <button
                        type="button"
                        onClick={() => {
                          setDraftBio(bio);
                          setIsEditingBio(true);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-tiny font-semibold text-neutral-400 hover:text-amber-700 dark:hover:text-gold hover:bg-primary/10 transition-colors cursor-pointer shrink-0"
                        title={t("editBio")}
                      >
                        <Pencil size={12} />
                        <span>{t("editBio")}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PAINEL DE NÍVEL & PONTOS DE CONQUISTA */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-72 shrink-0">
            {/* Card de Pontos de Conquista */}
            <div className="flex items-center gap-3.5 rounded-xl border border-amber-500/30 dark:border-gold/35 bg-amber-500/[0.08] dark:bg-gradient-to-br dark:from-gold/15 dark:via-amber-500/5 dark:to-transparent p-3.5">
              <div className="w-11 h-11 rounded-xl bg-gold/20 border border-gold/45 flex items-center justify-center text-amber-700 dark:text-gold shrink-0">
                <Trophy size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300 block">
                  {t("achievementPointsLabel")}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-amber-700 dark:text-gold tabular-nums">
                    {stats.achievementPoints}
                  </span>
                  <span className="text-tiny font-semibold text-neutral-300">
                    •{" "}
                    {t("unlockedCountLabel", {
                      unlocked: stats.unlockedAchievementsCount,
                      total: stats.totalAchievementsCount,
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Card de Patente / Nível & Barra de XP */}
            <div className="flex flex-col gap-2 rounded-xl border border-neutral-700 dark:border-primary/25 bg-surface/60 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-neutral-100 truncate">
                  {levelTitle}
                </span>
                <span className="text-tiny font-bold text-amber-700 dark:text-gold tabular-nums shrink-0">
                  {progress.percent}%
                </span>
              </div>

              <div className="h-2 w-full rounded-full bg-neutral-700 dark:bg-neutral-900 overflow-hidden border border-neutral-600/50 dark:border-primary/15">
                <div
                  className="h-full w-full origin-left bg-gradient-to-r from-amber-500 via-gold to-yellow-300 transition-transform duration-500"
                  style={{
                    transform: `scaleX(${Math.min(100, Math.max(0, progress.percent)) / 100})`,
                  }}
                />
              </div>

              <span className="text-[11px] text-neutral-400 truncate">
                {!progress.isMaxLevel
                  ? t("xpProgressLabel", {
                      xp: currentXp,
                      remaining: progress.remainingXp,
                      nextTitle: nextLevelTitle,
                    })
                  : t("maxLevelReached", { xp: currentXp })}
              </span>
            </div>
          </div>
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
