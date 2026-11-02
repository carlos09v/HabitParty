"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { type ActionState, getErrorMessage } from "@/actions/types";
import { getServerAuthToken, serverApi } from "@/api/server";
import { getRequestLocale } from "@/i18n/request";
import type { CreateUserDTO, UserResponseDTO } from "@/types/user";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Salva os tokens JWT seguros nos cookies HTTP-only.
 */
async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";

  // Salva o access token (2 horas)
  cookieStore.set("habitparty_token", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 2,
  });

  // Salva o refresh token (7 dias)
  cookieStore.set("habitparty_refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

/**
 * Realiza autenticação do usuário e grava a sessão.
 */
export async function signIn(formData: FormData): Promise<ActionState<void>> {
  const t = await getTranslations("auth.errors");
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return {
      success: false,
      error: t("missingCredentials"),
    };
  }

  try {
    const { data, error } = await serverApi.POST("/auth/login", {
      body: { email, password },
    });

    if (error || !data?.accessToken || !data?.refreshToken) {
      return {
        success: false,
        error: getErrorMessage(error, t("invalidCredentials")),
      };
    }

    await setAuthCookies(data.accessToken, data.refreshToken);
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[AuthAction:SignIn]", err);
    return {
      success: false,
      error: t("connectionError"),
    };
  }
}

/**
 * Cadastra um novo usuário e efetua login automático para preparar o onboarding.
 */
export async function signUpAction(
  payload: CreateUserDTO,
  botProtection?: { honeypot?: string; turnstileToken?: string },
): Promise<ActionState<UserResponseDTO>> {
  const t = await getTranslations("auth.errors");

  if (botProtection?.honeypot) {
    return {
      success: false,
      error: t("botDetected"),
    };
  }

  try {
    const customHeaders: Record<string, string> = {};
    if (botProtection?.turnstileToken) {
      customHeaders["X-Turnstile-Token"] = botProtection.turnstileToken;
    }
    if (botProtection?.honeypot) {
      customHeaders["X-HP-Trap"] = botProtection.honeypot;
    }

    const { data: createdUser, error: createError } = await serverApi.POST(
      "/users",
      {
        body: payload,
        headers: customHeaders,
      },
    );

    if (createError || !createdUser) {
      return {
        success: false,
        error: getErrorMessage(createError, t("signUpFailed")),
      };
    }

    // Login automático logo após o cadastro
    const { data: authData } = await serverApi.POST("/auth/login", {
      body: { email: payload.email, password: payload.password },
    });

    if (authData?.accessToken && authData?.refreshToken) {
      await setAuthCookies(authData.accessToken, authData.refreshToken);
    }

    return {
      success: true,
      data: createdUser as UserResponseDTO,
    };
  } catch (err) {
    console.error("[AuthAction:SignUp]", err);
    return {
      success: false,
      error: t("signUpConnectionError"),
    };
  }
}

/**
 * Encerra a sessão atual, revoga o refresh token no servidor e redireciona para a tela de login.
 */
export async function signOut() {
  const cookieStore = await cookies();
  const token = await getServerAuthToken();
  const refreshToken = cookieStore.get("habitparty_refresh_token")?.value;

  if (token && refreshToken) {
    try {
      await serverApi.POST("/auth/logout", {
        body: { refreshToken },
      });
    } catch (err) {
      console.error(
        "[AuthAction:SignOut] Erro ao revogar sessão no servidor:",
        err,
      );
    }
  }

  cookieStore.delete("habitparty_token");
  cookieStore.delete("habitparty_refresh_token");
  redirect("/signIn");
}

/**
 * Solicita redefinição de senha via e-mail.
 */
export async function requestPasswordReset(
  email: string,
): Promise<ActionState<void>> {
  const t = await getTranslations("auth.errors");
  const cleanEmail = email.trim();
  if (!cleanEmail) {
    return {
      success: false,
      error: t("emailRequired"),
    };
  }

  try {
    const { error } = await serverApi.POST("/auth/forgot-password", {
      body: { email: cleanEmail },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("resetRequestFailed")),
      };
    }

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[AuthAction:RequestPasswordReset]", err);
    return {
      success: false,
      error: t("resetRequestConnectionError"),
    };
  }
}

/**
 * Redefine a senha do usuário utilizando o token de recuperação.
 */
export async function resetPassword(payload: {
  token: string;
  password: string;
}): Promise<ActionState<void>> {
  const t = await getTranslations("auth.errors");
  const { token, password } = payload;
  if (!token || !password) {
    return {
      success: false,
      error: t("missingTokenOrPassword"),
    };
  }

  try {
    const { error } = await serverApi.POST("/auth/reset-password", {
      body: { token, password },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("invalidOrExpiredToken")),
      };
    }

    const cookieStore = await cookies();
    cookieStore.delete("habitparty_token");
    cookieStore.delete("habitparty_refresh_token");
    updateTag("user");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[AuthAction:ResetPassword]", err);
    return {
      success: false,
      error: t("resetPasswordConnectionError"),
    };
  }
}

