import type { components } from "@/api/schema";

export type UserResponseDTO = components["schemas"]["UserResponseDTO"];
export type CreateUserDTO = components["schemas"]["CreateUserDTO"];
export type UpdateUserDTO = components["schemas"]["UpdateUserDTO"];
export type UpdateUserPasswordDTO =
  components["schemas"]["UpdateUserPasswordDTO"];

export type GenderType = "MALE" | "FEMALE" | "NON_BINARY" | "PREFER_NOT_TO_SAY";
