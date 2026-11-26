import { timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { completeOAuthLogin, exchangeGoogleCode } from "@/actions/auth";
import {
  type AuthUrlErrorCode,
  OAUTH_RETURN_TO_COOKIE,
  OAUTH_STATE_COOKIE,
  resolveSafeReturnTo,
} from "@/utils/authRedirect";
import { BROWSER_TIMEZONE_COOKIE, isValidIanaTimeZone } from "@/utils/date";

function isValidOAuthState(
  expectedState: string | undefined,
  returnedState: string | null,
): boolean {
  if (!expectedState || !returnedState) return false;
  const expectedBuffer = Buffer.from(expectedState, "utf8");
  const returnedBuffer = Buffer.from(returnedState, "utf8");
  if (expectedBuffer.length !== returnedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, returnedBuffer);
}

function readBrowserTimezoneCookie(request: NextRequest): string | undefined {
  const raw = request.cookies.get(BROWSER_TIMEZONE_COOKIE)?.value;
  if (!raw) return undefined;
  try {
    const decoded = decodeURIComponent(raw);
    return isValidIanaTimeZone(decoded) ? decoded.trim() : undefined;
  } catch {
    return undefined;
  }
}

function readReturnToCookie(request: NextRequest): string | undefined {
  const raw = request.cookies.get(OAUTH_RETURN_TO_COOKIE)?.value;
  if (!raw) return undefined;
  try {
    return decodeURIComponent(raw);
  } catch {
    return undefined;
  }
}

function clearTransientOAuthCookies(response: NextResponse): NextResponse {
  response.cookies.delete(BROWSER_TIMEZONE_COOKIE);
  response.cookies.delete(OAUTH_STATE_COOKIE);
  response.cookies.delete(OAUTH_RETURN_TO_COOKIE);
  return response;
}

function redirectToSignInWithError(
  request: NextRequest,
  code: AuthUrlErrorCode,
): NextResponse {
  return clearTransientOAuthCookies(
    NextResponse.redirect(new URL(`/signIn?error=${code}`, request.url)),
  );
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");
  const accessToken = searchParams.get("accessToken");
  const refreshToken = searchParams.get("refreshToken");
  const errorParam = searchParams.get("error");
  const browserTimezone = readBrowserTimezoneCookie(request);
  const safeReturnTo = resolveSafeReturnTo(readReturnToCookie(request));

  if (errorParam) {
    return redirectToSignInWithError(request, "oauth_cancelled");
  }

  const expectedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;

  if (accessToken && refreshToken) {
    if (!isValidOAuthState(expectedState, returnedState)) {
      return redirectToSignInWithError(request, "oauth_state_mismatch");
    }

    const res = await completeOAuthLogin(
      accessToken,
      refreshToken,
      browserTimezone,
      { useRouteRevalidation: true },
    );
    if (res.success) {
      const targetPath = res.data?.isNewUser ? "/firstStep" : safeReturnTo;
      return clearTransientOAuthCookies(
        NextResponse.redirect(new URL(targetPath, request.url)),
      );
    }
    return redirectToSignInWithError(request, "oauth_failed");
  }

  if (code) {
    if (!isValidOAuthState(expectedState, returnedState)) {
      return redirectToSignInWithError(request, "oauth_state_mismatch");
    }

    const res = await exchangeGoogleCode(code, browserTimezone, {
      useRouteRevalidation: true,
    });
    if (res.success) {
      const targetPath = res.data?.isNewUser ? "/firstStep" : safeReturnTo;
      return clearTransientOAuthCookies(
        NextResponse.redirect(new URL(targetPath, request.url)),
      );
    }
    return redirectToSignInWithError(request, "oauth_failed");
  }

  return redirectToSignInWithError(request, "oauth_no_code");
}
