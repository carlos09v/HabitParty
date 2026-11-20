package com.habitparty.application.usecases.achievement;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.habitparty.application.ports.FriendshipRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.social.SocialRelationshipStatus;
import com.habitparty.application.usecases.user.EffectiveStreakResolver;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.UserStats;
import com.habitparty.core.domain.entities.UserSubscription;
import com.habitparty.core.domain.entities.achievement.ProfileHighlight;
import com.habitparty.core.domain.entities.social.Friendship;
import com.habitparty.core.domain.enums.HighlightType;
import com.habitparty.core.domain.enums.PrivacyLevel;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.exceptions.ResourceNotFoundException;

class GetPublicUserShowcaseUseCaseTest {

  private User createUser(UUID id, String username) {
    UserSubscription sub = new UserSubscription(id, true, false, null, null, null, null, LocalDateTime.now());
    User user = new User(
        id,
        UserRole.USER,
        username,
        username,
        username + "@secret.test",
        "hash",
        true,
        null,
        LocalDate.of(1992, 5, 10),
        null,
        null,
        LocalDateTime.now(),
        UserStats.createInitial(id),
        sub);
    user.setBio("Minha bio secreta");
    user.setFriendCode("HP-SECRET");
    user.getStats().setTotalXp(500);
    return user;
  }

  @Test
  void shouldMaskPrivateStatsAndFilterHighlightsWhenNotFriends() {
    UUID viewerId = UUID.randomUUID();
    UUID targetId = UUID.randomUUID();
    User target = createUser(targetId, "heroi");
    target.updatePrivacySettings(PrivacyLevel.PUBLIC, PrivacyLevel.FRIENDS_ONLY, PrivacyLevel.PRIVATE, null);

    UserRepository userRepo = mock(UserRepository.class);
    FriendshipRepository friendshipRepo = mock(FriendshipRepository.class);
    GetUserShowcaseUseCase showcaseUseCase = mock(GetUserShowcaseUseCase.class);
    EffectiveStreakResolver streakResolver = new EffectiveStreakResolver(mock(TransactionHistoryRepository.class));

    when(userRepo.findByUsernameIgnoreCase("heroi")).thenReturn(Optional.of(target));
    when(friendshipRepo.findBetweenUsers(viewerId, targetId)).thenReturn(Optional.empty());

    List<ProfileHighlight> highlights = List.of(
        new ProfileHighlight(UUID.randomUUID(), targetId, 0, HighlightType.STAT_METRIC, null, "HIGHEST_STREAK", LocalDateTime.now()),
        new ProfileHighlight(UUID.randomUUID(), targetId, 1, HighlightType.TASK_STREAK, null, UUID.randomUUID().toString(), LocalDateTime.now()),
        new ProfileHighlight(UUID.randomUUID(), targetId, 2, HighlightType.ACHIEVEMENT, UUID.randomUUID(), "FIRST_TASK", LocalDateTime.now()));
    when(showcaseUseCase.executeReadOnly(target)).thenReturn(
        new GetUserShowcaseUseCase.UserShowcaseResult(target, 7, highlights, List.of(), 1, 10, 100, 500));

    GetPublicUserShowcaseUseCase useCase = new GetPublicUserShowcaseUseCase(
        userRepo, friendshipRepo, streakResolver, showcaseUseCase);

    var result = useCase.execute(viewerId, "@heroi");
    verify(showcaseUseCase, never()).execute(targetId);

    assertTrue(result.canViewProfile());
    assertFalse(result.canViewStats());
    assertFalse(result.canViewAchievements());
    assertNull(result.fullShowcase());
    assertNull(result.user().friendCode());
    assertEquals(0, result.user().totalXp());
    assertTrue(result.highlights().isEmpty());
    assertTrue(result.achievements().isEmpty());

    // Agora como amigos: stats FRIENDS_ONLY passa a ficar visível, enquanto achievements PRIVATE continua oculto
    when(friendshipRepo.findBetweenUsers(viewerId, targetId))
        .thenReturn(Optional.of(Friendship.createAccepted(viewerId, targetId, Instant.now())));

    var friendResult = useCase.execute(viewerId, "heroi");
    assertTrue(friendResult.canViewStats());
    assertFalse(friendResult.canViewAchievements());
    assertEquals("HP-SECRET", friendResult.user().friendCode());
    assertEquals(500, friendResult.user().totalXp());
    assertEquals(2, friendResult.highlights().size());
    assertEquals(HighlightType.STAT_METRIC, friendResult.highlights().get(0).getHighlightType());
    assertEquals(HighlightType.TASK_STREAK, friendResult.highlights().get(1).getHighlightType());
    assertEquals(SocialRelationshipStatus.FRIENDS, friendResult.relationshipStatus());
  }

  @Test
  void shouldHideProfileWhenTargetBlockedViewer() {
    UUID viewerId = UUID.randomUUID();
    UUID targetId = UUID.randomUUID();
    User target = createUser(targetId, "blockeduser");

    UserRepository userRepo = mock(UserRepository.class);
    FriendshipRepository friendshipRepo = mock(FriendshipRepository.class);
    when(userRepo.findByUsernameIgnoreCase("blockeduser")).thenReturn(Optional.of(target));
    when(friendshipRepo.findBetweenUsers(viewerId, targetId))
        .thenReturn(Optional.of(Friendship.createBlocked(targetId, viewerId, Instant.now())));

    GetPublicUserShowcaseUseCase useCase = new GetPublicUserShowcaseUseCase(
        userRepo,
        friendshipRepo,
        new EffectiveStreakResolver(mock(TransactionHistoryRepository.class)),
        mock(GetUserShowcaseUseCase.class));

    assertThrows(ResourceNotFoundException.class, () -> useCase.execute(viewerId, "blockeduser"));
  }
}
