import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_ROUTES = [
  "/signIn",
  "/signUp",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
];
const ACCESS_COOKIE_NAME = "habitparty_token";
const REFRESH_COOKIE_NAME = "habitparty_refresh_token";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Lendo os cookies de autenticação
  let token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  let responseToPass: NextResponse | null = null;

  // 2. Silent Refresh: se o access token expirou/sumiu, mas temos o refresh token
  if (!token && refreshToken) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        const newToken = data.accessToken || data.token;

        if (newToken) {
          token = newToken;

          // Atualiza os headers da requisição interna para que os Server Components
          // já recebam o cookie atualizado nesta mesma renderização
          const requestHeaders = new Headers(request.headers);
          requestHeaders.set(
            "cookie",
            request.cookies
              .getAll()
              .map((c) =>
                c.name === ACCESS_COOKIE_NAME
                  ? `${c.name}=${newToken}`
                  : `${c.name}=${c.value}`,
              )
              .concat(
                request.cookies.has(ACCESS_COOKIE_NAME)
                  ? []
                  : [`${ACCESS_COOKIE_NAME}=${newToken}`],
              )
              .join("; "),
          );

          responseToPass = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });

          // Grava o cookie no navegador do usuário
          responseToPass.cookies.set(ACCESS_COOKIE_NAME, newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 2, // 2 horas
          });
        }
      }
    } catch (err) {
      console.error(
        "Falha ao renovar token silenciosamente no middleware:",
        err,
      );
    }
  }

  const isCallbackRoute = pathname.startsWith("/auth/callback");
  const isResetPasswordRoute = pathname.startsWith("/reset-password");
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isRootRoute = pathname === "/";

  // 3. Usuário autenticado acessando tela de login/cadastro ou a raiz -> vai pro Dashboard
  // Exceção: Permite acesso a /reset-password mesmo logado (ex: usuário Google definindo sua senha manual via e-mail)
  if (
    token &&
    ((isAuthRoute && !isCallbackRoute && !isResetPasswordRoute) || isRootRoute)
  ) {
    const redirectResponse = NextResponse.redirect(
      new URL("/dashboard", request.url),
    );

    if (responseToPass) {
      const newCookie = responseToPass.cookies.get(ACCESS_COOKIE_NAME);
      if (newCookie) redirectResponse.cookies.set(newCookie);
    }
    return redirectResponse;
  }

  // 4. Visitante acessando a raiz (Landing Page) ou telas de login/cadastro -> permite visualização
  if (isRootRoute || isAuthRoute) {
    return responseToPass || NextResponse.next();
  }

  // 5. Rota de Onboarding / First Step: acessível para configuração inicial
  if (pathname.startsWith("/firstStep")) {
    return responseToPass || NextResponse.next();
  }

  // 6. Proteção das rotas privadas: se não tiver token, redireciona para login
  if (!token) {
    const signInUrl = new URL("/signIn", request.url);
    // Guarda a URL de origem para redirecionar após o login se desejado
    if (pathname !== "/dashboard") {
      signInUrl.searchParams.set("returnTo", pathname);
    }
    return NextResponse.redirect(signInUrl);
  }

  return responseToPass || NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|assets|.*\\.svg|.*\\.png).*)",
  ],
};
