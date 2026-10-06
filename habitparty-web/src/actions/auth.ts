"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { serverApi } from "@/api/server";

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const { data, error } = await serverApi.POST("/auth/login", {
      body: { email, password },
    });

    if (error || !data?.accessToken || !data?.refreshToken) {
      // Tenta pegar a mensagem enviada pelo back, se não existir, usa o fallback
      const backendMessage = (error as any)?.message;
      return {
        error:
          backendMessage ||
          "Credenciais inválidas. Verifique seu email e senha.",
      };
    }

    const cookieStore = await cookies();

    // Salva o access token (2 horas)
    cookieStore.set("habitparty_token", data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 2, // 2 horas
    });

    // Salva o refresh token (7 dias)
    cookieStore.set("habitparty_refresh_token", data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return { success: true };
  } catch (_err) {
    return { error: "Ocorreu um erro de conexão. Tente novamente mais tarde." };
  }
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("habitparty_token");
  cookieStore.delete("habitparty_refresh_token");
  redirect("/signIn");
}
