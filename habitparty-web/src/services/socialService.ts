import { cacheLife, cacheTag } from "next/cache";
import { getServerAuthToken, serverApi } from "@/api/server";
import type {
  FriendsOverviewData,
  SocialNotificationsFeed,
} from "@/types/social";

async function fetchFriendsOverviewCached(): Promise<FriendsOverviewData> {
  "use cache: private";
  cacheLife("private30");
  cacheTag("social");

  const { data, error } = await serverApi.GET("/friends");

  if (error || !data) {
    throw new Error("FRIENDS_OVERVIEW_FETCH_FAILED");
  }

  return data as FriendsOverviewData;
}

export async function getFriendsOverview(): Promise<FriendsOverviewData | null> {
  const token = await getServerAuthToken();
  if (!token) {
    return null;
  }

  try {
    return await fetchFriendsOverviewCached();
  } catch (err) {
    console.error("[SocialService:getFriendsOverview]", err);
    return null;
  }
}

/** Exclusivo para Server Actions do sino de notificações (sem cache estático). */
export async function getSocialNotifications(
  limit = 20,
  unseenOnly = true,
): Promise<SocialNotificationsFeed> {
  try {
    const token = await getServerAuthToken();
    if (!token) {
      return { unseenCount: 0, notifications: [] };
    }

    const { data, error } = await serverApi.GET("/friends/notifications", {
      params: { query: { limit, unseenOnly } },
      cache: "no-store",
    });

    if (error || !data) {
      return { unseenCount: 0, notifications: [] };
    }

    return data as SocialNotificationsFeed;
  } catch {
    return { unseenCount: 0, notifications: [] };
  }
}
