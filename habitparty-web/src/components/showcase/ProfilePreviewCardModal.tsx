"use client";

import {
  Check,
  Copy,
  Download,
  Moon,
  Sparkles,
  Sun,
  User as UserIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BaseModal } from "@/components/ui/BaseModal";
import { useUserStore } from "@/store/userStore";
import type {
  AchievementItemResponseDTO,
  ArtifactItemResponseDTO,
  ProfileHighlightResponseDTO,
  ShowcaseStatsResponseDTO,
} from "@/types/showcase";
import type { UserRetrospectiveData } from "@/types/social";
import { cn } from "@/utils";
import {
  CARD_DIMENSIONS,
  exportCanvasToPngBlob,
  renderProfileOrRetrospectiveCanvas,
  triggerPngBlobDownload,
} from "@/utils/profileCardRenderer";
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
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const linkCopyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (linkCopyTimerRef.current) {
        globalThis.clearTimeout(linkCopyTimerRef.current);
      }
    };
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
    retrospective,
    activeFrameId,
    includeFriendCode,
  });

  useEffect(() => {
    if (!isOpen || !previewCanvasRef.current || isUnauthorizedTarget) return;
    const controller = new AbortController();
    setIsCanvasReady(false);
    void renderProfileOrRetrospectiveCanvas(
      previewCanvasRef.current,
      renderInput,
      2,
      { signal: controller.signal },
    ).then(() => {
      if (!controller.signal.aborted) {
        setIsCanvasReady(true);
      }
    });
    return () => controller.abort();
  }, [isOpen, isUnauthorizedTarget, renderInput]);

  if (isUnauthorizedTarget) {
    return null;
  }

  const handleDownloadPng = async () => {
    if (isUnauthorizedTarget) return;
    setIsDownloading(true);
    try {
      let targetCanvas = previewCanvasRef.current;
      if (!targetCanvas || !isCanvasReady) {
        const offscreen = document.createElement("canvas");
        await renderProfileOrRetrospectiveCanvas(offscreen, renderInput, 2);
        targetCanvas = offscreen;
      }
      const blob = await exportCanvasToPngBlob(targetCanvas);
      const suffix =
        mode === "retrospective" && retrospective
          ? `retrospective-${retrospective.year}`
          : "profile-card";
      triggerPngBlobDownload(
        blob,
        `habitparty-${user.username || "member"}-${suffix}.png`,
      );
      toast.success(t("downloadSuccess"));
    } catch {
      toast.error(t("downloadError"));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyProfileLink = async () => {
    try {
      const profileUrl = `${window.location.origin}/profile/${encodeURIComponent(
        user.username || "member",
      )}`;
      await navigator.clipboard.writeText(profileUrl);
      setLinkCopied(true);
      toast.success(t("linkCopied"));
      if (linkCopyTimerRef.current) {
        globalThis.clearTimeout(linkCopyTimerRef.current);
      }
      linkCopyTimerRef.current = globalThis.setTimeout(
        () => setLinkCopied(false),
        2000,
      );
    } catch {
      toast.error(t("downloadError"));
    }
  };

  const dims = CARD_DIMENSIONS[mode];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
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
              className="rounded border-neutral-600 bg-surface text-gold focus:ring-gold"
            />
            <span>{t("includeFriendCode", { code: user.friendCode })}</span>
          </label>
        )}

        <div className="w-full rounded-2xl border border-neutral-700 dark:border-primary/30 bg-background/80 p-2 overflow-hidden">
          <canvas
            ref={previewCanvasRef}
            style={{ aspectRatio: `${dims.width} / ${dims.height}` }}
            className="w-full h-auto block rounded-xl"
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
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

          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={isDownloading}
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
