import { cookies } from "next/headers";

export async function getCompactMode() {
  const cookieStore = await cookies();
  return cookieStore.get("compactMode")?.value === "true";
}
