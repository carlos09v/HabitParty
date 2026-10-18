import { type NextRequest, NextResponse } from "next/server";
import { completeOAuthLogin, exchangeGoogleCode } from "@/actions/auth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const accessToken = searchParams.get("accessToken");
  const refreshToken = searchParams.get("refreshToken");
  const errorParam = searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(
      new URL(
        "/signIn?error=O login com Google foi cancelado ou não autorizado.",
        request.url,
      ),
    );
  }

  if (accessToken && refreshToken) {
    const res = await completeOAuthLogin(accessToken, refreshToken);
    if (res.success) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(
      new URL(`/signIn?error=${encodeURIComponent(res.error)}`, request.url),
    );
  }

  if (code) {
    const res = await exchangeGoogleCode(code);
    if (res.success) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(
      new URL(`/signIn?error=${encodeURIComponent(res.error)}`, request.url),
    );
  }

  return NextResponse.redirect(
    new URL(
      "/signIn?error=Nenhum código de autorização foi recebido do Google.",
      request.url,
    ),
  );
}
