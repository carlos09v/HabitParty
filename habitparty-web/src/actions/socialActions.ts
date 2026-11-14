"use server";

import { getTranslations } from "next-intl/server";
import { invalidateSocialDomainTags } from "@/actions/cacheInvalidation";
import { getErrorMessage } from "@/actions/types";
import { serverApi } from "@/api/server";
import type {
  FriendsOverviewData,
  RespondFriendRequestResponse,
  SearchSocialUserItem,
  SendFriendRequestResponse,
  UpdatePrivacySettingsPayload,
  UserRetrospectiveData,
} from "@/types/social";
import type { UserResponseDTO } from "@/types/user";

export async function regenerateFriendCodeAction(): Promise<{
  success: boolean;
  user?: UserResponseDTO;
  error?: string;
}> {
  const t = await getTranslations("settings.privacy");
  try {
    const { data, error } = await serverApi.POST(
      "/users/me/friend-code/regenerate",
    );

    if (error || !data) {
      return {
        success: false,
        error: getErrorMessage(error, t("friendCodeRegenerateError")),
      };
    }

    invalidateSocialDomainTags(true);

    return { success: true, user: data as UserResponseDTO };
  } catch (err) {
    return {
      success: false,
      error: getErrorMessage(err, t("friendCodeRegenerateError")),
    };
  }
}

export async function updatePrivacySettingsAction(
  payload: UpdatePrivacySettingsPayload,
): Promise<{
  success: boolean;
  user?: UserResponseDTO;
  error?: string;
}> {
  const t = await getTranslations("settings.privacy");
  try {
    const { data, error } = await serverApi.PATCH("/users/me/privacy", {
      body: payload,
    });

    if (error || !data) {
      return {
        success: false,
        error: getErrorMessage(error, t("saveError")),
      };
    }

    invalidateSocialDomainTags(true);

    return { success: true, user: data as UserResponseDTO };
  } catch (err) {
    return {
      success: false,
      error: getErrorMessage(err, t("saveError")),
    };
  }
}

export async function getFriendsOverviewAction(): Promise<{
  success: boolean;
  data?: FriendsOverviewData;
  error?: string;
}> {
  const t = await getTranslations("showcase.friends");
  try {
    const { data, error } = await serverApi.GET("/friends", {
      cache: "no-store",
    });

    if (error || !data) {
      return {
        success: false,
        error: getErrorMessage(error, t("loadError")),
      };
    }

    return { success: true, data: data as FriendsOverviewData };
  } catch (err) {
    return {
      success: false,
      error: getErrorMessage(err, t("loadError")),
    };
  }
}

export async function searchSocialUsersAction(query: string): Promise<{
  success: boolean;
  results: SearchSocialUserItem[];
  error?: string;
}> {
  const t = await getTranslations("showcase.friends");
  try {
    if (!query || query.trim().length < 2) {
      return { success: true, results: [] };
    }

    const { data, error } = await serverApi.GET("/friends/search", {
      params: { query: { q: query.trim() } },
      cache: "no-store",
    });

    if (error || !data) {
      return {
        success: false,
        results: [],
        error: getErrorMessage(error, t("searchError")),
      };
    }

    return { success: true, results: data as SearchSocialUserItem[] };
  } catch (err) {
    return {
      success: false,
      results: [],
      error: getErrorMessage(err, t("searchError")),
    };
  }
}

export async function sendFriendRequestAction(input: {
  username?: string;
  friendCode?: string;
}): Promise<{
  success: boolean;
  data?: SendFriendRequestResponse;
  error?: string;
}> {
  const t = await getTranslations("showcase.friends");
  try {
    const { data, error } = await serverApi.POST("/friends/requests", {
      body: {
        username: input.username?.trim() || undefined,
        friendCode: input.friendCode?.trim() || undefined,
      },
    });

    if (error || !data) {
      return {
        success: false,
        error: getErrorMessage(error, t("sendRequestError")),
      };
    }

    invalidateSocialDomainTags();

    return { success: true, data: data as SendFriendRequestResponse };
  } catch (err) {
    return {
      success: false,
      error: getErrorMessage(err, t("sendRequestError")),
    };
  }
}

export async function respondFriendRequestAction(
  friendshipId: string,
  accept: boolean,
): Promise<{
  success: boolean;
  data?: RespondFriendRequestResponse;
  error?: string;
}> {
  const t = await getTranslations("showcase.friends");
  try {
    const { data, error } = await serverApi.PATCH(
      "/friends/requests/{friendshipId}",
      {
        params: { path: { friendshipId } },
        body: { accept },
      },
    );

    if (error || !data) {
      return {
        success: false,
        error: getErrorMessage(error, t("respondRequestError")),
      };
    }

    invalidateSocialDomainTags();

    return { success: true, data: data as RespondFriendRequestResponse };
  } catch (err) {
    return {
      success: false,
      error: getErrorMessage(err, t("respondRequestError")),
    };
  }
}

export async function removeFriendshipAction(friendshipId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const t = await getTranslations("showcase.friends");
  try {
    const { error } = await serverApi.DELETE("/friends/{friendshipId}", {
      params: { path: { friendshipId } },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("removeError")),
      };
    }

    invalidateSocialDomainTags();

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: getErrorMessage(err, t("removeError")),
    };
  }
}

export async function blockUserAction(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const t = await getTranslations("showcase.friends");
  try {
    const { error } = await serverApi.POST("/friends/block/{userId}", {
      params: { path: { userId } },
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("blockError")),
      };
    }

    invalidateSocialDomainTags();

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: getErrorMessage(err, t("blockError")),
    };
  }
}

export async function getMyRetrospectiveAction(year?: number): Promise<{
  success: boolean;
  data?: UserRetrospectiveData;
  error?: string;
}> {
  const t = await getTranslations("showcase.retrospective");
  try {
    const { data, error } = await serverApi.GET("/showcase/me/retrospective", {
      params: year ? { query: { year } } : {},
      cache: "no-store",
    });

    if (error || !data) {
      return {
        success: false,
        error: getErrorMessage(error, t("loadError")),
      };
    }

    return { success: true, data: data as UserRetrospectiveData };
  } catch (err) {
    return {
      success: false,
      error: getErrorMessage(err, t("loadError")),
    };
  }
}

export async function getPublicUserRetrospectiveAction(
  username: string,
  year?: number,
): Promise<{
  success: boolean;
  data?: UserRetrospectiveData;
  error?: string;
}> {
  const t = await getTranslations("showcase.retrospective");
  try {
    const { data, error } = await serverApi.GET(
      "/showcase/users/{username}/retrospective",
      {
        params: {
          path: { username: decodeURIComponent(username) },
          ...(year ? { query: { year } } : {}),
        },
        cache: "no-store",
      },
    );

    if (error || !data) {
      return {
        success: false,
        error: getErrorMessage(error, t("loadError")),
      };
    }

    return { success: true, data: data as UserRetrospectiveData };
  } catch (err) {
    return {
      success: false,
      error: getErrorMessage(err, t("loadError")),
    };
  }
}

export async function markSocialNotificationsSeenAction(
  notificationId?: string,
): Promise<{ success: boolean }> {
  try {
    const { error } = await serverApi.POST("/friends/notifications/seen", {
      body: notificationId ? { notificationId } : {},
    });

    if (error) {
      return { success: false };
    }

    invalidateSocialDomainTags();
    return { success: true };
  } catch {
    return { success: false };
  }
}