/**
 * Salva os tokens recebidos de um fluxo de login externo (Google OAuth).
 */
export async function completeOAuthLogin(
  accessToken: string,
  refreshToken: string,
): Promise<ActionState<{ isNewUser: boolean }>> {
  const [t, locale] = await Promise.all([
    getTranslations("auth.errors"),
    getRequestLocale(),
  ]);

  if (!accessToken || !refreshToken) {
    return { success: false, error: t("invalidOAuthTokens") };
  }

  await setAuthCookies(accessToken, refreshToken);

  let isNewUser = false;
  try {
    const res = await fetch(`${API_BASE_URL}/workspaces`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Accept-Language": locale,
      },
      cache: "no-store",
    });
    if (res.ok) {
      const workspaces = await res.json();
      isNewUser = Array.isArray(workspaces) && workspaces.length === 0;
    }
  } catch {
    // Fallback silencioso
  }

  return { success: true, data: { isNewUser } };
}

/**
 * Troca o código de autorização do Google pelos tokens JWT da aplicação.
 */
export async function exchangeGoogleCode(
  code: string,
): Promise<ActionState<{ isNewUser: boolean }>> {
  const [t, locale] = await Promise.all([
    getTranslations("auth.errors"),
    getRequestLocale(),
  ]);

  if (!code) {
    return { success: false, error: t("missingAuthCode") };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": locale,
      },
      body: JSON.stringify({ code }),
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.accessToken || !data?.refreshToken) {
      return {
        success: false,
        error: getErrorMessage(data, t("googleAuthFailed")),
      };
    }

    await setAuthCookies(data.accessToken, data.refreshToken);

    let isNewUser = Boolean(data.isNewUser);
    if (!isNewUser) {
      try {
        const wsRes = await fetch(`${API_BASE_URL}/workspaces`, {
          headers: {
            Authorization: `Bearer ${data.accessToken}`,
            "Accept-Language": locale,
          },
          cache: "no-store",
        });
        if (wsRes.ok) {
          const workspaces = await wsRes.json();
          isNewUser = Array.isArray(workspaces) && workspaces.length === 0;
        }
      } catch {
        // Fallback silencioso
      }
    }

    return {
      success: true,
      data: { isNewUser },
    };
  } catch (err) {
    console.error("[AuthAction:ExchangeGoogleCode]", err);
    return {
      success: false,
      error: t("googleConnectionError"),
    };
  }
}

/**
 * Confirma o e-mail do usuário através do token enviado por e-mail.
 * Pode ser chamada como Server Action ou diretamente na renderização SSR (com skipCacheUpdate = true).
 */
export async function verifyEmailAction(
  token: string,
  options?: { skipCacheUpdate?: boolean },
): Promise<ActionState<UserResponseDTO>> {
  const t = await getTranslations("auth.errors");
  const cleanToken = token?.trim();
  if (!cleanToken) {
    return {
      success: false,
      error: t("missingVerificationToken"),
    };
  }

  try {
    const { data, error } = await serverApi.POST("/auth/verify-email", {
      body: { token: cleanToken },
      cache: "no-store",
    });

    if (error || !data) {
      return {
        success: false,
        error: getErrorMessage(error, t("invalidVerificationLink")),
      };
    }

    if (!options?.skipCacheUpdate) {
      updateTag("user");
    }
    return {
      success: true,
      data: data as UserResponseDTO,
    };
  } catch (err) {
    console.error("[AuthAction:VerifyEmail]", err);
    return {
      success: false,
      error: t("verifyEmailConnectionError"),
    };
  }
}

/**
 * Invalida a tag de cache do usuário e redireciona para o Dashboard após confirmação de e-mail via SSR.
 */
export async function redirectAfterEmailVerificationAction(): Promise<void> {
  updateTag("user");
  redirect("/dashboard");
}

/**
 * Reenvia o e-mail de verificação para o usuário autenticado.
 */
export async function resendVerificationEmailAction(): Promise<
  ActionState<void>
> {
  const [t, token] = await Promise.all([
    getTranslations("auth.errors"),
    getServerAuthToken(),
  ]);

  if (!token) {
    return {
      success: false,
      error: t("sessionExpired"),
    };
  }

  try {
    const { error } = await serverApi.POST("/auth/resend-verification", {
      cache: "no-store",
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("resendVerificationFailed")),
      };
    }

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[AuthAction:ResendVerification]", err);
    return {
      success: false,
      error: t("resendVerificationConnectionError"),
    };
  }
}
