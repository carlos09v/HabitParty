"use client";

import { Check, Crown, Lock, Paintbrush, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateShowcaseProfileAction } from "@/actions/showcaseActions";
import { BaseModal } from "@/components/ui/BaseModal";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { AVATAR_FRAMES, type AvatarFrameId } from "@/constants/avatarFrames";
import { useIsClient } from "@/hooks/useIsClient";
import { useAvatarFrameStore } from "@/store/avatarFrameStore";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/utils";
import { soundEffects } from "@/utils/soundEffects";

const UpgradePremiumModal = dynamic(
  () =>
    import("@/components/subscription/UpgradePremiumModal").then(
      (mod) => mod.UpgradePremiumModal,
    ),
  { ssr: false },
);

interface AvatarFrameSelectorGridProps {
  onFrameChanged?: (frameId: AvatarFrameId) => void;
}

function AvatarFrameSelectorGrid({
  onFrameChanged,
}: AvatarFrameSelectorGridProps) {
  const t = useTranslations("showcase.avatarFrames");
  const user = useUserStore((s) => s.user);
  const isPremium = useUserStore((s) => s.is_Premium);
  const currentFrameId = useAvatarFrameStore((s) => s.frameId);
  const setFrameId = useAvatarFrameStore((s) => s.setFrameId);

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const mounted = useIsClient();

  const displayName = user?.fullName || user?.username || "Aventureiro";
  const displayPhoto = user?.profilePhotoUrl;

  const handleSelectFrame = (
    frameId: AvatarFrameId,
    isFramePremium: boolean,
  ) => {
    if (isFramePremium && !isPremium) {
      toast.info(t("upgradeToast"));
      setIsUpgradeModalOpen(true);
      return;
    }

    const previousFrameId = currentFrameId;
    soundEffects.playCreateSound();
    setFrameId(frameId);
    useUserStore.getState().updateUserPartial({ avatarFrame: frameId });
    onFrameChanged?.(frameId);

    startTransition(async () => {
      const res = await updateShowcaseProfileAction({ avatarFrame: frameId });
      if (!res.success) {
        setFrameId(previousFrameId);
        useUserStore
          .getState()
          .updateUserPartial({ avatarFrame: previousFrameId });
        toast.error(res.error);
        return;
      }
      toast.success(
        t("successToast", {
          name: t(`frames.${frameId}.name`),
        }),
      );
    });
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        {!isPremium && (
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => setIsUpgradeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-tiny font-bold bg-gold/15 text-gold border border-gold/40 hover:bg-gold/25 transition-colors cursor-pointer shrink-0"
            >
              <Crown size={12} className="stroke-2" />
              <span>{t("unlockAll")}</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                disabled={isPending}
                onClick={() => handleSelectFrame(frame.id, frame.isPremium)}
                className={cn(
                  "relative flex items-center gap-3.5 p-3.5 rounded-xl border text-left transition-colors cursor-pointer select-none",
                  "focus:outline-none focus:ring-2 focus:ring-gold/60 disabled:opacity-60",
                  isSelected
                    ? "border-gold bg-gold/10 shadow-glow-gold-xs font-medium"
                    : isLocked
                      ? "border-neutral-700 bg-surface/45 dark:border-primary/20 dark:bg-surface/20 opacity-80 hover:opacity-100 hover:border-gold/40 hover:bg-surface/60 dark:hover:bg-surface/40"
                      : "border-neutral-700 bg-surface/45 hover:border-primary/40 hover:bg-surface/70 dark:border-primary/20 dark:bg-surface/30 dark:hover:bg-surface/50",
                )}
              >
                <div className="shrink-0 pl-1">
                  <UserAvatar
                    src={displayPhoto}
                    name={displayName}
                    size="md"
                    frameId={frame.id}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-body-s font-bold text-neutral-100 truncate">
                      {t(`frames.${frame.id}.name`)}
                    </span>

                    {frame.isPremium ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-label-m font-black uppercase tracking-wider bg-gold/20 text-gold border border-gold/40 shrink-0">
                        <Sparkles size={9} />
                        {t("vipBadge")}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-full text-label-m font-bold uppercase tracking-wider bg-surface text-neutral-400 border border-neutral-700 dark:border-primary/20 shrink-0">
                        {t("freeBadge")}
                      </span>
                    )}
                  </div>

                  <p className="text-tiny text-neutral-400 line-clamp-2 mt-0.5 leading-snug">
                    {t(`frames.${frame.id}.description`)}
                  </p>
                </div>

                <div className="shrink-0 flex items-center justify-center">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-gold text-neutral-950 flex items-center justify-center shadow-xs">
                      <Check size={14} className="stroke-[3]" />
                    </div>
                  ) : isLocked ? (
                    <div
                      className="w-6 h-6 rounded-full bg-surface border border-gold/30 text-gold flex items-center justify-center"
                      title={t("lockedTitle")}
                    >
                      <Lock size={12} />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-neutral-600 dark:border-primary/40" />
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

interface AvatarFramePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  onFrameChanged?: (frameId: AvatarFrameId) => void;
}

export function AvatarFramePickerModal({
  isOpen,
  onClose,
  title,
  description,
  onFrameChanged,
}: AvatarFramePickerModalProps) {
  const t = useTranslations("showcase.avatarFrames");
  const resolvedTitle =
    title ?? (t.has("title") ? t("title") : "Molduras de Avatar");
  const resolvedDescription = description ?? t("subtitle");

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-2xl"
      borderColor="border-gold/30"
      headerIcon={<Paintbrush size={18} />}
      headerIconClassName="bg-gold/15 border-gold/30 text-gold"
      title={resolvedTitle}
      description={resolvedDescription}
    >
      <AvatarFrameSelectorGrid onFrameChanged={onFrameChanged} />
    </BaseModal>
  );
}
