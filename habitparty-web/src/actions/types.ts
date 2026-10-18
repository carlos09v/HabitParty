export type ActionState<T = void> =
  | (T extends void
      ? { success: true; data?: undefined }
      : { success: true; data: T })
  | { success: false; error: string };

export type ActionResponse<T = void> = ActionState<T>;

export function getErrorMessage(
  error: unknown,
  fallback = "Ocorreu um erro inesperado.",
): string {
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  if (error && typeof error === "object") {
    if (
      "message" in error &&
      typeof (error as { message: unknown }).message === "string" &&
      (error as { message: string }).message.trim()
    ) {
      return (error as { message: string }).message;
    }
    if (
      "error" in error &&
      typeof (error as { error: unknown }).error === "string" &&
      (error as { error: string }).error.trim()
    ) {
      return (error as { error: string }).error;
    }
  }
  return fallback;
}
