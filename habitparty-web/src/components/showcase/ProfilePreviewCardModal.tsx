"use client";

import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  Lock,
  Moon,
  RotateCw,
  Share2,
  Sparkles,
  Sun,
  User as UserIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BaseModal } from "@/components/ui/BaseModal";
import { useCopyFeedback } from "@/hooks/useCopyFeedback";
import { useUserStore } from "@/store/userStore";
import type {
  AchievementItemResponseDTO,
  ArtifactItemResponseDTO,
  ProfileHighlightResponseDTO,
  ShowcaseStatsResponseDTO,
  TaskStreakHighlightDTO,
} from "@/types/showcase";
import type { UserRetrospectiveData } from "@/types/social";
import { cn } from "@/utils/cn";
import {
  CARD_DIMENSIONS,
  exportCanvasToPngBlob,
  renderProfileOrRetrospectiveCanvas,
  triggerPngBlobDownload,
} from "@/utils/profile-card";
import {
  type ProfilePreviewCardUser,
  useProfileCardRenderInput,
} from "./useProfileCardRenderInput";

interface ProfilePreviewCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "profile" | "retrospective";
  isGamified: boolean;
  user: ProfilePreviewCardUser;
  stats?: ShowcaseStatsResponseDTO | null;
  highlights?: ProfileHighlightResponseDTO[];
  achievements?: AchievementItemResponseDTO[];
  artifacts?: ArtifactItemResponseDTO[];
  taskStreaks?: TaskStreakHighlightDTO[];
  retrospective?: UserRetrospectiveData | null;
  activeFrameId?: string | null;
}

