"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function setCompactModeCookie(compact: boolean) {
  const cookieStore = await cookies();
  cookieStore.set("compactMode", String(compact), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
  revalidatePath("/", "layout");
}

export async function setFirstStepPreferencesAction(
  usageMode: string,
  workspaceId?: string,
) {
  const cookieStore = await cookies();
  cookieStore.set("habitparty_usage_mode", usageMode, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 ano
    sameSite: "lax",
  });
  if (workspaceId) {
    cookieStore.set("activeWorkspaceId", workspaceId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 ano
      sameSite: "lax",
    });
  }
}
