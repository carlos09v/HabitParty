"use client";

import { User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { signUpAction } from "@/actions/auth";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { DatePicker } from "@/components/ui/DatePicker";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { GENDER_OPTIONS } from "@/constants/settings";
import type { CreateUserDTO, GenderType } from "@/types/user";
import { detectBrowserTimeZone, getMaxBirthDateString } from "@/utils/date";
import {
  MIN_USER_AGE,
  validateAuthPassword,
  validateBirthDate,
} from "@/utils/validators";

export function SignUpForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("auth.signUp");
  const tValidation = useTranslations("auth.validation");

  const maxBirthDate = useMemo(() => getMaxBirthDateString(MIN_USER_AGE), []);

  const genderOptions = useMemo(
    () =>
      GENDER_OPTIONS.map((opt) => ({
        value: opt.value,
        label: t(`genderOptions.${opt.value}`),
      })),
    [t],
  );

  const [gender, setGender] = useState<string>("PREFER_NOT_TO_SAY");
  const [emailValue, setEmailValue] = useState("");
  const [usernameValue, setUsernameValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [hasManuallyEditedUsername, setHasManuallyEditedUsername] =
    useState(false);

  // Sugere um username baseado no email quando o usuário ainda não digitou manualmente
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setEmailValue(email);

    if (!hasManuallyEditedUsername) {
      const derived = email
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 30);
      setUsernameValue(derived);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const fullName = formData.get("fullName")?.toString().trim() || "";
    const email = formData.get("email")?.toString().trim() || "";
    const username = (
      formData.get("username")?.toString().trim() || email.split("@")[0]
    )
      .toLowerCase()
      .slice(0, 30);
    const password =
      passwordValue || formData.get("password")?.toString() || "";
    const birthDate = formData.get("birthDate")?.toString() || "";
    const selectedGender = (gender || "PREFER_NOT_TO_SAY") as GenderType;

    const validation = validateAuthPassword(password);
    if (!validation.isValid) {
      toast.error(
        validation.errorKey
          ? tValidation(validation.errorKey)
          : validation.error,
      );
      return;
    }

    const birthDateValidation = validateBirthDate(birthDate);
    if (!birthDateValidation.isValid) {
      toast.error(
        birthDateValidation.errorKey
          ? tValidation(birthDateValidation.errorKey, { minAge: MIN_USER_AGE })
          : birthDateValidation.error,
      );
      return;
    }

    const honeypot = formData.get("website_url_trap")?.toString().trim() || "";

    const payload: CreateUserDTO = {
      fullName,
      username,
      email,
      password,
      birthDate,
      gender: selectedGender || "PREFER_NOT_TO_SAY",
      timezone: detectBrowserTimeZone(),
    };

    startTransition(async () => {
      const result = await signUpAction(payload, { honeypot });

      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success(t("successToast"));
        router.push("/firstStep");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      {/* Campo Honeypot invisível para proteção contra bots */}
      <input
        type="text"
        name="website_url_trap"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />
      <Input
        label={t("fullNameLabel")}
        id="fullName"
        name="fullName"
        type="text"
        placeholder={t("fullNamePlaceholder")}
        required
        disabled={isPending}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label={t("emailLabel")}
          id="email"
          name="email"
          type="email"
          value={emailValue}
          onChange={handleEmailChange}
          placeholder={t("emailPlaceholder")}
          required
          disabled={isPending}
        />

        <Input
          label={t("usernameLabel")}
          id="username"
          name="username"
          type="text"
          value={usernameValue}
          maxLength={30}
          onChange={(e) => {
            setUsernameValue(e.target.value.slice(0, 30));
            setHasManuallyEditedUsername(true);
          }}
          placeholder={t("usernamePlaceholder")}
          icon={<User size={18} aria-hidden="true" />}
          required
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Input
          label={t("passwordLabel")}
          id="password"
          name="password"
          type="password"
          value={passwordValue}
          onChange={(e) => setPasswordValue(e.target.value)}
          placeholder={t("passwordPlaceholder")}
          required
          disabled={isPending}
        />
        <PasswordStrengthIndicator password={passwordValue} />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full items-start">
        {/* Data de Nascimento */}
        <div className="flex-1 w-full sm:w-auto min-w-0">
          <DatePicker
            label={t("birthdayLabel")}
            id="dob"
            name="birthDate"
            placeholder={t("birthdayPlaceholder")}
            required
            disabled={isPending}
            maxDate={maxBirthDate}
          />
        </div>

        {/* Gênero */}
        <div className="flex-1 w-full sm:w-auto min-w-0">
          <Select
            label={t("genderLabel")}
            placeholder={t("genderPlaceholder")}
            options={genderOptions}
            value={gender}
            onChange={setGender}
            name="gender"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="mt-2">
        <SubmitButton isPending={isPending} loadingText={t("submitting")}>
          {t("submit")}
        </SubmitButton>
      </div>
    </form>
  );
}
