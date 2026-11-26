"use server";

import { updateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { invalidateSocialDomainTags } from "@/actions/cacheInvalidation";
import { type ActionState, getErrorMessage } from "@/actions/types";
import { serverApi } from "@/api/server";
import { getFriendsOverview } from "@/services/socialService";
import type {
  FriendsOverviewData,
  RespondFriendRequestResponse,
  SearchSocialUserItem,
  SendFriendRequestResponse,
  UpdatePrivacySettingsPayload,
  UserRetrospectiveData,
} from "@/types/social";
import type { UserResponseDTO } from "@/types/user";

export async function regenerateFriendCodeAction(): Promise<
  ActionState<UserResponseDTO>
> {
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

    return { success: true, data: data as UserResponseDTO };
  } catch (err) {
    return {
      success: false,
      error: getErrorMessage(err, t("friendCodeRegenerateError")),
    };
  }
}

export async function updatePrivacySettingsAction(
  payload: UpdatePrivacySettingsPayload,
): Promise<ActionState<UserResponseDTO>> {
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

    return { success: true, data: data as UserResponseDTO };
  } catch (err) {
    return {
      success: false,
      error: getErrorMessage(err, t("saveError")),
    };
  }
}

export async function getFriendsOverviewAction(): Promise<
  ActionState<FriendsOverviewData>
> {
  const t = await getTranslations("showcase.friends");
  try {
    // Reutiliza o cache privado com tag "social" (já invalidado por updateTag em mutações),
    // evitando GET /friends duplicado quando o RSC da página recarregou no mesmo ciclo.
    const data = await getFriendsOverview();

    if (!data) {
      return {
        success: false,
        error: t("loadError"),
      };
    }

    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: getErrorMessage(err, t("loadError")),
    };
  }
}

export async function searchSocialUsersAction(
  query: string,
): Promise<ActionState<SearchSocialUserItem[]>> {
  const t = await getTranslations("showcase.friends");
  try {
    if (!query || query.trim().length < 2) {
      return { success: true, data: [] };
    }

    const { data, error } = await serverApi.GET("/friends/search", {
      params: { query: { q: query.trim() } },
      cache: "no-store",
    });

    if (error || !data) {
      return {
        success: false,
        error: getErrorMessage(error, t("searchError")),
      };
    }

    return { success: true, data: data as SearchSocialUserItem[] };
  } catch (err) {
    return {
      success: false,
      error: getErrorMessage(err, t("searchError")),
    };
  }
}

export async function sendFriendRequestAction(input: {
  username?: string;
  friendCode?: string;
}): Promise<ActionState<SendFriendRequestResponse>> {
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
): Promise<ActionState<RespondFriendRequestResponse>> {
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

export async function removeFriendshipAction(
  friendshipId: string,
): Promise<ActionState> {
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

export async function blockUserAction(userId: string): Promise<ActionState> {
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

export async function getMyRetrospectiveAction(
  year?: number,
): Promise<ActionState<UserRetrospectiveData>> {
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
): Promise<ActionState<UserRetrospectiveData>> {
  const t = await getTranslations("showcase.retrospective");
  try {
    const { data, error } = await serverApi.GET(
      "/showcase/users/{username}/retrospective",
      {
        params: {
          path: { username },
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
): Promise<ActionState> {
  const t = await getTranslations("showcase.friends");
  try {
    const { error } = await serverApi.POST("/friends/notifications/seen", {
      body: notificationId ? { notificationId } : {},
    });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("loadError")),
      };
    }

    updateTag("social");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: getErrorMessage(err, t("loadError")),
    };
  }
}