export function ProfilePreviewCardModal({
  isOpen,
  onClose,
  initialMode = "profile",
  isGamified,
  user,
  stats,
  highlights = [],
  achievements = [],
  artifacts = [],
  taskStreaks = [],
  retrospective = null,
  activeFrameId,
}: ProfilePreviewCardModalProps) {
  const t = useTranslations("showcase.previewCard");
  const authenticatedUser = useUserStore((s) => s.user);
  const isUnauthorizedTarget = Boolean(
    authenticatedUser &&
      ((user.id && authenticatedUser.id !== user.id) ||
        (!user.id &&
          user.username &&
          authenticatedUser.username &&
          authenticatedUser.username.toLowerCase() !==
            user.username.toLowerCase())),
  );

  const canShowRetrospective = Boolean(retrospective?.eligible);
  const [mode, setMode] = useState<"profile" | "retrospective">(
    initialMode === "retrospective" && canShowRetrospective
      ? "retrospective"
      : "profile",
  );
  const [cardTheme, setCardTheme] = useState<"dark" | "light">("dark");
  const [includeFriendCode, setIncludeFriendCode] = useState(
    Boolean(user.friendCode),
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [canvasError, setCanvasError] = useState(false);
  const [renderAttempt, setRenderAttempt] = useState(0);
  const { copied: linkCopied, copy: copyProfileLink } = useCopyFeedback();
  const [canNativeShare, setCanNativeShare] = useState(false);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function",
    );
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setMode(
      initialMode === "retrospective" && canShowRetrospective
        ? "retrospective"
        : "profile",
    );
  }, [isOpen, initialMode, canShowRetrospective]);

  const renderInput = useProfileCardRenderInput({
    mode,
    theme: cardTheme,
    isGamified,
    user,
    stats,
    highlights,
    achievements,
    artifacts,
    taskStreaks,
    retrospective,
    activeFrameId,
    includeFriendCode,
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: renderAttempt força nova tentativa manual de renderização após erro
  useEffect(() => {
    if (!isOpen || !previewCanvasRef.current || isUnauthorizedTarget) return;
    const controller = new AbortController();
    setIsCanvasReady(false);
    setCanvasError(false);
    // Preview interativo usa resolução adaptativa (até 1.5x); o export PNG usa 2x dedicado.
    const previewPixelRatio =
      typeof window !== "undefined"
        ? Math.min(window.devicePixelRatio || 1, 1.5)
        : 1;
    void renderProfileOrRetrospectiveCanvas(
      previewCanvasRef.current,
      renderInput,
      previewPixelRatio,
      { signal: controller.signal },
    )
      .then(() => {
        if (!controller.signal.aborted) {
          setIsCanvasReady(true);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setCanvasError(true);
        }
      });
    return () => controller.abort();
  }, [isOpen, isUnauthorizedTarget, renderInput, renderAttempt]);

  if (isUnauthorizedTarget) {
    return null;
  }

  const renderHighResPngBlob = async (): Promise<{
    blob: Blob;
    filename: string;
  }> => {
    const offscreen = document.createElement("canvas");
    await renderProfileOrRetrospectiveCanvas(offscreen, renderInput, 2);
    const blob = await exportCanvasToPngBlob(offscreen);
    const suffix =
      mode === "retrospective" && retrospective
        ? `retrospective-${retrospective.year}`
        : "profile-card";
    const filename = `habitparty-${user.username || "member"}-${suffix}.png`;
    return { blob, filename };
  };

  const handleDownloadPng = async () => {
    if (isUnauthorizedTarget) return;
    setIsDownloading(true);
    try {
      const { blob, filename } = await renderHighResPngBlob();
      triggerPngBlobDownload(blob, filename);
      toast.success(t("downloadSuccess"));
    } catch {
      toast.error(t("downloadError"));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleNativeShare = async () => {
    if (isUnauthorizedTarget || typeof navigator?.share !== "function") return;
    setIsSharing(true);
    try {
      const profileUrl = `${window.location.origin}/profile/${encodeURIComponent(
        user.username || "member",
      )}`;
      const supportsFileShare =
        typeof navigator.canShare === "function" &&
        typeof File !== "undefined" &&
        navigator.canShare({
          files: [new File([], "preview.png", { type: "image/png" })],
        });

      if (supportsFileShare) {
        const { blob, filename } = await renderHighResPngBlob();
        const file = new File([blob], filename, { type: "image/png" });
        await navigator.share({
          title: t("modalTitle"),
          url: profileUrl,
          files: [file],
        });
      } else {
        await navigator.share({
          title: t("modalTitle"),
          url: profileUrl,
        });
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      toast.error(t("shareError"));
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyProfileLink = () => {
    const profileUrl = `${window.location.origin}/profile/${encodeURIComponent(
      user.username || "member",
    )}`;
    void copyProfileLink(profileUrl, {
      success: t("linkCopied"),
      error: t("copyLinkError"),
    });
  };

  const dims = CARD_DIMENSIONS[mode];
  const resolvedVisibility =
    user.profileVisibility ?? authenticatedUser?.profileVisibility ?? "PUBLIC";
  const isRestrictedProfile = resolvedVisibility !== "PUBLIC";

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      preventClose={isDownloading || isSharing}
      title={t("modalTitle")}
      description={t("modalSubtitle")}
      headerIcon={<Sparkles size={20} className="text-gold" />}
      maxWidth="max-w-4xl"
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-pressed={mode === "profile"}
              onClick={() => setMode("profile")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer",
                mode === "profile"
                  ? "bg-gold text-on-gold border-gold shadow-glow-gold-xs"
                  : "bg-surface/60 text-neutral-300 border-neutral-700 hover:text-neutral-100",
              )}
            >
              <UserIcon size={14} aria-hidden="true" />
              <span>{t("modeProfile")}</span>
            </button>

            {canShowRetrospective && retrospective && (
              <button
                type="button"
                aria-pressed={mode === "retrospective"}
                onClick={() => setMode("retrospective")}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer",
                  mode === "retrospective"
                    ? "bg-gold text-on-gold border-gold shadow-glow-gold-xs"
                    : "bg-surface/60 text-neutral-300 border-neutral-700 hover:text-neutral-100",
                )}
              >
                <Sparkles size={14} aria-hidden="true" />
                <span>
                  {t("modeRetrospective", { year: retrospective.year })}
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCardTheme("dark")}
              aria-pressed={cardTheme === "dark"}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer",
                cardTheme === "dark"
                  ? "border-primary bg-primary/20 text-neutral-50"
                  : "border-neutral-700 bg-surface/50 text-neutral-400 hover:text-neutral-200",
              )}
            >
              <Moon size={13} aria-hidden="true" />
              <span>{t("themeDark")}</span>
            </button>
            <button
              type="button"
              onClick={() => setCardTheme("light")}
              aria-pressed={cardTheme === "light"}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer",
                cardTheme === "light"
                  ? "border-amber-500/60 bg-amber-500/15 text-amber-800 dark:text-gold"
                  : "border-neutral-700 bg-surface/50 text-neutral-400 hover:text-neutral-200",
              )}
            >
              <Sun size={13} aria-hidden="true" />
              <span>{t("themeLight")}</span>
            </button>
          </div>
        </div>

        {user.friendCode && (
          <label className="inline-flex items-center gap-2.5 text-xs font-medium text-neutral-200 cursor-pointer select-none w-fit">
            <input
              type="checkbox"
              checked={includeFriendCode}
              onChange={(e) => setIncludeFriendCode(e.target.checked)}
              className="checkbox-custom"
            />
            <span>{t("includeFriendCode", { code: user.friendCode })}</span>
          </label>
        )}

        <div className="relative w-full rounded-2xl border border-neutral-700 dark:border-primary/30 bg-background/80 p-2 overflow-hidden">
          {!isCanvasReady && !canvasError && (
            <div
              aria-hidden="true"
              className="absolute inset-2 rounded-xl bg-surface/70 animate-pulse"
            />
          )}
          {canvasError && (
            <div
              role="alert"
              className="absolute inset-2 z-10 rounded-xl bg-surface/95 flex flex-col items-center justify-center gap-3 p-4 text-center"
            >
              <AlertTriangle
                size={24}
                className="text-red-700 dark:text-red-400"
                aria-hidden="true"
              />
              <p className="text-xs font-medium text-neutral-300">
                {t("previewError")}
              </p>
              <button
                type="button"
                onClick={() => setRenderAttempt((n) => n + 1)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-gold text-on-gold hover:bg-amber-300 transition-colors cursor-pointer"
              >
                <RotateCw size={13} aria-hidden="true" />
                <span>{t("retryPreview")}</span>
              </button>
            </div>
          )}
          <canvas
            ref={previewCanvasRef}
            role="img"
            aria-label={t("canvasAria", {
              name: user.fullName || user.username || "HabitParty",
            })}
            style={{ aspectRatio: `${dims.width} / ${dims.height}` }}
            className={cn(
              "w-full h-auto block rounded-xl transition-opacity duration-200",
              isCanvasReady ? "opacity-100" : "opacity-0",
            )}
          />
        </div>

        {isRestrictedProfile && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-300">
            <Lock size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              {resolvedVisibility === "FRIENDS_ONLY"
                ? t("friendsOnlyLinkWarning")
                : t("privateLinkWarning")}
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleCopyProfileLink}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-neutral-700 dark:border-primary/30 bg-surface/70 hover:bg-surface text-neutral-100 transition-colors cursor-pointer"
          >
            {linkCopied ? (
              <Check
                size={15}
                className="text-emerald-700 dark:text-emerald-400"
                aria-hidden="true"
              />
            ) : (
              <Copy size={15} aria-hidden="true" />
            )}
            <span>{t("copyProfileLink")}</span>
          </button>

          {canNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              disabled={isSharing || isDownloading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-primary/40 bg-primary/15 hover:bg-primary/25 text-neutral-100 transition-colors cursor-pointer disabled:opacity-60"
            >
              <Share2 size={15} aria-hidden="true" />
              <span>{isSharing ? t("sharing") : t("shareNative")}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={isDownloading || isSharing}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gold text-on-gold hover:bg-amber-300 shadow-glow-gold-xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <Download size={15} aria-hidden="true" />
            <span>{isDownloading ? t("downloading") : t("downloadPng")}</span>
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
