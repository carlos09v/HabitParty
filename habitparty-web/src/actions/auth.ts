"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { type ActionState, getErrorMessage } from "@/actions/types";
import { serverApi } from "@/api/server";
import type { CreateUserDTO, UserResponseDTO } from "@/types/user";

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
