import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE_MAX_AGE_SECONDS,
  ACCESS_COOKIE_NAME,
  isJwtExpiredOrExpiringSoon,
  REFRESH_COOKIE_MAX_AGE_SECONDS,
  REFRESH_COOKIE_NAME,
  type RefreshedTokenPair,
  requestDedupedTokenRefresh,
} from "@/api/jwtUtils";
import {
  detectLocaleFromAcceptLanguage,
  isValidLocale,
  LOCALE_COOKIE_NAME,
} from "@/i18n/config";

const AUTH_ROUTES = [
  "/signIn",
  "/signUp",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/auth/callback",
];
const THEME_SCOPE_HEADER = "x-habitparty-theme-scope";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type ThemeScope = "default" | "app";

function applyRefreshedAuthCookies(
  response: NextResponse,
  tokens: RefreshedTokenPair,
) {
  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set(ACCESS_COOKIE_NAME, tokens.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_COOKIE_MAX_AGE_SECONDS,
  });

  // Persiste o novo refresh token rotacionado (o backend revoga o anterior imediatamente)
  if (tokens.refreshToken) {
    response.cookies.set(REFRESH_COOKIE_NAME, tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_COOKIE_MAX_AGE_SECONDS,
    });
  }
}

function clearAuthCookiesOnResponse(response: NextResponse) {
  response.cookies.delete(ACCESS_COOKIE_NAME);
  response.cookies.delete(REFRESH_COOKIE_NAME);
}

