"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { invalidateSessionCacheTags } from "@/actions/cacheInvalidation";
import { type ActionState, getErrorMessage } from "@/actions/types";
import { clearAuthCookies, setAuthCookies } from "@/api/authCookies";
import { getServerAuthToken, serverApi } from "@/api/server";
import { getThemePolarity, isValidThemeId } from "@/constants/themes";
import type { CreateUserDTO, UserResponseDTO } from "@/types/user";
import { isValidIanaTimeZone, TIMEZONE_COOKIE } from "@/utils/date";
import {
  clearCustomThemeCookies,
  PREFERENCE_COOKIE_OPTIONS,
  writeThemePreferenceCookies,
} from "@/utils/themeCookies";

/**
 * Persiste o fuso horário IANA do usuário no cookie de sessão.
 */
async function setTimezoneCookieIfValid(timezone?: string | null) {
  if (!isValidIanaTimeZone(timezone)) return;
  const cookieStore = await cookies();
  cookieStore.set(TIMEZONE_COOKIE, timezone, PREFERENCE_COOKIE_OPTIONS);
}

/**
 * Sincroniza os cookies visuais de tema a partir do perfil retornado pelo backend.
 */
async function setThemeCookiesFromUser(user?: UserResponseDTO) {
  if (!user) return;
  const cookieStore = await cookies();
  const applied = writeThemePreferenceCookies(cookieStore, user.theme, {
    isPremium: Boolean(user.isPremium),
    resetOppositePolarity: true,
  });

  if (!applied) {
    clearCustomThemeCookies(cookieStore);
  }
}

/**
 * Finaliza a configuração de uma sessão autenticada (validação opcional do perfil em /users/me,
 * cookies de token, sincronização de fuso horário e tema, checagem opcional de workspaces
 * e invalidação de cache).
 */
async function finalizeAuthenticatedSession(
  accessToken: string,
  refreshToken: string,
  options?: {
    checkWorkspaces?: boolean;
    initialIsNewUser?: boolean;
    useRouteRevalidation?: boolean;
    requireVerifiedUser?: boolean;
  },
): Promise<{ verified: boolean; isNewUser: boolean }> {
  const authHeaders = {
    Authorization: `Bearer ${accessToken}`,
  };

  let isNewUser = Boolean(options?.initialIsNewUser);
  let meData: UserResponseDTO | undefined;
  let userVerified = false;

  try {
    const shouldFetchWorkspaces = options?.checkWorkspaces && !isNewUser;
    const [wsResult, meResult] = await Promise.all([
      shouldFetchWorkspaces
        ? serverApi.GET("/workspaces", {
            headers: authHeaders,
            cache: "no-store",
          })
        : Promise.resolve(null),
      serverApi.GET("/users/me", {
        headers: authHeaders,
        cache: "no-store",
      }),
    ]);

    if (wsResult?.data) {
      isNewUser = Array.isArray(wsResult.data) && wsResult.data.length === 0;
    }

    const candidateUser = meResult.data as UserResponseDTO | undefined;
    if (!meResult.error && meResult.response?.ok && candidateUser?.id) {
      meData = candidateUser;
      userVerified = true;
    }
  } catch {
    userVerified = false;
  }

  if (options?.requireVerifiedUser && !userVerified) {
    await clearAuthCookies();
    return { verified: false, isNewUser: false };
  }

  await setAuthCookies(accessToken, refreshToken);

  if (meData) {
    try {
      await Promise.all([
        setTimezoneCookieIfValid(meData.timezone),
        setThemeCookiesFromUser(meData),
      ]);
    } catch {
      // Fallback silencioso caso o fuso ou tema sejam sincronizados posteriormente no cliente
    }
  }

  invalidateSessionCacheTags(options?.useRouteRevalidation);
  return { verified: userVerified, isNewUser };
}

/**
 * Realiza autenticação do usuário e grava a sessão.
 */
