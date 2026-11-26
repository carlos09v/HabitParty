"use client";

import {
  Award,
  Check,
  Crown,
  Lock,
  Paintbrush,
  Sparkles,
  UserCircle2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import { updateShowcaseProfileAction } from "@/actions/showcaseActions";
import { BaseModal } from "@/components/ui/BaseModal";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  AVATAR_FRAMES,
  type AvatarFrameId,
  isAvatarFrameUnlocked,
  isMasteryFrameId,
  resolveAvatarFrameId,
} from "@/constants/avatarFrames";
import {
  AVATAR_PRESETS,
  type AvatarPresetId,
  isAvatarPresetUnlocked,
  resolveAvatarPreset,
} from "@/constants/avatarPresets";
import {
  isProfileTitleUnlocked,
  PROFILE_TITLES,
  type ProfileTitleCode,
  resolveProfileTitleLabel,
} from "@/constants/cosmetics";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useUIStore } from "@/store/uiStore";
import { useActiveAvatarFrame, useUserStore } from "@/store/userStore";
import type {
  AchievementItemResponseDTO,
  ShowcaseStatsResponseDTO,
} from "@/types/showcase";
import type { UserRetrospectiveData } from "@/types/social";
import type { UserResponseDTO } from "@/types/user";
import { cn } from "@/utils/cn";
import { handleTabListKeyDown } from "@/utils/showcaseUtils";
import { soundEffects } from "@/utils/soundEffects";

type IdentityTab = "frames" | "titles" | "avatars";

function CosmeticSelectionIndicator({
  isSelected,
  unlocked,
  lockedTitle,
  lockedClassName = "border-gold/30 text-amber-800 dark:text-gold",
}: {
  isSelected: boolean;
  unlocked: boolean;
  lockedTitle?: string;
  lockedClassName?: string;
}) {
  if (isSelected) {
    return (
      <div className="w-6 h-6 rounded-full bg-gold text-neutral-950 flex items-center justify-center shrink-0">
        <Check size={14} className="stroke-[3]" aria-hidden="true" />
      </div>
    );
  }
  if (!unlocked) {
    return (
      <div
        className={cn(
          "w-6 h-6 rounded-full bg-surface border flex items-center justify-center shrink-0",
          lockedClassName,
        )}
        title={lockedTitle}
      >
        <Lock size={12} aria-hidden="true" />
      </div>
    );
  }
  return (
    <div className="w-5 h-5 rounded-full border border-neutral-600 dark:border-primary/40 shrink-0" />
  );
}

interface AvatarFramePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievements?: AchievementItemResponseDTO[];
  stats?: ShowcaseStatsResponseDTO;
  unlockedArtifactsCount?: number;
  retrospective?: UserRetrospectiveData | null;
  eligibleRetroArchetypes?: readonly string[];
  onRequestRetrospective?: () => void;
}

