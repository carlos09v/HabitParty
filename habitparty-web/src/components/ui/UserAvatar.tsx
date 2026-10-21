"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { type AvatarFrameId, getAvatarFrame } from "@/constants/avatarFrames";
import { useActiveAvatarFrame } from "@/store/avatarFrameStore";
import { cn } from "@/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Resolve URLs relativas vindas do backend (ex: "/uploads/uuid.png")
 * para o endereço completo do servidor da API, preservando URLs absolutas e blobs.
 */
function resolveAvatarSrc(src?: string | null): string | null {
  if (!src) return null;
  const trimmed = src.trim();
  if (!trimmed) return null;
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }
  if (trimmed.startsWith("/uploads/")) {
    return `${API_BASE_URL.replace(/\/$/, "")}${trimmed}`;
  }
  return trimmed;
}

export interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  hasRing?: boolean;
  frameId?: AvatarFrameId;
}

const SIZE_CLASSES = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-lg",
  xl: "w-20 h-20 sm:w-24 sm:h-24 text-2xl font-bold",
};

const FRAME_OFFSET_CLASSES = {
  sm: "-inset-[2px]",
  md: "-inset-[2.5px]",
  lg: "-inset-[3.5px]",
  xl: "-inset-[4.5px]",
};

/**
 * Extrai as iniciais do nome do usuário (ex: "Carlos Vinicius" -> "CV")
 */
function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return "HP";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function UserAvatar({
  src,
  name,
  size = "md",
  className,
  hasRing = false,
  frameId,
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const activeFrameIdFromStore = useActiveAvatarFrame();
  const initials = getInitials(name);
  const sizeClass = SIZE_CLASSES[size];
  const resolvedSrc = resolveAvatarSrc(src);

  // Reseta erro caso a URL da foto mude
  // biome-ignore lint/correctness/useExhaustiveDependencies: Reseta flag de erro sempre que a URL resolvida mudar
  useEffect(() => {
    setImageError(false);
  }, [resolvedSrc]);

  // Se frameId foi explicitamente fornecido, usa ele.
  // Caso contrário, se hasRing for true (usuário Premium), usa a moldura ativa do store.
  const resolvedFrameId =
    frameId !== undefined ? frameId : hasRing ? activeFrameIdFromStore : "none";

  const frame = getAvatarFrame(resolvedFrameId);
  const hasActiveFrame = frame.id !== "none";

  const ringClass =
    hasRing && !hasActiveFrame
      ? "ring-2 ring-gold/60 ring-offset-1 ring-offset-background"
      : "";

  const renderContent = () => {
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
            alt={`Avatar de ${name || "usuário"}`}
            fill
            sizes="(max-width: 768px) 100vw, 96px"
            className="object-cover"
            onError={() => setImageError(true)}
            unoptimized={
              resolvedSrc.startsWith("http") ||
              resolvedSrc.startsWith("blob:") ||
              resolvedSrc.startsWith("data:")
            }
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
        aria-label={`Avatar: ${name || "Usuário"}`}
      >
        <span className="text-white drop-shadow-xs">{initials}</span>
      </div>
    );
  };

  if (hasActiveFrame) {
    return (
      <div className="relative inline-flex items-center justify-center shrink-0">
        {/* Moldura circular animada com rotação de luz contínua */}
        <div
          className={cn(
            "absolute rounded-full animate-frame-spin pointer-events-none",
            frame.ringClass,
            FRAME_OFFSET_CLASSES[size],
          )}
        />
        {/* Pulso de aura e brilho cósmico */}
        <div
          className={cn(
            "absolute rounded-full animate-frame-pulse blur-[3px] pointer-events-none",
            frame.ringClass,
            frame.glowClass,
            FRAME_OFFSET_CLASSES[size],
          )}
        />
        {/* Conteúdo do Avatar sobreposto de forma estática */}
        <div className="relative z-10 shrink-0">{renderContent()}</div>
      </div>
    );
  }

  return renderContent();
}
