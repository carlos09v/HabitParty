export const OAUTH_STATE_COOKIE = "habitparty_oauth_state";
export const OAUTH_RETURN_TO_COOKIE = "habitparty_oauth_return_to";

export const AUTH_URL_ERROR_CODES = [
  "oauth_cancelled",
  "oauth_state_mismatch",
  "oauth_no_code",
  "oauth_failed",
  "session_expired",
  "signup_login_required",
] as const;

export type AuthUrlErrorCode = (typeof AUTH_URL_ERROR_CODES)[number];

export function isAuthUrlErrorCode(
  value: string | null | undefined,
): value is AuthUrlErrorCode {
  if (!value) return false;
  return (AUTH_URL_ERROR_CODES as readonly string[]).includes(value);
}

const SAFE_REDIRECT_BASE_ORIGIN = "http://localhost";
const ENCODED_CONTROL_CHAR_REGEX = /%(?:0[0-9a-f]|1[0-9a-f]|7f)/i;
const BLOCKED_RETURN_PATH_PREFIXES = [
  "/signin",
  "/signup",
  "/auth/callback",
] as const;

function hasAsciiControlChars(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) {
      return true;
    }
  }
  return false;
}

function isBlockedReturnPath(pathname: string): boolean {
  const normalized = pathname.toLowerCase();
  return BLOCKED_RETURN_PATH_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}

export function resolveSafeReturnTo(
  returnTo?: string | null,
  fallback = "/dashboard",
): string {
  if (
    !returnTo ||
    hasAsciiControlChars(returnTo) ||
    ENCODED_CONTROL_CHAR_REGEX.test(returnTo) ||
    returnTo.includes("\\") ||
    !returnTo.startsWith("/") ||
    returnTo.startsWith("//")
  ) {
    return fallback;
  }

  let parsed: URL;
  try {
    parsed = new URL(returnTo, SAFE_REDIRECT_BASE_ORIGIN);
  } catch {
    return fallback;
  }

  if (
    parsed.origin !== SAFE_REDIRECT_BASE_ORIGIN ||
    !parsed.pathname.startsWith("/") ||
    parsed.pathname.startsWith("//")
  ) {
    return fallback;
  }

  let decodedPathname: string;
  try {
    decodedPathname = decodeURIComponent(parsed.pathname);
  } catch {
    return fallback;
  }

  if (
    hasAsciiControlChars(decodedPathname) ||
    decodedPathname.includes("\\") ||
    !decodedPathname.startsWith("/") ||
    decodedPathname.startsWith("//")
  ) {
    return fallback;
  }

  let decodedParsed: URL;
  try {
    decodedParsed = new URL(decodedPathname, SAFE_REDIRECT_BASE_ORIGIN);
  } catch {
    return fallback;
  }

  if (
    decodedParsed.origin !== SAFE_REDIRECT_BASE_ORIGIN ||
    !decodedParsed.pathname.startsWith("/") ||
    decodedParsed.pathname.startsWith("//") ||
    isBlockedReturnPath(parsed.pathname) ||
    isBlockedReturnPath(decodedParsed.pathname)
  ) {
    return fallback;
  }

  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}
