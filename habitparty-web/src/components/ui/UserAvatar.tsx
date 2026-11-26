"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { type AvatarFrameId, getAvatarFrame } from "@/constants/avatarFrames";
import { resolveAvatarPreset } from "@/constants/avatarPresets";
import { useActiveAvatarFrame } from "@/store/userStore";
import { API_ORIGIN_HOST, resolveAvatarSrc } from "@/utils/avatarUrl";
import { cn } from "@/utils/cn";

/**
 * Evita falhas de `next/image` com `blob:`, `data:` ou hosts externos não previstos em `remotePatterns`,
 * mantendo otimização automática para caminhos locais, Google Avatars e o host da API configurado.
 */
function shouldBypassImageOptimization(src: string): boolean {
  if (src.startsWith("blob:") || src.startsWith("data:")) {
    return true;
  }
  if (src.startsWith("/")) {
    return false;
  }
  try {
    const parsed = new URL(src);
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "lh3.googleusercontent.com" ||
      host.endsWith(".googleusercontent.com") ||
      (API_ORIGIN_HOST && host === API_ORIGIN_HOST.toLowerCase())
    ) {
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

export interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  hasRing?: boolean;
  frameId?: AvatarFrameId;
  presetId?: string | null;
}

const SIZE_CLASSES = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-lg",
  xl: "w-20 h-20 sm:w-24 sm:h-24 text-2xl font-bold",
} as const;

const IMAGE_SIZES = {
  sm: "32px",
  md: "40px",
  lg: "64px",
  xl: "(max-width: 640px) 80px, 96px",
} as const;

const PRESET_ICON_SIZES = {
  sm: 15,
  md: 20,
  lg: 28,
  xl: 38,
} as const;

const FRAME_OFFSET_CLASSES = {
  sm: "-inset-[2px]",
  md: "-inset-[2.5px]",
  lg: "-inset-[3.5px]",
  xl: "-inset-[4.5px]",
} as const;

/**
 * Extrai as iniciais do nome do usuário (ex: "Carlos Vinicius" -> "CV")
 */
export function getUserInitials(name?: string | null): string {
  if (!name || !name.trim()) return "HP";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function StoreFrameAvatar(props: Omit<UserAvatarProps, "frameId">) {
  const activeFrameId = useActiveAvatarFrame();
  return <UserAvatarCore {...props} resolvedFrameId={activeFrameId} />;
}

interface UserAvatarCoreProps extends Omit<UserAvatarProps, "frameId"> {
  resolvedFrameId: AvatarFrameId;
}

function UserAvatarCore({
  src,
  name,
  size = "md",
  className,
  hasRing = false,
  presetId,
  resolvedFrameId,
}: UserAvatarCoreProps) {
  const tAvatar = useTranslations("ui.avatar");
  const [imageError, setImageError] = useState(false);
  const initials = getUserInitials(name);
  const sizeClass = SIZE_CLASSES[size];
  const resolvedSrc = resolveAvatarSrc(src);
  const resolvedPreset = resolveAvatarPreset(presetId);
  const resolvedAriaName = name?.trim() || tAvatar("defaultUser");

  // Reseta erro caso a URL da foto mude
  // biome-ignore lint/correctness/useExhaustiveDependencies: Reseta flag de erro sempre que a URL resolvida mudar
  useEffect(() => {
    setImageError(false);
  }, [resolvedSrc]);

  const frame = getAvatarFrame(resolvedFrameId);
  const hasActiveFrame = frame.id !== "none";

  const ringClass =
    hasRing && !hasActiveFrame
      ? "ring-2 ring-gold/60 ring-offset-1 ring-offset-background"
      : "";

  const renderContent = () => {
    if (resolvedPreset) {
      const PresetIcon = resolvedPreset.icon;
      const isLegendPreset = resolvedPreset.id === "level_legend";
      return (
        <div
          className={cn(
            "relative rounded-full shrink-0 flex items-center justify-center select-none overflow-hidden",
            "bg-gradient-to-br shadow-inner border border-white/25",
            resolvedPreset.cssGradient,
            sizeClass,
            ringClass,
            hasActiveFrame && "ring-2 ring-background shadow-xs",
            className,
          )}
          role="img"
          aria-label={tAvatar("avatarLabel", { name: resolvedAriaName })}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-[3px] rounded-full border border-white/20"
          />
          <PresetIcon
            size={PRESET_ICON_SIZES[size]}
            className={cn(
              "relative z-10 drop-shadow-xs",
              isLegendPreset ? "text-neutral-950" : "text-white",
            )}
            aria-hidden="true"
          />
        </div>
      );
    }

    if (resolvedSrc && !imageError) {
      return (
        <div
          className={cn(
            "relative rounded-full overflow-hidden shrink-0 bg-primary/20 dark:bg-primary-dark/40 border border-primary/30",
            sizeClass,
            ringClass,
            hasActiveFrame && "ring-2 ring-background shadow-xs",
            className,
          )}
        >
          <Image
            src={resolvedSrc}
            alt={tAvatar("avatarAlt", { name: resolvedAriaName })}
            fill
            sizes={IMAGE_SIZES[size]}
            className="object-cover"
            onError={() => setImageError(true)}
            unoptimized={shouldBypassImageOptimization(resolvedSrc)}
          />
        </div>
      );
    }

    return (
      <div
        className={cn(
          "rounded-full shrink-0 flex items-center justify-center font-bold tracking-wider select-none",
          "bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-inner border border-white/20",
          sizeClass,
          ringClass,
          hasActiveFrame && "ring-2 ring-background shadow-xs",
          className,
        )}
        role="img"
        aria-label={tAvatar("avatarLabel", { name: resolvedAriaName })}
      >
        <span className="text-white drop-shadow-xs">{initials}</span>
      </div>
    );
  };

  if (hasActiveFrame) {
    return (
      <div className="relative inline-flex items-center justify-center shrink-0">
        <div
          aria-hidden="true"
          className={cn(
            "absolute rounded-full animate-frame-spin pointer-events-none",
            frame.ringClass,
            FRAME_OFFSET_CLASSES[size],
          )}
        />
        <div
          aria-hidden="true"
          className={cn(
            "absolute rounded-full animate-frame-pulse pointer-events-none",
            frame.ringClass,
            frame.glowClass,
            FRAME_OFFSET_CLASSES[size],
          )}
        />
        <div className="relative z-10 shrink-0">{renderContent()}</div>
      </div>
    );
  }

  return renderContent();
}

export function UserAvatar({
  frameId,
  hasRing = false,
  ...rest
}: UserAvatarProps) {
  if (frameId === undefined && hasRing) {
    return <StoreFrameAvatar {...rest} hasRing={hasRing} />;
  }
  return (
    <UserAvatarCore
      {...rest}
      hasRing={hasRing}
      resolvedFrameId={frameId ?? "none"}
    />
  );
}
