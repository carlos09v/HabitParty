package com.habitparty.application.usecases.social;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.FriendshipRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.user.EffectiveStreakResolver;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.social.Friendship;
import com.habitparty.core.domain.enums.FriendRequestPolicy;
import com.habitparty.core.domain.enums.PrivacyLevel;

@Service
public class SearchSocialUsersUseCase {

  private final UserRepository userRepository;
  private final FriendshipRepository friendshipRepository;
  private final EffectiveStreakResolver effectiveStreakResolver;

  public SearchSocialUsersUseCase(
      UserRepository userRepository,
      FriendshipRepository friendshipRepository,
      EffectiveStreakResolver effectiveStreakResolver) {
    this.userRepository = userRepository;
    this.friendshipRepository = friendshipRepository;
    this.effectiveStreakResolver = effectiveStreakResolver;
  }

  public record SearchSocialUserItem(
      SocialUserSummary user,
      SocialRelationshipStatus relationshipStatus,
      UUID friendshipId,
      boolean matchedByFriendCode,
      boolean canSendRequest) {
  }

  @Transactional(readOnly = true)
  public List<SearchSocialUserItem> execute(UUID viewerId, String rawQuery) {
    String trimmed = rawQuery != null ? rawQuery.trim() : "";
    if (trimmed.length() < 2) {
      return List.of();
    }

    String normalizedCode = !trimmed.startsWith("@") ? User.normalizeFriendCode(trimmed) : null;
    List<User> candidates = userRepository.searchSocialUsers(trimmed, viewerId, 15);
    if (candidates.isEmpty()) {
      return List.of();
    }

    List<UUID> candidateIds = candidates.stream().map(User::getId).toList();
    Map<UUID, Friendship> friendshipsByOtherId = new HashMap<>(candidateIds.size());
    for (Friendship rel : friendshipRepository.findAllBetweenUserAndTargets(viewerId, candidateIds)) {
      friendshipsByOtherId.put(rel.otherUserId(viewerId), rel);
    }

    List<User> visibleCandidates = new ArrayList<>(candidates.size());
    for (User candidate : candidates) {
      if (candidate.getProfileVisibility() == PrivacyLevel.PRIVATE
          && candidate.getFriendRequestPolicy() == FriendRequestPolicy.NONE) {
        continue;
      }

      Friendship rel = friendshipsByOtherId.get(candidate.getId());
      SocialRelationshipStatus status = SocialAccessSupport.resolveRelationshipStatus(viewerId, rel);
      if (status == SocialRelationshipStatus.BLOCKED || status == SocialRelationshipStatus.BLOCKED_BY_VIEWER) {
        continue;
      }
      visibleCandidates.add(candidate);
    }

    if (visibleCandidates.isEmpty()) {
      return List.of();
    }

    Map<UUID, Integer> effectiveStreaks = effectiveStreakResolver.resolveBatch(visibleCandidates);
    List<SearchSocialUserItem> results = new ArrayList<>(visibleCandidates.size());

    for (User candidate : visibleCandidates) {
      boolean matchedByCode = normalizedCode != null
          && candidate.getFriendCode() != null
          && candidate.getFriendCode().equalsIgnoreCase(normalizedCode);

      Friendship rel = friendshipsByOtherId.get(candidate.getId());
      SocialRelationshipStatus status = SocialAccessSupport.resolveRelationshipStatus(viewerId, rel);
      boolean canSend = status == SocialRelationshipStatus.NONE && canReceiveRequest(candidate, matchedByCode);
      int streak = effectiveStreaks.getOrDefault(candidate.getId(), 0);
      SocialUserSummary summary = SocialUserSummary.fromUserForViewer(candidate, streak, status);

      results.add(new SearchSocialUserItem(
          summary,
          status,
          rel != null ? rel.getId() : null,
          matchedByCode,
          canSend));
    }

    return results;
  }

  public static SocialRelationshipStatus resolveRelationshipStatus(UUID viewerId, Friendship rel) {
    return SocialAccessSupport.resolveRelationshipStatus(viewerId, rel);
  }

  private boolean canReceiveRequest(User target, boolean matchedByCode) {
    FriendRequestPolicy policy = target.getFriendRequestPolicy();
    if (policy == FriendRequestPolicy.NONE) {
      return false;
    }
    if (policy == FriendRequestPolicy.FRIEND_CODE_ONLY) {
      return matchedByCode;
    }
    return true;
  }
}
