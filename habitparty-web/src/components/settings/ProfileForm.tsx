"use client";

import { User as UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FormEvent, useMemo, useTransition } from "react";
import { toast } from "sonner";
import { updateUserProfileAction } from "@/actions/userActions";
import { useRegisterSettingsDirty } from "@/components/settings/SettingsDirtyContext";
import { SettingsSaveButton } from "@/components/settings/SettingsSaveButton";
import { DatePicker } from "@/components/ui/DatePicker";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { GENDER_OPTIONS } from "@/constants/settings";
import { useResolvedUser } from "@/hooks/useResolvedUser";
import { useSyncedSettingsForm } from "@/hooks/useSyncedSettingsForm";
import { useUserStore } from "@/store/userStore";
import type { GenderType, ProfileFormProps } from "@/types/settings";
import type { UpdateUserDTO } from "@/types/user";
import { getMaxBirthDateString } from "@/utils/date";
import { MIN_USER_AGE, validateBirthDate } from "@/utils/validators";

interface ProfileFormValues extends Record<string, unknown> {
  fullName: string;
  birthDate: string;
  gender: GenderType | undefined;
}

export function ProfileForm({ initialUser }: ProfileFormProps) {
  const t = useTranslations("settings.profileForm");
  const tGender = useTranslations("settings.profileForm.genderOptions");
  const tValidation = useTranslations("auth.validation");

  const resolvedUser = useResolvedUser(initialUser);
  const userId = resolvedUser?.id;
  const serverFullName = resolvedUser?.fullName ?? "";
  const serverBirthDate = resolvedUser?.birthDate ?? "";
  const serverGender = resolvedUser?.gender;
  const userTimezone = resolvedUser?.timezone;
  const updateUserPartial = useUserStore((s) => s.updateUserPartial);

  const maxBirthDate = useMemo(
    () => getMaxBirthDateString(MIN_USER_AGE, new Date(), userTimezone),
    [userTimezone],
  );

  const persisted = useMemo<ProfileFormValues>(
    () => ({
      fullName: serverFullName,
      birthDate: serverBirthDate,
      gender: serverGender,
    }),
    [serverFullName, serverBirthDate, serverGender],
  );

  const { values, setField, markSaved } = useSyncedSettingsForm(persisted, {
    resetKey: userId,
  });
  const { fullName, birthDate, gender } = values;
  const [isPending, startTransition] = useTransition();

  const localizedGenderOptions = useMemo(
    () =>
      GENDER_OPTIONS.map((opt) => ({
        value: opt.value,
        label: tGender(opt.value),
      })),
    [tGender],
  );

  const hasChanges =
    fullName.trim() !== serverFullName.trim() ||
    (birthDate || "") !== (serverBirthDate || "") ||
    ((gender as string) || "") !== ((serverGender as string) || "");

  useRegisterSettingsDirty("profile-form", hasChanges);

  const canSubmit =
    hasChanges && fullName.trim().length > 0 && fullName.trim().length <= 150;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isPending) return;

    if (!hasChanges) {
      toast.info(t("noChangesToast"));
      return;
    }

    if (!fullName.trim()) {
      toast.error(t("nameRequired"));
      return;
    }

    if (fullName.trim().length > 150) {
      toast.error(t("nameMaxToast"));
      return;
    }

    if (birthDate) {
      const birthDateValidation = validateBirthDate(
        birthDate,
        undefined,
        undefined,
        userTimezone,
      );
      if (!birthDateValidation.isValid) {
        toast.error(
          birthDateValidation.errorKey
            ? tValidation(birthDateValidation.errorKey)
            : birthDateValidation.error,
        );
        return;
      }
    }

    const submitted: ProfileFormValues = { fullName, birthDate, gender };
    const payload: UpdateUserDTO = {
      fullName: fullName.trim(),
      ...(birthDate ? { birthDate } : {}),
      ...(gender ? { gender } : {}),
    };

    startTransition(async () => {
      const res = await updateUserProfileAction(payload);
      if (res.success) {
        toast.success(t("successToast"));
        const nextFullName =
          res.data?.fullName ?? payload.fullName ?? submitted.fullName.trim();
        const nextBirthDate = res.data?.birthDate ?? payload.birthDate ?? "";
        const nextGender = res.data?.gender ?? payload.gender;
        markSaved(submitted, {
          fullName: nextFullName,
          birthDate: nextBirthDate,
          gender: nextGender,
        });
        if (res.data) {
          updateUserPartial(res.data);
        } else {
          updateUserPartial({
            fullName: payload.fullName,
            birthDate: payload.birthDate,
            gender: payload.gender,
          });
        }
      } else {
        toast.error(res.error || t("errorToast"));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* NOME COMPLETO */}
        <div className="md:col-span-2">
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            label={t("fullNameLabel")}
            value={fullName}
            onChange={(e) => setField("fullName", e.target.value)}
            placeholder={t("fullNamePlaceholder")}
            maxLength={150}
            icon={<UserIcon size={18} aria-hidden="true" />}
            required
          />
          <span className="text-tiny text-neutral-400 mt-1 block text-right">
            {t("charCounter", { current: fullName.length, max: 150 })}
          </span>
        </div>

        {/* DATA DE NASCIMENTO */}
        <div>
          <DatePicker
            id="birthDate"
            name="birthDate"
            label={t("birthdayLabel")}
            value={birthDate}
            onChange={(val) => setField("birthDate", val)}
            placeholder={t("birthdayPlaceholder")}
            maxDate={maxBirthDate}
            allowClear={!serverBirthDate}
          />
        </div>

        {/* GÊNERO COM SELECT PADRONIZADO DO DESIGN SYSTEM */}
        <div>
          <Select
            id="gender"
            name="gender"
            label={t("genderLabel")}
            placeholder={t("genderPlaceholder")}
            value={gender || ""}
            options={localizedGenderOptions}
            onChange={(val) =>
              setField("gender", (val || "PREFER_NOT_TO_SAY") as GenderType)
            }
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-700 dark:border-primary/20">
        <SettingsSaveButton
          type="submit"
          label={t("save")}
          savingLabel={t("saving")}
          isPending={isPending}
          disabled={!canSubmit}
          title={!hasChanges ? t("noChangesTitle") : t("save")}
        />
      </div>
    </form>
  );
}