export async function signIn(
  formData: FormData,
): Promise<ActionState<{ isNewUser: boolean }>> {
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

    const { isNewUser } = await finalizeAuthenticatedSession(
      data.accessToken,
      data.refreshToken,
      { checkWorkspaces: true },
    );

    return { success: true, data: { isNewUser } };
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
): Promise<ActionState<{ user: UserResponseDTO; autoSignedIn: boolean }>> {
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

    const newUser = createdUser as UserResponseDTO;
    const autoSignedIn = Boolean(
      authData?.accessToken && authData?.refreshToken,
    );
    if (authData?.accessToken && authData?.refreshToken) {
      await setAuthCookies(authData.accessToken, authData.refreshToken);
      const cookieStore = await cookies();
      cookieStore.delete("activeWorkspaceId");
      await setThemeCookiesFromUser(newUser);
    }

    const userTimezone = newUser.timezone || payload.timezone;
    await setTimezoneCookieIfValid(userTimezone);
    invalidateSessionCacheTags();

    return {
      success: true,
      data: {
        user: newUser,
        autoSignedIn,
      },
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

  const rawTheme = cookieStore.get("theme")?.value;
  let decodedTheme: string | undefined;
  if (rawTheme) {
    try {
      decodedTheme = decodeURIComponent(rawTheme);
    } catch {
      decodedTheme = rawTheme;
    }
  }
  const rawSitePolarity = cookieStore.get("sitePolarity")?.value;
  const polarityOnSignOut = isValidThemeId(decodedTheme)
    ? getThemePolarity(decodedTheme)
    : rawSitePolarity === "light" || rawSitePolarity === "dark"
      ? rawSitePolarity
      : "dark";

  cookieStore.set("sitePolarity", polarityOnSignOut, PREFERENCE_COOKIE_OPTIONS);
  clearCustomThemeCookies(cookieStore);
  cookieStore.delete("habitparty_token");
  cookieStore.delete("habitparty_refresh_token");
  cookieStore.delete(TIMEZONE_COOKIE);
  cookieStore.delete("activeWorkspaceId");
  invalidateSessionCacheTags();
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
    invalidateSessionCacheTags();

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
  _browserTimezone?: string,
  options?: { useRouteRevalidation?: boolean },
): Promise<ActionState<{ isNewUser: boolean }>> {
  const t = await getTranslations("auth.errors");
  const cleanAccessToken = accessToken?.trim();
  const cleanRefreshToken = refreshToken?.trim();

  if (!cleanAccessToken || !cleanRefreshToken) {
    await clearAuthCookies();
    return { success: false, error: t("invalidOAuthTokens") };
  }

  const { verified, isNewUser } = await finalizeAuthenticatedSession(
    cleanAccessToken,
    cleanRefreshToken,
    {
      checkWorkspaces: true,
      useRouteRevalidation: options?.useRouteRevalidation,
      requireVerifiedUser: true,
    },
  );

  if (!verified) {
    return { success: false, error: t("invalidOAuthTokens") };
  }

  return { success: true, data: { isNewUser } };
}

/**
 * Troca o código de autorização do Google pelos tokens JWT da aplicação.
 */
export async function exchangeGoogleCode(
  code: string,
  browserTimezone?: string,
  options?: { useRouteRevalidation?: boolean },
): Promise<ActionState<{ isNewUser: boolean }>> {
  const t = await getTranslations("auth.errors");

  if (!code) {
    return { success: false, error: t("missingAuthCode") };
  }

  try {
    const validTimezone = isValidIanaTimeZone(browserTimezone)
      ? browserTimezone.trim()
      : undefined;

    const { data, error } = await serverApi.POST("/auth/google", {
      body: {
        code,
        ...(validTimezone ? { timezone: validTimezone } : {}),
      },
      cache: "no-store",
    });

    const authResponse = data as
      | { accessToken?: string; refreshToken?: string; isNewUser?: boolean }
      | undefined;

    if (error || !authResponse?.accessToken || !authResponse?.refreshToken) {
      return {
        success: false,
        error: getErrorMessage(error, t("googleAuthFailed")),
      };
    }

    const { isNewUser } = await finalizeAuthenticatedSession(
      authResponse.accessToken,
      authResponse.refreshToken,
      {
        checkWorkspaces: true,
        initialIsNewUser: Boolean(authResponse.isNewUser),
        useRouteRevalidation: options?.useRouteRevalidation,
      },
    );

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
