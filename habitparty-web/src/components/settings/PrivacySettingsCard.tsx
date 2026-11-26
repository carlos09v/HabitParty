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
import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import { updatePrivacySettingsAction } from "@/actions/socialActions";
import { useRegisterSettingsDirty } from "@/components/settings/SettingsDirtyContext";
import { SettingsOptionGrid } from "@/components/settings/SettingsOptionGrid";
import { SettingsSaveButton } from "@/components/settings/SettingsSaveButton";
import { FriendCodeCard } from "@/components/social/FriendCodeCard";
import { useResolvedUser } from "@/hooks/useResolvedUser";
import { useSyncedSettingsForm } from "@/hooks/useSyncedSettingsForm";
import { useUserStore } from "@/store/userStore";
import type { FriendRequestPolicy, PrivacyLevel } from "@/types/social";
import type { UserResponseDTO } from "@/types/user";

interface PrivacySettingsCardProps {
  initialUser: UserResponseDTO | null;
}

interface PrivacyFormValues extends Record<string, unknown> {
  profileVisibility: PrivacyLevel;
  statsVisibility: PrivacyLevel;
  achievementsVisibility: PrivacyLevel;
  friendRequestPolicy: FriendRequestPolicy;
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
  const updateUserPartial = useUserStore((s) => s.updateUserPartial);

  const user = useResolvedUser(initialUser);
  const userId = user?.id;
  const savedProfileVisibility: PrivacyLevel =
    user?.profileVisibility ?? "PUBLIC";
  const savedStatsVisibility: PrivacyLevel = user?.statsVisibility ?? "PUBLIC";
  const savedAchievementsVisibility: PrivacyLevel =
    user?.achievementsVisibility ?? "PUBLIC";
  const savedFriendRequestPolicy: FriendRequestPolicy =
    user?.friendRequestPolicy ?? "EVERYONE";
  const friendCode = user?.friendCode ?? "";

  const persisted = useMemo<PrivacyFormValues>(
    () => ({
      profileVisibility: savedProfileVisibility,
      statsVisibility: savedStatsVisibility,
      achievementsVisibility: savedAchievementsVisibility,
      friendRequestPolicy: savedFriendRequestPolicy,
    }),
    [
      savedProfileVisibility,
      savedStatsVisibility,
      savedAchievementsVisibility,
      savedFriendRequestPolicy,
    ],
  );

  const {
    values,
    setField,
    markSaved,
    isDirty: hasChanges,
  } = useSyncedSettingsForm(persisted, { resetKey: userId });
  const {
    profileVisibility,
    statsVisibility,
    achievementsVisibility,
    friendRequestPolicy,
  } = values;

  const [isSavingPrivacy, startSaveTransition] = useTransition();

  useRegisterSettingsDirty("privacy-settings", hasChanges);

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

  const isProfilePrivate = profileVisibility === "PRIVATE";
  const statsRestrictedByFriendsOnly =
    profileVisibility === "FRIENDS_ONLY" && statsVisibility === "PUBLIC";
  const achievementsRestrictedByFriendsOnly =
    profileVisibility === "FRIENDS_ONLY" && achievementsVisibility === "PUBLIC";

  const handleSavePrivacy = () => {
    if (isSavingPrivacy || !hasChanges) return;
    const submitted: PrivacyFormValues = {
      profileVisibility,
      statsVisibility,
      achievementsVisibility,
      friendRequestPolicy,
    };
    startSaveTransition(async () => {
      const res = await updatePrivacySettingsAction(submitted);
      if (!res.success) {
        toast.error(res.error || t("saveError"));
        return;
      }
      markSaved(submitted, {
        profileVisibility:
          res.data.profileVisibility ?? submitted.profileVisibility,
        statsVisibility: res.data.statsVisibility ?? submitted.statsVisibility,
        achievementsVisibility:
          res.data.achievementsVisibility ?? submitted.achievementsVisibility,
        friendRequestPolicy:
          res.data.friendRequestPolicy ?? submitted.friendRequestPolicy,
      });
      updateUserPartial(res.data);
      toast.success(t("saveSuccess"));
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {!user?.emailVerified && (
        <aside className="flex items-center gap-2.5 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3.5 py-2.5 text-xs font-medium text-amber-800 dark:text-amber-300">
          <AlertTriangle size={15} className="shrink-0" aria-hidden="true" />
          <span>{t("unverifiedWarning")}</span>
        </aside>
      )}

      <FriendCodeCard
        friendCode={friendCode}
        title={t("friendCodeSectionTitle")}
        description={t("friendCodeSectionDesc")}
        copyLabel={t("copyFriendCode")}
        regenerateLabel={t("regenerateFriendCode")}
        regeneratingLabel={t("regeneratingFriendCode")}
        confirmRegenerate={{
          title: t("confirmRegenerateTitle"),
          description: t("confirmRegenerateDesc"),
          confirmLabel: t("confirmRegenerateBtn"),
          cancelLabel: t("confirmCancelBtn"),
        }}
        messages={{
          copied: t("copiedFriendCode"),
          copyError: t("copyError"),
          regenerated: t("friendCodeRegenerated"),
          regenerateError: t("friendCodeRegenerateError"),
        }}
      />

      <SettingsOptionGrid
        variant="compact"
        labelId="privacy-profile-visibility"
        title={t("profileVisibilityTitle")}
        description={t("profileVisibilityDesc")}
        selectedValue={profileVisibility}
        options={levelOptions}
        onSelect={(val) => setField("profileVisibility", val)}
        disabled={isSavingPrivacy}
      />

      <SettingsOptionGrid
        variant="compact"
        labelId="privacy-stats-visibility"
        title={t("statsVisibilityTitle")}
        description={t("statsVisibilityDesc")}
        selectedValue={statsVisibility}
        options={levelOptions}
        onSelect={(val) => setField("statsVisibility", val)}
        disabled={isSavingPrivacy || isProfilePrivate}
        dimmed={isProfilePrivate}
        dependencyHint={
          isProfilePrivate
            ? t("profilePrivateDependencyHint")
            : statsRestrictedByFriendsOnly
              ? t("profileFriendsDependencyHint")
              : undefined
        }
      />

      <SettingsOptionGrid
        variant="compact"
        labelId="privacy-achievements-visibility"
        title={t("achievementsVisibilityTitle")}
        description={t("achievementsVisibilityDesc")}
        selectedValue={achievementsVisibility}
        options={levelOptions}
        onSelect={(val) => setField("achievementsVisibility", val)}
        disabled={isSavingPrivacy || isProfilePrivate}
        dimmed={isProfilePrivate}
        dependencyHint={
          isProfilePrivate
            ? t("profilePrivateDependencyHint")
            : achievementsRestrictedByFriendsOnly
              ? t("profileFriendsDependencyHint")
              : undefined
        }
      />

      <SettingsOptionGrid
        variant="compact"
        labelId="privacy-friend-request-policy"
        title={t("friendRequestPolicyTitle")}
        description={t("friendRequestPolicyDesc")}
        selectedValue={friendRequestPolicy}
        options={policyOptions}
        onSelect={(val) => setField("friendRequestPolicy", val)}
        disabled={isSavingPrivacy}
      />

      <div className="flex justify-end pt-4 border-t border-neutral-700 dark:border-primary/20">
        <SettingsSaveButton
          type="button"
          onClick={handleSavePrivacy}
          isPending={isSavingPrivacy}
          disabled={!hasChanges}
          label={t("save")}
          savingLabel={t("saving")}
        />
      </div>
    </div>
  );
}
