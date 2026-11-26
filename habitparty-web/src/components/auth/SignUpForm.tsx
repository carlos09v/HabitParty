"use client";

import { User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { signUpAction } from "@/actions/auth";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { AuthFormAlert } from "@/components/auth/AuthFormAlert";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { BirthDateInput } from "@/components/ui/BirthDateInput";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { GENDER_OPTIONS } from "@/constants/settings";
import type { CreateUserDTO, GenderType } from "@/types/user";
import { detectBrowserTimeZone } from "@/utils/date";
import {
  FULL_NAME_MAX_LENGTH,
  MIN_USER_AGE,
  PASSWORD_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
  validateAuthPassword,
  validateBirthDate,
  validateEmail,
  validateFullName,
  validateUsername,
} from "@/utils/validators";

interface TouchedFields {
  fullName: boolean;
  email: boolean;
  username: boolean;
  password: boolean;
  birthDate: boolean;
}

export function SignUpForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("auth.signUp");
  const tOAuth = useTranslations("auth.oauth");
  const tValidation = useTranslations("auth.validation");

  const fullNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const birthDateRef = useRef<HTMLInputElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const genderOptions = GENDER_OPTIONS.map((opt) => ({
    value: opt.value,
    label: t(`genderOptions.${opt.value}`),
  }));

  const [fullNameValue, setFullNameValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [usernameValue, setUsernameValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [birthDateValue, setBirthDateValue] = useState("");
  const [gender, setGender] = useState<string>("PREFER_NOT_TO_SAY");
  const [hasManuallyEditedUsername, setHasManuallyEditedUsername] =
    useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [touched, setTouched] = useState<TouchedFields>({
    fullName: false,
    email: false,
    username: false,
    password: false,
    birthDate: false,
  });

  const markTouched = (field: keyof TouchedFields) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  };

  // Sugere um username baseado no email quando o usuário ainda não digitou manualmente
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setEmailValue(email);
    if (formError) setFormError(null);

    if (!hasManuallyEditedUsername) {
      const derived = email
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, USERNAME_MAX_LENGTH);
      setUsernameValue(derived);
    }
  };

  // Validação pós-interação por campo
  const fullNameValidation = validateFullName(fullNameValue);
  const fullNameError =
    touched.fullName &&
    !fullNameValidation.isValid &&
    fullNameValidation.errorKey
      ? tValidation(fullNameValidation.errorKey, { max: FULL_NAME_MAX_LENGTH })
      : undefined;

  const emailValidation = validateEmail(emailValue);
  const emailError =
    touched.email && !emailValidation.isValid && emailValidation.errorKey
      ? tValidation(emailValidation.errorKey)
      : undefined;

  const usernameValidation = validateUsername(usernameValue);
  const usernameError =
    touched.username &&
    !usernameValidation.isValid &&
    usernameValidation.errorKey
      ? tValidation(usernameValidation.errorKey)
      : undefined;

  const passwordValidation = validateAuthPassword(passwordValue);
  const passwordError =
    touched.password && !passwordValidation.isValid
      ? passwordValidation.errorKey
        ? tValidation(passwordValidation.errorKey, {
            max: PASSWORD_MAX_LENGTH,
          })
        : passwordValidation.error
      : undefined;

  const birthDateValidation = validateBirthDate(birthDateValue);
  const birthDateError =
    touched.birthDate && !birthDateValidation.isValid
      ? birthDateValidation.errorKey
        ? tValidation(birthDateValidation.errorKey, { minAge: MIN_USER_AGE })
        : birthDateValidation.error
      : undefined;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setTouched({
      fullName: true,
      email: true,
      username: true,
      password: true,
      birthDate: true,
    });

    const fullName = fullNameValue.trim();
    const email = emailValue.trim();
    const username = usernameValue
      .trim()
      .toLowerCase()
      .slice(0, USERNAME_MAX_LENGTH);
    const password = passwordValue;
    const birthDate = birthDateValue.trim();
    const selectedGender = (gender || "PREFER_NOT_TO_SAY") as GenderType;

    if (!validateFullName(fullName).isValid) {
      fullNameRef.current?.focus();
      return;
    }

    if (!validateEmail(email).isValid) {
      emailRef.current?.focus();
      return;
    }

    if (!validateUsername(username).isValid) {
      usernameRef.current?.focus();
      return;
    }

    if (!validateAuthPassword(password).isValid) {
      passwordRef.current?.focus();
      return;
    }

    if (!validateBirthDate(birthDate).isValid) {
      birthDateRef.current?.focus();
      return;
    }

    const honeypot = honeypotRef.current?.value.trim() || "";

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
      try {
        const result = await signUpAction(payload, { honeypot });

        if (!result.success) {
          setFormError(result.error);
          toast.error(result.error);
        } else if (!result.data.autoSignedIn) {
          toast.info(t("autoSignInFallbackToast"));
          router.push("/signIn?error=signup_login_required");
        } else {
          toast.success(t("successToast"));
          router.push("/firstStep");
        }
      } catch {
        const fallbackError = t("connectionError");
        setFormError(fallbackError);
        toast.error(fallbackError);
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4 w-full"
    >
      {/* Campo Honeypot fora de tela para proteção contra bots */}
      <input
        ref={honeypotRef}
        type="text"
        name="website_url_trap"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="pointer-events-none fixed -left-[9999px] top-0 h-px w-px opacity-0"
      />

      <AuthFormAlert message={formError} />

      <Input
        ref={fullNameRef}
        label={t("fullNameLabel")}
        id="fullName"
        name="fullName"
        type="text"
        autoComplete="name"
        enterKeyHint="next"
        maxLength={FULL_NAME_MAX_LENGTH}
        value={fullNameValue}
        onChange={(e) => {
          setFullNameValue(e.target.value);
          if (formError) setFormError(null);
        }}
        onBlur={() => markTouched("fullName")}
        error={fullNameError}
        placeholder={t("fullNamePlaceholder")}
        required
        disabled={isPending}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
        <Input
          ref={emailRef}
          label={t("emailLabel")}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="next"
          value={emailValue}
          onChange={handleEmailChange}
          onBlur={() => markTouched("email")}
          error={emailError}
          placeholder={t("emailPlaceholder")}
          required
          disabled={isPending}
        />

        <Input
          ref={usernameRef}
          label={t("usernameLabel")}
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="next"
          value={usernameValue}
          maxLength={USERNAME_MAX_LENGTH}
          onChange={(e) => {
            setUsernameValue(
              e.target.value.toLowerCase().slice(0, USERNAME_MAX_LENGTH),
            );
            setHasManuallyEditedUsername(true);
            if (formError) setFormError(null);
          }}
          onBlur={() => markTouched("username")}
          error={usernameError}
          placeholder={t("usernamePlaceholder")}
          icon={<User size={18} aria-hidden="true" />}
          required
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Input
          ref={passwordRef}
          label={t("passwordLabel")}
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          enterKeyHint="next"
          maxLength={PASSWORD_MAX_LENGTH}
          value={passwordValue}
          onChange={(e) => {
            setPasswordValue(e.target.value);
            if (formError) setFormError(null);
          }}
          onBlur={() => markTouched("password")}
          error={passwordError}
          placeholder={t("passwordPlaceholder")}
          required
          disabled={isPending}
        />
        <PasswordStrengthIndicator password={passwordValue} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full items-start">
        {/* Data de Nascimento (Componente leve, reutilizável e estilizado) */}
        <BirthDateInput
          ref={birthDateRef}
          label={t("birthdayLabel")}
          id="dob"
          name="birthDate"
          value={birthDateValue}
          onChange={(val) => {
            setBirthDateValue(val);
            if (formError) setFormError(null);
          }}
          onBlur={() => markTouched("birthDate")}
          error={birthDateError}
          hint={t("birthdayHint", { minAge: MIN_USER_AGE })}
          clearAriaLabel={t("birthdayClearAria")}
          placeholder={t("birthdayPlaceholder")}
          enterKeyHint="next"
          required
          disabled={isPending}
        />

        {/* Gênero (Opcional) */}
        <div className="w-full min-w-0">
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

      <div className="flex flex-col gap-3 mt-2">
        <SubmitButton isPending={isPending} loadingText={t("submitting")}>
          {t("submit")}
        </SubmitButton>

        <AuthDivider label={tOAuth("divider")} />

        <GoogleSignInButton disabled={isPending} />
      </div>
    </form>
  );
}
