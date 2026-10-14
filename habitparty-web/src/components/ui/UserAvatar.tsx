"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/utils";

export interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  hasRing?: boolean;
}

const SIZE_CLASSES = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-lg",
  xl: "w-20 h-20 sm:w-24 sm:h-24 text-2xl font-bold",
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
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const initials = getInitials(name);
  const sizeClass = SIZE_CLASSES[size];

  const ringClass = hasRing
    ? "ring-2 ring-gold/60 ring-offset-1 ring-offset-background"
    : "";

  if (src && !imageError) {
    return (
      <div
        className={cn(
          "relative rounded-full overflow-hidden shrink-0 bg-primary-dark/40 border border-primary/40",
          sizeClass,
          ringClass,
          className,
        )}
      >
        <Image
          src={src}
          alt={`Avatar de ${name || "usuário"}`}
          fill
          sizes="(max-width: 768px) 100vw, 96px"
          className="object-cover"
          onError={() => setImageError(true)}
          unoptimized={src.startsWith("http") || src.startsWith("blob:")}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-full shrink-0 flex items-center justify-center font-bold tracking-wider select-none",
        "bg-gradient-to-br from-primary via-purple-700 to-magenta text-neutral-50 shadow-inner border border-white/20",
        sizeClass,
        ringClass,
        className,
      )}
      aria-label={`Avatar: ${name || "Usuário"}`}
    >
      <span>{initials}</span>
    </div>
  );
}