function buildCookieHeaderWithUpdates(
  request: NextRequest,
  updates: Record<string, string>,
): string {
  const cookieMap = new Map<string, string>();
  for (const cookie of request.cookies.getAll()) {
    cookieMap.set(cookie.name, cookie.value);
  }
  for (const [name, value] of Object.entries(updates)) {
    cookieMap.set(name, value);
  }
  return Array.from(cookieMap.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

function createNextWithScope(
  request: NextRequest,
  themeScope: ThemeScope,
  refreshedHeaders: Headers | null,
  refreshedTokens: RefreshedTokenPair | null,
  shouldClearAuthCookies = false,
): NextResponse {
  const headers = refreshedHeaders
    ? new Headers(refreshedHeaders)
    : new Headers(request.headers);
  headers.set(THEME_SCOPE_HEADER, themeScope);

  const response = NextResponse.next({
    request: { headers },
  });

  if (shouldClearAuthCookies) {
    clearAuthCookiesOnResponse(response);
  } else if (refreshedTokens) {
    applyRefreshedAuthCookies(response, refreshedTokens);
  }

  return attachLocaleCookieIfMissing(request, response);
}

function resolveRequestLocale(request: NextRequest): "en" | "pt-BR" {
  const existingLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  if (isValidLocale(existingLocale)) {
    return existingLocale;
  }
  return detectLocaleFromAcceptLanguage(request.headers.get("accept-language"));
}

function attachLocaleCookieIfMissing(
  request: NextRequest,
  response: NextResponse,
): NextResponse {
  const existingLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  if (!isValidLocale(existingLocale)) {
    const detected = detectLocaleFromAcceptLanguage(
      request.headers.get("accept-language"),
    );
    response.cookies.set(LOCALE_COOKIE_NAME, detected, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 ano
      sameSite: "lax",
    });
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas estáticas (/en e /pt-BR) passam direto sem silent refresh
  if (pathname === "/en" || pathname === "/pt-BR") {
    return NextResponse.next();
  }

  // 1. Lendo os cookies de autenticação
  let token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  let refreshedHeaders: Headers | null = null;
  let refreshedTokens: RefreshedTokenPair | null = null;
  let shouldClearDeadCookies = false;

  const isSessionExpiredSignIn =
    pathname.startsWith("/signIn") &&
    request.nextUrl.searchParams.get("sessionExpired") === "1";

  if (isSessionExpiredSignIn) {
    token = undefined;
    shouldClearDeadCookies = true;
  } else {
    const isTokenStrictlyExpired = token
      ? isJwtExpiredOrExpiringSoon(token, 0)
      : false;
    const isTokenExpiringSoon = token
      ? isJwtExpiredOrExpiringSoon(token, 60)
      : true;

    // 2. Silent Refresh proativo (antes ou após expiração do JWT), persistindo também o refresh token rotacionado
    if (refreshToken && (!token || isTokenExpiringSoon)) {
      const nextTokens = await requestDedupedTokenRefresh(
        refreshToken,
        API_BASE_URL,
      );

      if (nextTokens) {
        token = nextTokens.accessToken;
        refreshedTokens = nextTokens;

        const cookieUpdates: Record<string, string> = {
          [ACCESS_COOKIE_NAME]: nextTokens.accessToken,
        };
        if (nextTokens.refreshToken) {
          cookieUpdates[REFRESH_COOKIE_NAME] = nextTokens.refreshToken;
        }

        // Atualiza os headers da requisição interna para que os Server Components
        // já recebam ambos os cookies atualizados nesta mesma renderização
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set(
          "cookie",
          buildCookieHeaderWithUpdates(request, cookieUpdates),
        );
        refreshedHeaders = requestHeaders;
      } else if (isTokenStrictlyExpired) {
        // JWT já venceu e o refresh falhou: evita repassar token inválido ao SSR (causaria 401/EmptyWorkspace)
        token = undefined;
        shouldClearDeadCookies = true;
      }
    } else if (isTokenStrictlyExpired) {
      token = undefined;
      shouldClearDeadCookies = true;
    }
  }

  const isCallbackRoute = pathname.startsWith("/auth/callback");
  const isResetPasswordRoute = pathname.startsWith("/reset-password");
  const isVerifyEmailRoute = pathname.startsWith("/verify-email");
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isRootRoute = pathname === "/";

  // 3. Usuário autenticado acessando tela de login/cadastro ou a raiz -> vai pro Dashboard
  // Exceção: Permite acesso a /reset-password, /verify-email e /signIn?sessionExpired=1
  if (
    token &&
    ((isAuthRoute &&
      !isCallbackRoute &&
      !isResetPasswordRoute &&
      !isVerifyEmailRoute &&
      !isSessionExpiredSignIn) ||
      isRootRoute)
  ) {
    const redirectResponse = NextResponse.redirect(
      new URL("/dashboard", request.url),
    );

    if (refreshedTokens) {
      applyRefreshedAuthCookies(redirectResponse, refreshedTokens);
    }
    return attachLocaleCookieIfMissing(request, redirectResponse);
  }

  // 4. Visitante não autenticado acessando a raiz `/` -> redireciona para `/{locale}` estático
  if (isRootRoute) {
    const targetLocale = resolveRequestLocale(request);
    const localeUrl = new URL(
      `/${targetLocale}${request.nextUrl.search}`,
      request.url,
    );
    const response = NextResponse.redirect(localeUrl);
    if (shouldClearDeadCookies) {
      clearAuthCookiesOnResponse(response);
    }
    return attachLocaleCookieIfMissing(request, response);
  }

  // 5. Visitante acessando telas de login/cadastro -> permite visualização com tema padrão
  if (isAuthRoute) {
    return createNextWithScope(
      request,
      "default",
      refreshedHeaders,
      refreshedTokens,
      shouldClearDeadCookies,
    );
  }

  // 6. Proteção das rotas privadas (incluindo /firstStep): se não tiver token válido, redireciona para login
  if (!token) {
    const signInUrl = new URL("/signIn", request.url);
    // Guarda a URL de origem (incluindo query params) para redirecionar após o login se desejado
    if (pathname !== "/dashboard") {
      signInUrl.searchParams.set(
        "returnTo",
        `${pathname}${request.nextUrl.search}`,
      );
    }
    const redirectResponse = NextResponse.redirect(signInUrl);
    if (shouldClearDeadCookies) {
      clearAuthCookiesOnResponse(redirectResponse);
    }
    return attachLocaleCookieIfMissing(request, redirectResponse);
  }

  return createNextWithScope(request, "app", refreshedHeaders, refreshedTokens);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sitemap.xml|robots.txt|en$|pt-BR$|assets|.*\\.svg|.*\\.png).*)",
  ],
};
