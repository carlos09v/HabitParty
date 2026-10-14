"use client";

import Link from "next/link";
import type { components } from "@/api/schema";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useUserStore } from "@/store/userStore";

type User = components["schemas"]["UserResponseDTO"];

interface SidebarUserProfileProps {
  initialUser?: User | null;
}

export function SidebarUserProfile({ initialUser }: SidebarUserProfileProps) {
  const storeUser = useUserStore((s) => s.user);
  const user = storeUser || initialUser;

  const displayName = user?.fullName || user?.username || "Aventureiro";
  const formattedName = (() => {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts.slice(0, 2).join(" ")}...`;
    }
    return displayName;
  })();
  const levelTitle =
    user?.currentLevelTitle || (user?.isPremium ? "Membro Premium" : "Novato");
  const currentXp = user?.totalXp ?? 0;
  const remainingXp = user?.xpToNextLevel ?? 0;
  // O backend envia xpToNextLevel como quanto XP FALTA para subir de nível.
  // Logo, a meta de XP total para o próximo nível é (currentXp + remainingXp).
  const targetXp = remainingXp > 0 ? currentXp + remainingXp : currentXp;
  const xpPercent =
    targetXp > 0
      ? Math.min(100, Math.max(0, Math.round((currentXp / targetXp) * 100)))
      : 100;
  const coins = user?.currentCoins ?? 0;

  return (
    <footer className="p-3.5 border-t border-primary/30 bg-primary-dark/20 z-10">
      <Link
        href="/settings"
        className="flex items-center gap-2.5 mb-2 group rounded-lg p-1 -m-1 hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
        title={`Ver configurações de perfil (${displayName})`}
      >
        <UserAvatar
          src={user?.profilePhotoUrl}
          name={displayName}
          size="sm"
          hasRing={Boolean(user?.isPremium)}
          className="group-hover:scale-105 transition-transform"
        />
        <div className="flex flex-col min-w-0">
          <span
            className="text-body-s font-bold text-neutral-50 truncate group-hover:text-gold transition-colors"
            title={displayName}
          >
            {formattedName}
          </span>
          <span className="text-tiny text-neutral-300 truncate">
            {levelTitle}
          </span>
        </div>
      </Link>

      <div className="flex items-center justify-between gap-2 mt-2">
        <div className="flex-1 min-w-0">
          <div
            className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={currentXp}
            aria-valuemin={0}
            aria-valuemax={targetXp}
            title={
              remainingXp > 0
                ? `Progresso: ${currentXp}/${targetXp} XP (${xpPercent}%). Faltam ${remainingXp} XP para ${user?.nextLevelTitle || "o próximo nível"}.`
                : `Progresso: ${currentXp} XP (Nível Máximo)`
            }
          >
            <div
              className="h-full bg-gold rounded-full transition-all duration-500 ease-out"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
          <p
            className="text-tiny text-neutral-300 text-center mt-0.5"
            title={
              remainingXp > 0
                ? `Faltam ${remainingXp} XP para ${user?.nextLevelTitle || "o próximo nível"}`
                : "Nível Máximo"
            }
          >
            ({currentXp}/{targetXp} XP)
          </p>
        </div>

        <div
          className="flex items-center gap-1 shrink-0"
          title={`${coins} moedas`}
        >
          <div className="w-3.5 h-3.5 rounded-full bg-gold border border-orange-500 flex items-center justify-center shadow-xs">
            <span className="text-[7px] text-neutral-900 font-bold">H</span>
          </div>
          <span className="text-body-s font-bold text-neutral-50">{coins}</span>
        </div>
      </div>
    </footer>
  );
}
