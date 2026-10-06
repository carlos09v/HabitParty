export type ActionState<T = unknown> =
  | { success: true; data?: T }
  | { success: false; error: string };

export function getErrorMessage(
  error: unknown,
  fallback = "Ocorreu um erro inesperado.",
): string {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
}
