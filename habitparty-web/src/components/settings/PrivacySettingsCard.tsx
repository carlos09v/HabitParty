"use client";

import {
  AlertTriangle,
  Globe,
  KeyRound,
  Lock,
  ShieldBan,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { updatePrivacySettingsAction } from "@/actions/socialActions";
import { SettingsOptionGrid } from "@/components/settings/SettingsOptionGrid";
import { FriendCodeCard } from "@/components/social/FriendCodeCard";
import { useUserStore } from "@/store/userStore";
import type { FriendRequestPolicy, PrivacyLevel } from "@/types/social";
import type { UserResponseDTO } from "@/types/user";
import { cn } from "@/utils";

interface PrivacySettingsCardProps {
  initialUser: UserResponseDTO | null;
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

export function PrivacySettingsCard({ initialUser }: PrivacySettingsCardProps) {
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
    <div className="flex flex-col gap-6">
      {!user?.emailVerified && (
        <output className="flex items-center gap-2.5 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3.5 py-2.5 text-xs font-medium text-amber-800 dark:text-amber-300">
          <AlertTriangle size={15} className="shrink-0" aria-hidden="true" />
          <span>{t("unverifiedWarning")}</span>
        </output>
      )}

      <FriendCodeCard
        friendCode={friendCode}
        title={t("friendCodeSectionTitle")}
        description={t("friendCodeSectionDesc")}
        copyLabel={t("copyFriendCode")}
        regenerateLabel={t("regenerateFriendCode")}
        regeneratingLabel={t("regeneratingFriendCode")}
        messages={{
          copied: t("copiedFriendCode"),
          copyError: t("copyError"),
          regenerated: t("friendCodeRegenerated"),
          regenerateError: t("friendCodeRegenerateError"),
        }}
        onRegenerated={setFriendCode}
      />

      <SettingsOptionGrid
        variant="compact"
        labelId="privacy-profile-visibility"
        title={t("profileVisibilityTitle")}
        description={t("profileVisibilityDesc")}
        selectedValue={profileVisibility}
        options={levelOptions}
        onSelect={setProfileVisibility}
        disabled={isSavingPrivacy}
      />

      <SettingsOptionGrid
        variant="compact"
        labelId="privacy-stats-visibility"
        title={t("statsVisibilityTitle")}
        description={t("statsVisibilityDesc")}
        selectedValue={statsVisibility}
        options={levelOptions}
        onSelect={setStatsVisibility}
        disabled={isSavingPrivacy}
      />

      <SettingsOptionGrid
        variant="compact"
        labelId="privacy-achievements-visibility"
        title={t("achievementsVisibilityTitle")}
        description={t("achievementsVisibilityDesc")}
        selectedValue={achievementsVisibility}
        options={levelOptions}
        onSelect={setAchievementsVisibility}
        disabled={isSavingPrivacy}
      />

      <SettingsOptionGrid
        variant="compact"
        labelId="privacy-friend-request-policy"
        title={t("friendRequestPolicyTitle")}
        description={t("friendRequestPolicyDesc")}
        selectedValue={friendRequestPolicy}
        options={policyOptions}
        onSelect={setFriendRequestPolicy}
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
