import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { serverApi } from "@/api/server";
import { isValidThemeId } from "@/constants/themes";
import { writeThemePreferenceCookies } from "@/utils/themeCookies";

export async function PATCH(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const theme = (payload as { theme?: unknown }).theme;
  if (!isValidThemeId(theme)) {
    return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
  }

  const { data, error, response } = await serverApi.PATCH("/users/theme", {
    body: { theme },
  });

  if (error || !response.ok) {
    const status = response?.status || 500;
    const message =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : "Failed to persist theme preference";
    return NextResponse.json({ error: message }, { status });
  }

  const persistedTheme =
    data?.theme && isValidThemeId(data.theme) ? data.theme : theme;
  const nextRes = NextResponse.json({ ok: true, theme: persistedTheme });

  writeThemePreferenceCookies(nextRes.cookies, persistedTheme, {
    isPremium: Boolean(data?.isPremium ?? true),
    resetOppositePolarity: false,
  });

  revalidateTag("user", { expire: 0 });
  revalidateTag("showcase", { expire: 0 });

  return nextRes;
}
