import { type NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { completeOAuthLogin, exchangeGoogleCode } from "@/actions/auth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const accessToken = searchParams.get("accessToken");
  const refreshToken = searchParams.get("refreshToken");
  const errorParam = searchParams.get("error");
  const t = await getTranslations("auth.oauthCallback");

  if (errorParam) {
    return NextResponse.redirect(
      new URL(
        `/signIn?error=${encodeURIComponent(t("cancelledError"))}`,
        request.url,
      ),
    );
  }

  if (accessToken && refreshToken) {
    const res = await completeOAuthLogin(accessToken, refreshToken);
    if (res.success) {
      const targetPath = res.data?.isNewUser ? "/firstStep" : "/dashboard";
      return NextResponse.redirect(new URL(targetPath, request.url));
    }
    return NextResponse.redirect(
      new URL(`/signIn?error=${encodeURIComponent(res.error)}`, request.url),
    );
  }

  if (code) {
    const res = await exchangeGoogleCode(code);
    if (res.success) {
      const targetPath = res.data?.isNewUser ? "/firstStep" : "/dashboard";
      return NextResponse.redirect(new URL(targetPath, request.url));
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
