"use client";

import { Check, Crown, Lock, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { AVATAR_FRAMES, type AvatarFrameId } from "@/constants/avatarFrames";
import { useAvatarFrameStore } from "@/store/avatarFrameStore";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/utils";

const UpgradePremiumModal = dynamic(
  () =>
    import("@/components/subscription/UpgradePremiumModal").then(
      (mod) => mod.UpgradePremiumModal,
    ),
  { ssr: false },
);

interface AvatarFrameSettingsProps {
  isCompact?: boolean;
}

export function AvatarFrameSettings({
  isCompact = false,
}: AvatarFrameSettingsProps) {
  const user = useUserStore((s) => s.user);
  const isPremium = useUserStore((s) => s.is_Premium);
  const currentFrameId = useAvatarFrameStore((s) => s.frameId);
  const setFrameId = useAvatarFrameStore((s) => s.setFrameId);

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayName = user?.fullName || user?.username || "Aventureiro";
  const displayPhoto = user?.profilePhotoUrl;

  const handleSelectFrame = (
    frameId: AvatarFrameId,
    isFramePremium: boolean,
  ) => {
    if (isFramePremium && !isPremium) {
      toast.info(
        "Molduras animadas são exclusivas para membros Premium! Faça o upgrade para desbloquear.",
      );
      setIsUpgradeModalOpen(true);
      return;
    }

    setFrameId(frameId);
    toast.success("Moldura de perfil atualizada!");
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-body-s text-neutral-300">
            Escolha uma moldura animada com luz cósmica para destacar seu perfil
            na Party, no ranking e no painel.
          </p>

          {!isPremium && (
            <button
              type="button"
              onClick={() => setIsUpgradeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-tiny font-bold bg-gold/15 text-gold border border-gold/40 hover:bg-gold/25 transition-all cursor-pointer shrink-0"
            >
              <Crown size={12} className="stroke-2" />
              <span>Desbloquear Todas</span>
            </button>
          )}
        </div>

        <div
          className={cn(
            "grid gap-3",
            isCompact
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
          )}
        >
          {AVATAR_FRAMES.map((frame) => {
            const resolvedCurrentFrame = mounted
              ? currentFrameId
              : "cosmic_gold";
            const isSelected = isPremium
              ? resolvedCurrentFrame === frame.id
              : frame.id === "none";
            const isLocked = frame.isPremium && !isPremium;

            return (
              <button
                key={frame.id}
                type="button"
                onClick={() => handleSelectFrame(frame.id, frame.isPremium)}
                className={cn(
                  "relative flex items-center gap-3.5 p-3.5 rounded-xl border text-left transition-all cursor-pointer select-none",
                  "focus:outline-none focus:ring-2 focus:ring-gold/60",
                  isSelected
                    ? "border-gold bg-gold/10 shadow-glow-gold-xs font-medium"
                    : isLocked
                      ? "border-primary/20 bg-surface/20 opacity-80 hover:opacity-100 hover:border-gold/40 hover:bg-surface/40"
                      : "border-primary/20 bg-surface/30 hover:border-primary/40 hover:bg-surface/50",
                )}
              >
                {/* Miniatura do Avatar com a moldura renderizada ao vivo */}
                <div className="shrink-0 pl-1">
                  <UserAvatar
                    src={displayPhoto}
                    name={displayName}
                    size="md"
                    frameId={frame.id}
                  />
                </div>

                {/* Textos & Badges */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-body-s font-bold text-neutral-100 truncate">
                      {frame.name}
                    </span>

                    {frame.isPremium ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-gold/20 text-gold border border-gold/40 shrink-0">
                        <Sparkles size={9} />
                        VIP
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-surface text-neutral-400 border border-primary/20 shrink-0">
                        Grátis
                      </span>
                    )}
                  </div>

                  <p className="text-tiny text-neutral-400 line-clamp-2 mt-0.5 leading-snug">
                    {frame.description}
                  </p>
                </div>

                {/* Indicador de Seleção / Bloqueio */}
                <div className="shrink-0 flex items-center justify-center">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-gold text-neutral-950 flex items-center justify-center shadow-xs">
                      <Check size={14} className="stroke-[3]" />
                    </div>
                  ) : isLocked ? (
                    <div
                      className="w-6 h-6 rounded-full bg-surface border border-gold/30 text-gold flex items-center justify-center"
                      title="Exclusivo Premium"
                    >
                      <Lock size={12} />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-primary/40" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {isUpgradeModalOpen && (
        <UpgradePremiumModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
        />
      )}
    </>
  );
}
