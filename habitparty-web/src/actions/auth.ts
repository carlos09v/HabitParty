"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { type ActionState, getErrorMessage } from "@/actions/types";
import { serverApi } from "@/api/server";
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
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return {
      success: false,
      error: "Por favor, informe seu email e sua senha.",
    };
  }

  try {
    const { data, error } = await serverApi.POST("/auth/login", {
      body: { email, password },
    });

    if (error || !data?.accessToken || !data?.refreshToken) {
      return {
        success: false,
        error: getErrorMessage(
          error,
          "Credenciais inválidas. Verifique seu email e senha.",
        ),
      };
    }

    await setAuthCookies(data.accessToken, data.refreshToken);
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[AuthAction:SignIn]", err);
    return {
      success: false,
      error: "Ocorreu um erro de conexão. Tente novamente mais tarde.",
    };
  }
}

/**
 * Cadastra um novo usuário e efetua login automático para preparar o onboarding.
 */
export async function signUpAction(
  payload: CreateUserDTO,
): Promise<ActionState<UserResponseDTO>> {
  try {
    const { data: createdUser, error: createError } = await serverApi.POST(
      "/users",
      { body: payload },
    );

    if (createError || !createdUser) {
      return {
        success: false,
        error: getErrorMessage(
          createError,
          "Falha ao realizar cadastro. Verifique os dados informados.",
        ),
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
      error: "Erro de comunicação ao criar conta. Tente novamente mais tarde.",
    };
  }
}

/**
 * Encerra a sessão atual e redireciona para a tela de login.
 */
export async function signOut() {
  const cookieStore = await cookies();
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
  const cleanEmail = email.trim();
  if (!cleanEmail) {
    return {
      success: false,
      error: "Por favor, informe seu email.",
    };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail }),
      cache: "no-store",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return {
        success: false,
        error: getErrorMessage(
          data,
          "Não foi possível processar a solicitação. Tente novamente mais tarde.",
        ),
      };
    }

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[AuthAction:RequestPasswordReset]", err);
    return {
      success: false,
      error: "Erro de conexão ao solicitar recuperação de senha.",
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
  const { token, password } = payload;
  if (!token || !password) {
    return {
      success: false,
      error: "Token ou senha ausente.",
    };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
      cache: "no-store",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return {
        success: false,
        error: getErrorMessage(
          data,
          "Token inválido ou expirado. Solicite um novo link.",
        ),
      };
    }

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[AuthAction:ResetPassword]", err);
    return {
      success: false,
      error: "Erro de conexão ao redefinir a senha.",
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
  if (!accessToken || !refreshToken) {
    return { success: false, error: "Tokens de autenticação inválidos." };
  }

  await setAuthCookies(accessToken, refreshToken);

  let isNewUser = false;
  try {
    const res = await fetch(`${API_BASE_URL}/workspaces`, {
      headers: { Authorization: `Bearer ${accessToken}` },
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
  if (!code) {
    return { success: false, error: "Código de autorização não fornecido." };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.accessToken || !data?.refreshToken) {
      return {
        success: false,
        error: getErrorMessage(
          data,
          "Falha na autenticação com o Google. Tente novamente.",
        ),
      };
    }

    await setAuthCookies(data.accessToken, data.refreshToken);

    let isNewUser = Boolean(data.isNewUser);
    if (!isNewUser) {
      try {
        const wsRes = await fetch(`${API_BASE_URL}/workspaces`, {
          headers: { Authorization: `Bearer ${data.accessToken}` },
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
      error: "Erro de comunicação ao validar login do Google.",
    };
  }
}
