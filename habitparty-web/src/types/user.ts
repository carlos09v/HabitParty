import type { components } from "@/api/schema";

export type UserResponseDTO = components["schemas"]["UserResponseDTO"];
export type CreateUserDTO = components["schemas"]["CreateUserDTO"];
export type UpdateUserDTO = components["schemas"]["UpdateUserDTO"];
export type UpdateUserPasswordDTO =
  components["schemas"]["UpdateUserPasswordDTO"];

export type GenderType = UpdateUserDTO["gender"];

export interface GenderOption {
  value: NonNullable<GenderType>;
  label: string;
}

export interface PasswordValidationResult {
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasSpecialChar: boolean;
  passwordsMatch: boolean;
  isValid: boolean;
}

export interface ProfileCardBaseProps {
  isCompact?: boolean;
}

export interface ProfileHeaderCardProps extends ProfileCardBaseProps {
  initialUser: UserResponseDTO | null;
}

export interface ProfileFormProps extends ProfileCardBaseProps {
  initialUser: UserResponseDTO | null;
}
