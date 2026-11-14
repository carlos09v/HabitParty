package com.habitparty.application.usecases.social;

import java.util.UUID;

import com.habitparty.core.domain.entities.social.Friendship;
import com.habitparty.core.domain.enums.FriendshipStatus;

/**
 * Helpers compartilhados de normalização de identificador e resolução de relacionamento social.
 */
public final class SocialAccessSupport {

  private SocialAccessSupport() {
  }

  public static String normalizeUsernameQuery(String rawUsername) {
    if (rawUsername == null) {
      return null;
    }
    String stripped = rawUsername.trim();
    if (stripped.startsWith("@")) {
      stripped = stripped.substring(1).trim();
    }
    return stripped.isEmpty() ? null : stripped;
  }

  public static SocialRelationshipStatus resolveRelationshipStatus(UUID viewerId, Friendship rel) {
    if (rel == null) {
      return SocialRelationshipStatus.NONE;
    }
    if (rel.getStatus() == FriendshipStatus.ACCEPTED) {
      return SocialRelationshipStatus.FRIENDS;
    }
    if (rel.getStatus() == FriendshipStatus.PENDING) {
      return rel.getRequesterId().equals(viewerId)
          ? SocialRelationshipStatus.PENDING_SENT
          : SocialRelationshipStatus.PENDING_RECEIVED;
    }
    if (rel.getStatus() == FriendshipStatus.BLOCKED) {
      return rel.getRequesterId().equals(viewerId)
          ? SocialRelationshipStatus.BLOCKED_BY_VIEWER
          : SocialRelationshipStatus.BLOCKED;
    }
    return SocialRelationshipStatus.NONE;
  }
}