export function AvatarFramePickerModal({
  isOpen,
  onClose,
  achievements = [],
  stats,
  unlockedArtifactsCount,
  retrospective = null,
  eligibleRetroArchetypes,
  onRequestRetrospective,
}: AvatarFramePickerModalProps) {
  const tIdentity = useTranslations("showcase.identityModal");
  const tFrames = useTranslations("showcase.avatarFrames");
  const tTitles = useTranslations("showcase.titles");
  const tPresets = useTranslations("showcase.avatarPresets");
  const { isGamified } = useExperienceMode();

  const user = useUserStore((s) => s.user);
  const isPremium = useUserStore((s) => s.is_Premium);
  const resolvedCurrentFrame = useActiveAvatarFrame();
  const openUpgradeModal = useUIStore((s) => s.openUpgradeModal);

  const [activeTab, setActiveTab] = useState<IdentityTab>("frames");
  const [nowMs] = useState(() => Date.now());
  const [isPending, startTransition] = useTransition();
  const tabBaseId = useId();
  const retroRequestedRef = useRef(false);

  useEffect(() => {
    if (!isOpen || activeTab !== "titles") {
      retroRequestedRef.current = false;
      return;
    }
    if (
      eligibleRetroArchetypes === undefined &&
      !retrospective &&
      !retroRequestedRef.current
    ) {
      retroRequestedRef.current = true;
      onRequestRetrospective?.();
    }
  }, [
    isOpen,
    activeTab,
    eligibleRetroArchetypes,
    retrospective,
    onRequestRetrospective,
  ]);

  const resolvedTotalXp = user?.totalXp ?? stats?.totalXp ?? 0;
  const resolvedArtifactsCount =
    unlockedArtifactsCount ?? stats?.unlockedArtifactsCount ?? 0;
  const isFounder = Boolean(user?.isFounder);
  const displayName = user?.fullName || user?.username || "HabitParty";
  const displayPhoto = user?.profilePhotoUrl;
  const activeEquippedTitle = user?.equippedTitle?.toUpperCase() ?? null;
  const activeAvatarPreset = user?.avatarPreset?.toLowerCase() ?? null;

  const frameStatuses = useMemo(
    () =>
      AVATAR_FRAMES.map((frame) => ({
        frame,
        unlocked: isAvatarFrameUnlocked(frame, {
          isPremium,
          totalXp: resolvedTotalXp,
          achievements,
        }),
      })),
    [isPremium, resolvedTotalXp, achievements],
  );

  const titleStatuses = useMemo(
    () =>
      PROFILE_TITLES.map((def) => ({
        def,
        unlocked: isProfileTitleUnlocked(def.code, {
          user,
          achievements,
          unlockedArtifactsCount: resolvedArtifactsCount,
          retrospective,
          eligibleRetroArchetypes,
          nowMs,
        }),
      })).sort((a, b) => Number(b.unlocked) - Number(a.unlocked)),
    [
      user,
      achievements,
      resolvedArtifactsCount,
      retrospective,
      eligibleRetroArchetypes,
      nowMs,
    ],
  );

  const presetStatuses = useMemo(
    () =>
      AVATAR_PRESETS.map((preset) => ({
        preset,
        unlocked: isAvatarPresetUnlocked(preset, {
          totalXp: resolvedTotalXp,
          isPremium,
          isFounder,
        }),
      })),
    [resolvedTotalXp, isPremium, isFounder],
  );

  const unlockedFramesCount = frameStatuses.filter((f) => f.unlocked).length;
  const unlockedTitlesCount = titleStatuses.filter((t) => t.unlocked).length;
  const unlockedPresetsCount = presetStatuses.filter((p) => p.unlocked).length;

  const runOptimisticCosmeticUpdate = (options: {
    payload: Parameters<typeof updateShowcaseProfileAction>[0];
    applyOptimistic: () => void;
    rollback: () => void;
    applyServerData?: (data: UserResponseDTO) => void;
    successMessage: string;
  }) => {
    soundEffects.playCreateSound();
    options.applyOptimistic();

    startTransition(async () => {
      const res = await updateShowcaseProfileAction(options.payload);
      if (!res.success) {
        options.rollback();
        toast.error(res.error);
        return;
      }
      if (res.data) {
        options.applyServerData?.(res.data);
      }
      toast.success(options.successMessage);
      useUserStore.getState().triggerAchievementCheck();
    });
  };

  const handleSelectFrame = (frameId: AvatarFrameId, unlocked: boolean) => {
    if (frameId === resolvedCurrentFrame) return;

    const frameMeta = AVATAR_FRAMES.find((f) => f.id === frameId);
    if (!unlocked) {
      if (frameMeta?.isPremium && !isPremium) {
        toast.info(tFrames("upgradeToast"));
        openUpgradeModal();
      } else {
        toast.info(tFrames("masteryLockedToast"));
      }
      return;
    }

    const previousFrameId = resolvedCurrentFrame;
    runOptimisticCosmeticUpdate({
      payload: { avatarFrame: frameId },
      applyOptimistic: () => {
        useUserStore.getState().updateUserPartial({ avatarFrame: frameId });
      },
      rollback: () => {
        useUserStore
          .getState()
          .updateUserPartial({ avatarFrame: previousFrameId });
      },
      applyServerData: (data) => {
        if (data.avatarFrame) {
          const canonicalFrame = resolveAvatarFrameId(data.avatarFrame);
          useUserStore
            .getState()
            .updateUserPartial({ avatarFrame: canonicalFrame });
        }
      },
      successMessage: tFrames("successToast", {
        name: tFrames(`frames.${frameId}.name`),
      }),
    });
  };

  const handleSelectTitle = (
    code: ProfileTitleCode | "NONE",
    unlocked: boolean,
  ) => {
    const nextValue = code === "NONE" ? null : code;
    if (nextValue === activeEquippedTitle) return;

    if (!unlocked) {
      toast.info(tTitles("lockedToast"));
      return;
    }

    const previousTitle = user?.equippedTitle ?? null;
    const apiValue = code === "NONE" ? "none" : code;
    const successMessage =
      nextValue === null
        ? tTitles("clearedToast")
        : tTitles("equippedToast", {
            name:
              resolveProfileTitleLabel(nextValue, isGamified, tTitles) ??
              nextValue,
          });

    runOptimisticCosmeticUpdate({
      payload: { equippedTitle: apiValue },
      applyOptimistic: () => {
        useUserStore.getState().updateUserPartial({ equippedTitle: nextValue });
      },
      rollback: () => {
        useUserStore
          .getState()
          .updateUserPartial({ equippedTitle: previousTitle });
      },
      applyServerData: (data) => {
        useUserStore
          .getState()
          .updateUserPartial({ equippedTitle: data.equippedTitle ?? null });
      },
      successMessage,
    });
  };

  const handleSelectPreset = (
    presetId: AvatarPresetId | "none",
    unlocked: boolean,
  ) => {
    const nextValue = presetId === "none" ? null : presetId;
    if (nextValue === activeAvatarPreset) return;

    const presetMeta = resolveAvatarPreset(presetId);
    if (!unlocked) {
      if (presetMeta?.unlockType === "PREMIUM" && !isPremium) {
        toast.info(tFrames("upgradeToast"));
        openUpgradeModal();
      } else {
        toast.info(tPresets("lockedToast"));
      }
      return;
    }

    const previousPreset = user?.avatarPreset ?? null;
    const successMessage =
      nextValue === null
        ? tPresets("resetToast")
        : tPresets("equippedToast", {
            name: tPresets(
              isGamified
                ? (`items.${nextValue}.gamified` as const)
                : (`items.${nextValue}.essential` as const),
            ),
          });

    runOptimisticCosmeticUpdate({
      payload: { avatarPreset: presetId },
      applyOptimistic: () => {
        useUserStore.getState().updateUserPartial({ avatarPreset: nextValue });
      },
      rollback: () => {
        useUserStore
          .getState()
          .updateUserPartial({ avatarPreset: previousPreset });
      },
      applyServerData: (data) => {
        useUserStore
          .getState()
          .updateUserPartial({ avatarPreset: data.avatarPreset ?? null });
      },
      successMessage,
    });
  };

  const resolvedTitle = tIdentity("title");
  const resolvedDescription = tIdentity("subtitle");

  const tabs = [
    {
      id: "frames" as const,
      icon: Paintbrush,
      label: tIdentity("tabs.frames", {
        unlocked: unlockedFramesCount,
        total: AVATAR_FRAMES.length,
      }),
    },
    {
      id: "titles" as const,
      icon: Award,
      label: tIdentity("tabs.titles", {
        unlocked: unlockedTitlesCount,
        total: PROFILE_TITLES.length,
      }),
    },
    {
      id: "avatars" as const,
      icon: UserCircle2,
      label: tIdentity("tabs.avatars", {
        unlocked: unlockedPresetsCount,
        total: AVATAR_PRESETS.length,
      }),
    },
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      preventClose={isPending}
      maxWidth="max-w-3xl"
      borderColor="border-gold/30"
      headerIcon={<Paintbrush size={18} aria-hidden="true" />}
      headerIconClassName="bg-gold/15 border-gold/30 text-amber-700 dark:text-gold"
      title={resolvedTitle}
      description={resolvedDescription}
    >
      <div className="flex flex-col gap-4">
        {/* ABAS PRINCIPAIS DE IDENTIDADE VISUAL (Molduras | Títulos | Avatares) */}
        <div
          role="tablist"
          aria-label={tIdentity("tabsNavAria")}
          className="flex items-center gap-1 border-b border-neutral-700 dark:border-primary/20 overflow-x-auto custom-scrollbar"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            const tabId = `${tabBaseId}-tab-${tab.id}`;
            const panelId = `${tabBaseId}-panel-${tab.id}`;
            return (
              <button
                key={tab.id}
                id={tabId}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls={panelId}
                tabIndex={isSelected ? 0 : -1}
                onKeyDown={handleTabListKeyDown}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                  "after:content-[''] after:absolute after:inset-x-1 after:bottom-0 after:border-b-[3px] after:transition-opacity",
                  isSelected
                    ? "text-amber-700 dark:text-gold after:border-amber-600 dark:after:border-gold after:opacity-100 forced-colors:outline-2 forced-colors:outline-solid forced-colors:outline-[Highlight]"
                    : "text-neutral-400 hover:text-neutral-100 after:border-transparent after:opacity-0",
                )}
              >
                <Icon size={15} aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ABA 1: MOLDURAS DE AVATAR (VIP + MAESTRIA) */}
        {activeTab === "frames" && (
          <div
            id={`${tabBaseId}-panel-frames`}
            role="tabpanel"
            aria-labelledby={`${tabBaseId}-tab-frames`}
          >
            <div className="flex flex-col gap-4 pt-1">
              {!isPremium && (
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={openUpgradeModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-tiny font-bold bg-gold/15 text-amber-800 dark:text-gold border border-gold/40 hover:bg-gold/25 transition-colors cursor-pointer shrink-0"
                  >
                    <Crown size={12} className="stroke-2" aria-hidden="true" />
                    <span>{tFrames("unlockAll")}</span>
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {frameStatuses.map(({ frame, unlocked }) => {
                  const isSelected = resolvedCurrentFrame === frame.id;
                  const isMastery = frame.category === "MASTERY";

                  return (
                    <button
                      key={frame.id}
                      type="button"
                      disabled={isPending}
                      aria-pressed={isSelected}
                      onClick={() => handleSelectFrame(frame.id, unlocked)}
                      className={cn(
                        "relative flex items-center gap-3.5 p-3.5 rounded-xl border text-left transition-colors cursor-pointer select-none",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 disabled:opacity-60",
                        isSelected
                          ? "border-gold bg-gold/10 font-medium"
                          : !unlocked
                            ? "border-neutral-700 bg-surface/45 dark:border-primary/20 dark:bg-surface/20 opacity-80 hover:opacity-100 hover:border-gold/40"
                            : "border-neutral-700 bg-surface/45 hover:border-primary/40 hover:bg-surface/70 dark:border-primary/20 dark:bg-surface/30 dark:hover:bg-surface/50",
                      )}
                    >
                      <div className="shrink-0 pl-1">
                        <UserAvatar
                          src={displayPhoto}
                          name={displayName}
                          size="md"
                          frameId={frame.id}
                          presetId={activeAvatarPreset}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-body-s font-bold text-neutral-100 break-words">
                            {tFrames(`frames.${frame.id}.name`)}
                          </span>

                          {frame.isPremium ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-label-m font-black uppercase tracking-wider bg-gold/20 text-amber-700 dark:text-gold border border-gold/40 shrink-0">
                              <Sparkles size={9} aria-hidden="true" />
                              {tFrames("vipBadge")}
                            </span>
                          ) : isMastery ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-label-m font-black uppercase tracking-wider bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/35 shrink-0">
                              <Award size={9} aria-hidden="true" />
                              {tFrames("masteryBadge")}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded-full text-label-m font-bold uppercase tracking-wider bg-surface text-neutral-400 border border-neutral-700 dark:border-primary/20 shrink-0">
                              {tFrames("freeBadge")}
                            </span>
                          )}
                        </div>

                        <p className="text-tiny text-neutral-400 mt-0.5 leading-snug break-words">
                          {!unlocked && isMasteryFrameId(frame.id)
                            ? tFrames(`frames.${frame.id}.unlockHint`)
                            : tFrames(`frames.${frame.id}.description`)}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center justify-center">
                        <CosmeticSelectionIndicator
                          isSelected={isSelected}
                          unlocked={unlocked}
                          lockedTitle={
                            frame.isPremium
                              ? tFrames("lockedTitle")
                              : tFrames("lockedMasteryTitle")
                          }
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ABA 2: TÍTULOS EQUIPÁVEIS ABAIXO DO NOME */}
        {activeTab === "titles" && (
          <div
            id={`${tabBaseId}-panel-titles`}
            role="tabpanel"
            aria-labelledby={`${tabBaseId}-tab-titles`}
          >
            <div className="flex flex-col gap-3 pt-1">
              <button
                type="button"
                disabled={isPending}
                aria-pressed={!activeEquippedTitle}
                onClick={() => handleSelectTitle("NONE", true)}
                className={cn(
                  "flex items-center justify-between gap-3 p-3.5 rounded-xl border text-left transition-colors cursor-pointer disabled:opacity-60",
                  !activeEquippedTitle
                    ? "border-gold bg-gold/10"
                    : "border-neutral-700 bg-surface/45 hover:border-primary/40 dark:border-primary/20 dark:bg-surface/30",
                )}
              >
                <div className="min-w-0 flex-1">
                  <span className="text-body-s font-bold text-neutral-100 block">
                    {tTitles("noneName")}
                  </span>
                  <p className="text-tiny text-neutral-400 mt-0.5 break-words">
                    {tTitles("noneDescription")}
                  </p>
                </div>
                {!activeEquippedTitle && (
                  <CosmeticSelectionIndicator isSelected unlocked />
                )}
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {titleStatuses.map(({ def, unlocked }) => {
                  const Icon = def.icon;
                  const isSelected = activeEquippedTitle === def.code;
                  const titleLabel =
                    resolveProfileTitleLabel(def.code, isGamified, tTitles) ??
                    def.code;

                  return (
                    <button
                      key={def.code}
                      type="button"
                      disabled={isPending}
                      aria-pressed={isSelected}
                      onClick={() => handleSelectTitle(def.code, unlocked)}
                      className={cn(
                        "flex items-center gap-3 p-3.5 rounded-xl border text-left transition-colors cursor-pointer disabled:opacity-60",
                        isSelected
                          ? "border-gold bg-gold/10"
                          : !unlocked
                            ? "border-neutral-700 bg-surface/40 dark:border-primary/15 dark:bg-surface/20 opacity-75 hover:opacity-100"
                            : "border-neutral-700 bg-surface/45 hover:border-primary/40 dark:border-primary/20 dark:bg-surface/30",
                      )}
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl border flex items-center justify-center shrink-0",
                          unlocked
                            ? "bg-primary/15 border-primary/30"
                            : "bg-surface border-neutral-700 text-neutral-500",
                        )}
                      >
                        <Icon
                          size={18}
                          className={unlocked ? def.accentClass : undefined}
                          aria-hidden="true"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-body-s font-bold text-neutral-100 break-words">
                            {titleLabel}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase border border-neutral-700 dark:border-primary/25 bg-surface text-neutral-300 shrink-0">
                            {tTitles(`categoryBadges.${def.category}`)}
                          </span>
                        </div>
                        <p className="text-tiny text-neutral-400 mt-0.5 break-words">
                          {tTitles(`items.${def.code}.unlockHint`)}
                        </p>
                      </div>

                      <CosmeticSelectionIndicator
                        isSelected={isSelected}
                        unlocked={unlocked}
                        lockedClassName="border-neutral-600/60 text-neutral-400"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: AVATARES SIMBÓLICOS POR PATENTE & STATUS */}
        {activeTab === "avatars" && (
          <div
            id={`${tabBaseId}-panel-avatars`}
            role="tabpanel"
            aria-labelledby={`${tabBaseId}-tab-avatars`}
          >
            <div className="flex flex-col gap-3 pt-1">
              <button
                type="button"
                disabled={isPending}
                aria-pressed={!activeAvatarPreset}
                onClick={() => handleSelectPreset("none", true)}
                className={cn(
                  "flex items-center gap-3.5 p-3.5 rounded-xl border text-left transition-colors cursor-pointer disabled:opacity-60",
                  !activeAvatarPreset
                    ? "border-gold bg-gold/10"
                    : "border-neutral-700 bg-surface/45 hover:border-primary/40 dark:border-primary/20 dark:bg-surface/30",
                )}
              >
                <UserAvatar
                  src={displayPhoto}
                  name={displayName}
                  size="md"
                  frameId={resolvedCurrentFrame}
                  presetId={null}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-body-s font-bold text-neutral-100 break-words">
                      {tPresets("customName")}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full text-label-m font-bold uppercase bg-surface text-neutral-400 border border-neutral-700 dark:border-primary/20">
                      {tPresets("customBadge")}
                    </span>
                  </div>
                  <p className="text-tiny text-neutral-400 mt-0.5 break-words">
                    {tPresets("customDescription")}
                  </p>
                </div>
                {!activeAvatarPreset && (
                  <CosmeticSelectionIndicator isSelected unlocked />
                )}
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {presetStatuses.map(({ preset, unlocked }) => {
                  const isSelected = activeAvatarPreset === preset.id;
                  const nameKey = isGamified
                    ? (`items.${preset.id}.gamified` as const)
                    : (`items.${preset.id}.essential` as const);
                  const presetBadge =
                    preset.unlockType === "PREMIUM"
                      ? tPresets("vipBadge")
                      : preset.unlockType === "FOUNDER"
                        ? tPresets("founderBadge")
                        : tPresets("rankBadge");

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={isPending}
                      aria-pressed={isSelected}
                      onClick={() => handleSelectPreset(preset.id, unlocked)}
                      className={cn(
                        "flex items-center gap-3.5 p-3.5 rounded-xl border text-left transition-colors cursor-pointer disabled:opacity-60",
                        isSelected
                          ? "border-gold bg-gold/10"
                          : !unlocked
                            ? "border-neutral-700 bg-surface/40 dark:border-primary/15 dark:bg-surface/20 opacity-80 hover:opacity-100"
                            : "border-neutral-700 bg-surface/45 hover:border-primary/40 dark:border-primary/20 dark:bg-surface/30",
                      )}
                    >
                      <div className="shrink-0 pl-1">
                        <UserAvatar
                          name={displayName}
                          size="md"
                          frameId={resolvedCurrentFrame}
                          presetId={preset.id}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-body-s font-bold text-neutral-100 break-words">
                            {tPresets(nameKey)}
                          </span>
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded-full text-label-m font-bold uppercase border shrink-0",
                              preset.unlockType === "PREMIUM"
                                ? "bg-gold/20 text-amber-700 dark:text-gold border-gold/40"
                                : preset.unlockType === "FOUNDER"
                                  ? "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40"
                                  : "bg-surface text-neutral-300 border-neutral-700 dark:border-primary/20",
                            )}
                          >
                            {presetBadge}
                          </span>
                        </div>

                        <p className="text-tiny text-neutral-400 mt-0.5 leading-snug break-words">
                          {unlocked
                            ? tPresets(`items.${preset.id}.description`)
                            : tPresets(`items.${preset.id}.unlockHint`)}
                        </p>
                      </div>

                      <CosmeticSelectionIndicator
                        isSelected={isSelected}
                        unlocked={unlocked}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
