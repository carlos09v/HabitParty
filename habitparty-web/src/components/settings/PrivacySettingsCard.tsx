"use client";

import {
  AlertTriangle,
  Check,
  Copy,
  Globe,
  KeyRound,
  Lock,
  RefreshCw,
  ShieldBan,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { updatePrivacySettingsAction } from "@/actions/socialActions";
import { useFriendCodeActions } from "@/hooks/useFriendCodeActions";
import { useUserStore } from "@/store/userStore";
import type { FriendRequestPolicy, PrivacyLevel } from "@/types/social";
import type { UserResponseDTO } from "@/types/user";
import { cn } from "@/utils";

interface PrivacySettingsCardProps {
  initialUser: UserResponseDTO | null;
  isCompact?: boolean;
}

const PRIVACY_LEVEL_OPTIONS: ReadonlyArray<{
  value: PrivacyLevel;
  icon: typeof Globe;
}> = [
  { value: "PUBLIC", icon: Globe },
  { value: "FRIENDS_ONLY", icon: Users },
  { value: "PRIVATE", icon: Lock },
];

const FRIEND_REQUEST_POLICY_OPTIONS: ReadonlyArray<{
  value: FriendRequestPolicy;
  icon: typeof Users;
}> = [
  { value: "EVERYONE", icon: Users },
  { value: "FRIEND_CODE_ONLY", icon: KeyRound },
  { value: "NONE", icon: ShieldBan },
];

interface OptionSelectorGroupProps<T extends string> {
  labelId: string;
  title: string;
  description: string;
  value: T;
  options: ReadonlyArray<{
    value: T;
    title: string;
    description: string;
    icon: typeof Globe;
  }>;
  onChange: (next: T) => void;
  disabled?: boolean;
}

function OptionSelectorGroup<T extends string>({
  labelId,
  title,
  description,
  value,
  options,
  onChange,
  disabled = false,
}: OptionSelectorGroupProps<T>) {
  return (
    <div className="flex flex-col gap-2.5">
      <div>
        <h3 id={labelId} className="text-body-s font-bold text-neutral-100">
          {title}
        </h3>
        <p className="text-tiny text-neutral-400 mt-0.5">{description}</p>
      </div>

      <fieldset
        aria-labelledby={labelId}
        className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 border-0 p-0 m-0"
      >
        {options.map((opt) => {
          const isSelected = opt.value === value;
          const Icon = opt.icon;

          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={isSelected}
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              className={cn(
                "flex flex-col gap-1.5 rounded-xl border p-3 text-left transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
                isSelected
                  ? "bg-amber-500/[0.08] dark:bg-primary-dark/60 border-gold shadow-glow-gold-xs ring-1 ring-gold"
                  : "bg-surface/45 border-neutral-700 hover:border-primary/40 dark:bg-surface/40 dark:border-primary/20",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-100">
                  <Icon
                    size={14}
                    className={cn(
                      "shrink-0",
                      isSelected ? "text-gold" : "text-neutral-400",
                    )}
                    aria-hidden="true"
                  />
                  <span>{opt.title}</span>
                </span>
                {isSelected && (
                  <Check
                    size={14}
                    className="text-gold shrink-0"
                    aria-hidden="true"
                  />
                )}
              </div>
              <span className="text-[11px] text-neutral-400 leading-snug">
                {opt.description}
              </span>
            </button>
          );
        })}
      </fieldset>
    </div>
  );
}

export function PrivacySettingsCard({
  initialUser,
  isCompact = false,
}: PrivacySettingsCardProps) {
  const t = useTranslations("settings.privacy");
  const storeUser = useUserStore((s) => s.user);
  const updateUserPartial = useUserStore((s) => s.updateUserPartial);

  const user = storeUser || initialUser;
  const savedProfileVisibility: PrivacyLevel =
    user?.profileVisibility ?? "PUBLIC";
  const savedStatsVisibility: PrivacyLevel = user?.statsVisibility ?? "PUBLIC";
  const savedAchievementsVisibility: PrivacyLevel =
    user?.achievementsVisibility ?? "PUBLIC";
  const savedFriendRequestPolicy: FriendRequestPolicy =
    user?.friendRequestPolicy ?? "EVERYONE";

  const [profileVisibility, setProfileVisibility] = useState<PrivacyLevel>(
    savedProfileVisibility,
  );
  const [statsVisibility, setStatsVisibility] =
    useState<PrivacyLevel>(savedStatsVisibility);
  const [achievementsVisibility, setAchievementsVisibility] =
    useState<PrivacyLevel>(savedAchievementsVisibility);
  const [friendRequestPolicy, setFriendRequestPolicy] =
    useState<FriendRequestPolicy>(savedFriendRequestPolicy);
  const [friendCode, setFriendCode] = useState<string>(user?.friendCode ?? "");

  const [isSavingPrivacy, startSaveTransition] = useTransition();

  const { copiedCode, isRegenerating, handleCopyCode, handleRegenerateCode } =
    useFriendCodeActions({
      friendCode,
      messages: {
        copied: t("copiedFriendCode"),
        copyError: t("copyError"),
        regenerated: t("friendCodeRegenerated"),
        regenerateError: t("friendCodeRegenerateError"),
      },
      onRegenerated: setFriendCode,
    });

  useEffect(() => {
    setProfileVisibility(savedProfileVisibility);
    setStatsVisibility(savedStatsVisibility);
    setAchievementsVisibility(savedAchievementsVisibility);
    setFriendRequestPolicy(savedFriendRequestPolicy);
    if (user?.friendCode) {
      setFriendCode(user.friendCode);
    }
  }, [
    savedProfileVisibility,
    savedStatsVisibility,
    savedAchievementsVisibility,
    savedFriendRequestPolicy,
    user?.friendCode,
  ]);

  const hasChanges =
    profileVisibility !== savedProfileVisibility ||
    statsVisibility !== savedStatsVisibility ||
    achievementsVisibility !== savedAchievementsVisibility ||
    friendRequestPolicy !== savedFriendRequestPolicy;

  const levelOptions = PRIVACY_LEVEL_OPTIONS.map((opt) => ({
    value: opt.value,
    icon: opt.icon,
    title: t(`levels.${opt.value}`),
    description: t(`levels.${opt.value}Desc`),
  }));

  const policyOptions = FRIEND_REQUEST_POLICY_OPTIONS.map((opt) => ({
    value: opt.value,
    icon: opt.icon,
    title: t(`policies.${opt.value}`),
    description: t(`policies.${opt.value}Desc`),
  }));

  const handleSavePrivacy = () => {
    startSaveTransition(async () => {
      const res = await updatePrivacySettingsAction({
        profileVisibility,
        statsVisibility,
        achievementsVisibility,
        friendRequestPolicy,
      });
      if (!res.success || !res.user) {
        toast.error(res.error || t("saveError"));
        return;
      }
      updateUserPartial(res.user);
      toast.success(t("saveSuccess"));
    });
  };

  return (
    <div className={cn("flex flex-col", isCompact ? "gap-5" : "gap-6")}>
      {!user?.emailVerified && (
        <output className="flex items-center gap-2.5 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3.5 py-2.5 text-xs font-medium text-amber-800 dark:text-amber-300">
          <AlertTriangle size={15} className="shrink-0" aria-hidden="true" />
          <span>{t("unverifiedWarning")}</span>
        </output>
      )}

      {/* Código de Amigo */}
      <div className="rounded-xl border border-neutral-700 dark:border-primary/25 bg-surface/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-body-s font-bold text-neutral-100">
            {t("friendCodeSectionTitle")}
          </h3>
          <p className="text-tiny text-neutral-400 mt-0.5">
            {t("friendCodeSectionDesc")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <code className="px-3 py-1.5 rounded-lg bg-background border border-neutral-700 dark:border-primary/30 text-sm font-mono font-extrabold tracking-widest text-amber-700 dark:text-gold select-all">
            {friendCode || "HP-......"}
          </code>

          <button
            type="button"
            onClick={handleCopyCode}
            disabled={!friendCode}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-neutral-700 dark:border-primary/30 bg-card hover:bg-surface-hover text-neutral-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            {copiedCode ? (
              <Check
                size={14}
                className="text-emerald-700 dark:text-emerald-400"
                aria-hidden="true"
              />
            ) : (
              <Copy size={14} aria-hidden="true" />
            )}
            <span>{t("copyFriendCode")}</span>
          </button>

          <button
            type="button"
            onClick={handleRegenerateCode}
            disabled={isRegenerating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-gold transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={cn(isRegenerating && "animate-spin")}
              aria-hidden="true"
            />
            <span>
              {isRegenerating
                ? t("regeneratingFriendCode")
                : t("regenerateFriendCode")}
            </span>
          </button>
        </div>
      </div>

      {/* Seletores granulares de privacidade */}
      <OptionSelectorGroup
        labelId="privacy-profile-visibility"
        title={t("profileVisibilityTitle")}
        description={t("profileVisibilityDesc")}
        value={profileVisibility}
        options={levelOptions}
        onChange={setProfileVisibility}
        disabled={isSavingPrivacy}
      />

      <OptionSelectorGroup
        labelId="privacy-stats-visibility"
        title={t("statsVisibilityTitle")}
        description={t("statsVisibilityDesc")}
        value={statsVisibility}
        options={levelOptions}
        onChange={setStatsVisibility}
        disabled={isSavingPrivacy}
      />

      <OptionSelectorGroup
        labelId="privacy-achievements-visibility"
        title={t("achievementsVisibilityTitle")}
        description={t("achievementsVisibilityDesc")}
        value={achievementsVisibility}
        options={levelOptions}
        onChange={setAchievementsVisibility}
        disabled={isSavingPrivacy}
      />

      <OptionSelectorGroup
        labelId="privacy-friend-request-policy"
        title={t("friendRequestPolicyTitle")}
        description={t("friendRequestPolicyDesc")}
        value={friendRequestPolicy}
        options={policyOptions}
        onChange={setFriendRequestPolicy}
        disabled={isSavingPrivacy}
      />

      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={handleSavePrivacy}
          disabled={!hasChanges || isSavingPrivacy}
          className={cn(
            "px-5 py-2.5 rounded-xl text-sm font-extrabold transition-colors cursor-pointer",
            hasChanges
              ? "bg-gold text-on-gold hover:bg-amber-300 shadow-glow-gold-xs"
              : "bg-surface text-neutral-300 border border-neutral-600 cursor-not-allowed",
          )}
        >
          {isSavingPrivacy ? t("saving") : t("save")}
        </button>
      </div>
    </div>
  );
}
