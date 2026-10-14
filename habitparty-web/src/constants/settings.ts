import type { GenderOption, PasswordValidationResult } from "@/types/user";

export const GENDER_OPTIONS: readonly GenderOption[] = [
  { value: "MALE", label: "Masculino" },
  { value: "FEMALE", label: "Feminino" },
  { value: "NON_BINARY", label: "Não-binário" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefiro não informar" },
] as const;

export const PASSWORD_MIN_LENGTH = 8;

export function validatePasswordRequirements(
  newPassword: string,
  confirmPassword: string,
): PasswordValidationResult {
  const hasMinLength = newPassword.length >= PASSWORD_MIN_LENGTH;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasSpecialChar = /[@$!%*?&#]/.test(newPassword);
  const passwordsMatch =
    newPassword.length > 0 && newPassword === confirmPassword;

  const isValid =
    hasMinLength && hasUpperCase && hasSpecialChar && passwordsMatch;

  return {
    hasMinLength,
    hasUpperCase,
    hasSpecialChar,
    passwordsMatch,
    isValid,
  };
}
