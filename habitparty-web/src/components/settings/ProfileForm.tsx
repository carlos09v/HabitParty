"use client";

import { Save, User as UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import { updateUserProfileAction } from "@/actions/userActions";
import { DatePicker } from "@/components/ui/DatePicker";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { GENDER_OPTIONS } from "@/constants/settings";
import { useUserStore } from "@/store/userStore";
import type { GenderType, ProfileFormProps } from "@/types/settings";
import type { UpdateUserDTO } from "@/types/user";
import { cn } from "@/utils";
import { getMaxBirthDateString } from "@/utils/date";
import { validateBirthDate } from "@/utils/validators";

import { SettingsCard } from "./SettingsCard";

function resolveInitialBirthDate(
  user?: {
    birthDate?: string | null;
    gender?: string | null;
  } | null,
): string {
  if (!user?.birthDate) return "";
  if (user.birthDate === "2000-01-01" && user.gender === "PREFER_NOT_TO_SAY") {
    return "";
  }
  return user.birthDate;
}

export function ProfileForm({ initialUser, isCompact }: ProfileFormProps) {
  const t = useTranslations("settings.profileForm");
  const tGender = useTranslations("settings.profileForm.genderOptions");

  const storeUser = useUserStore((s) => s.user);
  const user = storeUser || initialUser;
  const updateUserPartial = useUserStore((s) => s.updateUserPartial);

  const maxBirthDate = useMemo(() => getMaxBirthDateString(12), []);

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [birthDate, setBirthDate] = useState(() =>
    resolveInitialBirthDate(user),
  );
  const [gender, setGender] = useState<GenderType | undefined>(user?.gender);

  const [isPending, startTransition] = useTransition();

  const localizedGenderOptions = useMemo(
    () =>
      GENDER_OPTIONS.map((opt) => ({
        value: opt.value,
        label: tGender(opt.value),
      })),
    [tGender],
  );

  // Sincroniza o formulário sempre que o usuário do store/prop atualizar
  useEffect(() => {
    if (user) {
      if (user.fullName !== undefined) setFullName(user.fullName);
      if (user.birthDate !== undefined)
        setBirthDate(resolveInitialBirthDate(user));
      if (user.gender !== undefined) setGender(user.gender);
    }
  }, [user]);

  // Detecta se houve qualquer alteração real nos campos em relação aos dados atuais do usuário
  const hasChanges = useMemo(() => {
    const currentFullName = fullName.trim();
    const currentBirthDate = birthDate || "";
    const currentGender = (gender as string) || "";

    const originalFullName = (user?.fullName || "").trim();
    const originalBirthDate = resolveInitialBirthDate(user);
    const originalGender = (user?.gender as string) || "";

    return (
      currentFullName !== originalFullName ||
      currentBirthDate !== originalBirthDate ||
      currentGender !== originalGender
    );
  }, [fullName, birthDate, gender, user]);

  const canSubmit =
    hasChanges && fullName.trim().length > 0 && fullName.trim().length <= 30;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!hasChanges) {
      toast.info(t("noChangesToast"));
      return;
    }

    if (!fullName.trim()) {
      toast.error(t("nameRequired"));
      return;
    }

    if (fullName.length > 30) {
      toast.error(t("nameMaxToast"));
      return;
    }

    if (birthDate) {
      const birthDateValidation = validateBirthDate(birthDate);
      if (!birthDateValidation.isValid) {
        toast.error(birthDateValidation.error);
        return;
      }
    }

    const payload: UpdateUserDTO = {
      fullName: fullName.trim(),
      ...(birthDate ? { birthDate } : {}),
      ...(gender ? { gender } : {}),
    };

    startTransition(async () => {
      const res = await updateUserProfileAction(payload);
      if (res.success) {
        toast.success(t("successToast"));
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
    <SettingsCard
      title={t("cardTitle")}
      description={t("cardDesc")}
      icon={<UserIcon size={18} className="text-gold" />}
      isCompact={isCompact}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* NOME COMPLETO */}
          <div className="md:col-span-2">
            <Input
              id="fullName"
              label={t("fullNameLabel")}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("fullNamePlaceholder")}
              maxLength={30}
              compact={isCompact}
              icon={<UserIcon size={18} />}
              required
            />
            <span className="text-tiny text-neutral-400 mt-1 block text-right">
              {t("charCounter", { current: fullName.length, max: 30 })}
            </span>
          </div>

          {/* DATA DE NASCIMENTO */}
          <div>
            <DatePicker
              id="birthDate"
              label={t("birthdayLabel")}
              value={birthDate}
              onChange={setBirthDate}
              compact={isCompact}
              placeholder={t("birthdayPlaceholder")}
              maxDate={maxBirthDate}
            />
          </div>

          {/* GÊNERO COM SELECT PADRONIZADO DO DESIGN SYSTEM */}
          <div>
            <Select
              id="gender"
              label={t("genderLabel")}
              placeholder={t("genderPlaceholder")}
              value={gender || ""}
              compact={isCompact}
              options={localizedGenderOptions}
              onChange={(val) => setGender((val || undefined) as GenderType)}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-700 dark:border-primary/20">
          <button
            type="submit"
            disabled={isPending || !canSubmit}
            className={cn(
              "rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md",
              "bg-gold text-on-gold hover:bg-gold-hover active:bg-gold-pressed",
              "disabled:bg-neutral-700 disabled:text-neutral-400 disabled:border disabled:border-neutral-600 disabled:shadow-none disabled:opacity-100 dark:disabled:bg-gold dark:disabled:text-on-gold dark:disabled:border-transparent dark:disabled:opacity-40 disabled:cursor-not-allowed",
              isCompact ? "px-4 py-2 text-xs" : "px-6 py-2.5 text-sm",
            )}
            title={!hasChanges ? t("noChangesTitle") : t("save")}
          >
            {isPending ? (
              t("saving")
            ) : (
              <>
                <Save size={16} />
                {t("save")}
              </>
            )}
          </button>
        </div>
      </form>
    </SettingsCard>
  );
}
