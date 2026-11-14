import { type NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { completeOAuthLogin, exchangeGoogleCode } from "@/actions/auth";
import { BROWSER_TIMEZONE_COOKIE, isValidIanaTimeZone } from "@/utils/date";

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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const accessToken = searchParams.get("accessToken");
  const refreshToken = searchParams.get("refreshToken");
  const errorParam = searchParams.get("error");
  const t = await getTranslations("auth.oauthCallback");
  const browserTimezone = readBrowserTimezoneCookie(request);

  if (errorParam) {
    return NextResponse.redirect(
      new URL(
        `/signIn?error=${encodeURIComponent(t("cancelledError"))}`,
        request.url,
      ),
    );
  }

  if (accessToken && refreshToken) {
    const res = await completeOAuthLogin(
      accessToken,
      refreshToken,
      browserTimezone,
    );
    if (res.success) {
      const targetPath = res.data?.isNewUser ? "/firstStep" : "/dashboard";
      const response = NextResponse.redirect(new URL(targetPath, request.url));
      response.cookies.delete(BROWSER_TIMEZONE_COOKIE);
      return response;
    }
    return NextResponse.redirect(
      new URL(`/signIn?error=${encodeURIComponent(res.error)}`, request.url),
    );
  }

  if (code) {
    const res = await exchangeGoogleCode(code, browserTimezone);
    if (res.success) {
      const targetPath = res.data?.isNewUser ? "/firstStep" : "/dashboard";
      const response = NextResponse.redirect(new URL(targetPath, request.url));
      response.cookies.delete(BROWSER_TIMEZONE_COOKIE);
      return response;
    }
    return NextResponse.redirect(
      new URL(`/signIn?error=${encodeURIComponent(res.error)}`, request.url),
    );
  }

  return NextResponse.redirect(
    new URL(
      `/signIn?error=${encodeURIComponent(t("noCodeError"))}`,
      request.url,
    ),
  );
}
