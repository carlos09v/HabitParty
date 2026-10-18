import type { components } from "@/api/schema";

export type UserResponseDTO = components["schemas"]["UserResponseDTO"];
export type CreateUserDTO = components["schemas"]["CreateUserDTO"];
export type UpdateUserDTO = components["schemas"]["UpdateUserDTO"];
export type UpdateUserPasswordDTO =
  components["schemas"]["UpdateUserPasswordDTO"];

export type {
  GenderOption,
  GenderType,
  PasswordValidationResult,
  ProfileCardBaseProps,
  ProfileFormProps,
  ProfileHeaderCardProps,
} from "./settings";
