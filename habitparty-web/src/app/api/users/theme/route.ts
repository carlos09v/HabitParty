import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { serverApi } from "@/api/server";
import { getThemePolarity, isValidThemeId } from "@/constants/themes";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function PATCH(request: Request) {
  let payload: { theme?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (!isValidThemeId(payload.theme)) {
    return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
  }

  const theme = payload.theme;
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

  nextRes.cookies.set("theme", persistedTheme, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
  });

  if (getThemePolarity(persistedTheme) === "dark") {
    nextRes.cookies.set("lastDarkTheme", persistedTheme, {
      path: "/",
      maxAge: ONE_YEAR_SECONDS,
      sameSite: "lax",
    });
  } else {
    nextRes.cookies.set("lastLightTheme", persistedTheme, {
      path: "/",
      maxAge: ONE_YEAR_SECONDS,
      sameSite: "lax",
    });
  }

  revalidateTag("user", { expire: 0 });
  revalidateTag("showcase", { expire: 0 });

  return nextRes;
}
