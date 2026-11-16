package com.habitparty.application.usecases.social;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.habitparty.application.ports.FriendshipRepository;
import com.habitparty.application.ports.SocialNotificationRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.user.EffectiveStreakResolver;
import com.habitparty.application.usecases.user.UserTimeResolver;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.UserStats;
import com.habitparty.core.domain.entities.UserSubscription;
import com.habitparty.core.domain.entities.social.Friendship;
import com.habitparty.core.domain.enums.FriendRequestPolicy;
import com.habitparty.core.domain.enums.FriendshipStatus;
import com.habitparty.core.domain.enums.PrivacyLevel;
import com.habitparty.core.domain.enums.SocialNotificationType;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.UnauthorizedException;

class FriendshipUseCasesTest {

  private User verifiedUser(UUID id, String username, String friendCode) {
    User user = new User(
        id,
        UserRole.USER,
        username,
        username,
        username + "@example.com",
        "hash",
        true,
        null,
        LocalDate.of(1995, 1, 1),
        null,
        null,
        LocalDateTime.now(),
        UserStats.createInitial(id),
        UserSubscription.createInitial(id));
    user.setFriendCode(friendCode);
    return user;
  }

  @Test
  void shouldRequireFriendCodeWhenPolicyIsFriendCodeOnly() {
    UUID aliceId = UUID.randomUUID();
    UUID bobId = UUID.randomUUID();
    User alice = verifiedUser(aliceId, "alice", "HP-ALICE1");
    User bob = verifiedUser(bobId, "bob", "HP-BOB222");
    bob.updatePrivacySettings(PrivacyLevel.PUBLIC, PrivacyLevel.PUBLIC, PrivacyLevel.PUBLIC, FriendRequestPolicy.FRIEND_CODE_ONLY);

    UserRepository userRepo = mock(UserRepository.class);
    FriendshipRepository friendshipRepo = mock(FriendshipRepository.class);
    SocialNotificationRepository notifRepo = mock(SocialNotificationRepository.class);
    TransactionHistoryRepository txRepo = mock(TransactionHistoryRepository.class);

    when(userRepo.findById(aliceId)).thenReturn(Optional.of(alice));
    when(userRepo.findByUsernameIgnoreCase("bob")).thenReturn(Optional.of(bob));
    when(userRepo.findByFriendCode("HP-BOB222")).thenReturn(Optional.of(bob));
    when(friendshipRepo.findBetweenUsers(aliceId, bobId)).thenReturn(Optional.empty());
    when(friendshipRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

    SendFriendRequestUseCase useCase = new SendFriendRequestUseCase(
        userRepo,
        friendshipRepo,
        notifRepo,
        new EffectiveStreakResolver(txRepo),
        new UserTimeResolver(userRepo, Clock.systemUTC()));

    // Por @username sem código -> bloqueado pela política de Bob
    assertThrows(
        DomainValidationException.class,
        () -> useCase.execute(new SendFriendRequestCommand(aliceId, "bob", null)));

    // Com Friend Code exato (mesmo sem prefixo HP-) -> sucesso!
    var result = useCase.execute(new SendFriendRequestCommand(aliceId, null, "bob222"));
    assertFalse(result.autoAccepted());
    assertEquals(FriendshipStatus.PENDING, result.friendship().getStatus());
    verify(notifRepo).save(any());
  }

  @Test
  void shouldMaskPrivateStatsOnPendingFriendRequestResponse() {
    UUID aliceId = UUID.randomUUID();
    UUID bobId = UUID.randomUUID();
    User alice = verifiedUser(aliceId, "alice", "HP-ALICE1");
    User bob = verifiedUser(bobId, "bob", "HP-BOB222");
    bob.setBio("Segredo de Bob");
    bob.getStats().setTotalXp(950);
    bob.getStats().setAchievementPoints(120);
    bob.updatePrivacySettings(PrivacyLevel.PUBLIC, PrivacyLevel.FRIENDS_ONLY, PrivacyLevel.PRIVATE, FriendRequestPolicy.EVERYONE);

    UserRepository userRepo = mock(UserRepository.class);
    FriendshipRepository friendshipRepo = mock(FriendshipRepository.class);
    SocialNotificationRepository notifRepo = mock(SocialNotificationRepository.class);
    TransactionHistoryRepository txRepo = mock(TransactionHistoryRepository.class);

    when(userRepo.findById(aliceId)).thenReturn(Optional.of(alice));
    when(userRepo.findByUsernameIgnoreCase("bob")).thenReturn(Optional.of(bob));
    when(friendshipRepo.findBetweenUsers(aliceId, bobId)).thenReturn(Optional.empty());
    when(friendshipRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

    SendFriendRequestUseCase useCase = new SendFriendRequestUseCase(
        userRepo,
        friendshipRepo,
        notifRepo,
        new EffectiveStreakResolver(txRepo),
        new UserTimeResolver(userRepo, Clock.systemUTC()));

    var result = useCase.execute(new SendFriendRequestCommand(aliceId, "bob", null));
    assertEquals(0, result.targetUser().totalXp());
    assertEquals(0, result.targetUser().achievementPoints());
    assertNull(result.targetUser().friendCode());
    verify(txRepo, never()).hasCompletedTasksSinceYesterday(any(), any());
  }

  @Test
  void shouldAutoAcceptWhenTargetAlreadySentPendingRequest() {
    UUID aliceId = UUID.randomUUID();
    UUID bobId = UUID.randomUUID();
    User alice = verifiedUser(aliceId, "alice", "HP-ALICE1");
    User bob = verifiedUser(bobId, "bob", "HP-BOB222");
    Friendship bobToAlice = Friendship.createPending(bobId, aliceId, Instant.parse("2026-11-14T10:00:00Z"));

    UserRepository userRepo = mock(UserRepository.class);
    FriendshipRepository friendshipRepo = mock(FriendshipRepository.class);
    SocialNotificationRepository notifRepo = mock(SocialNotificationRepository.class);
    TransactionHistoryRepository txRepo = mock(TransactionHistoryRepository.class);

    when(userRepo.findById(aliceId)).thenReturn(Optional.of(alice));
    when(userRepo.findByUsernameIgnoreCase("bob")).thenReturn(Optional.of(bob));
    when(friendshipRepo.findBetweenUsers(aliceId, bobId)).thenReturn(Optional.of(bobToAlice));
    when(friendshipRepo.countAcceptedByUserId(any())).thenReturn(0L);
    when(friendshipRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

    SendFriendRequestUseCase useCase = new SendFriendRequestUseCase(
        userRepo,
        friendshipRepo,
        notifRepo,
        new EffectiveStreakResolver(txRepo),
        new UserTimeResolver(userRepo, Clock.systemUTC()));

    var result = useCase.execute(new SendFriendRequestCommand(aliceId, "@bob", null));
    assertTrue(result.autoAccepted());
    assertEquals(FriendshipStatus.ACCEPTED, result.friendship().getStatus());
    assertEquals("HP-BOB222", result.targetUser().friendCode());
    verify(notifRepo).markSeenByReferenceIdAndType(
        bobToAlice.getId(), SocialNotificationType.FRIEND_REQUEST_RECEIVED);
  }

  @Test
  void shouldUseBatchLookupsInSearchAndFriendsOverview() {
    UUID viewerId = UUID.randomUUID();
    UUID friendId = UUID.randomUUID();
    User viewer = verifiedUser(viewerId, "viewer", "HP-VIEW11");
    User friend = verifiedUser(friendId, "amigo", "HP-AMIG22");
    Friendship rel = Friendship.createAccepted(viewerId, friendId, Instant.now());

    UserRepository userRepo = mock(UserRepository.class);
    FriendshipRepository friendshipRepo = mock(FriendshipRepository.class);
    TransactionHistoryRepository txRepo = mock(TransactionHistoryRepository.class);

    when(userRepo.findById(viewerId)).thenReturn(Optional.of(viewer));
    when(friendshipRepo.findAllInvolvingUser(viewerId)).thenReturn(List.of(rel));
    when(userRepo.findAllByIds(any())).thenReturn(List.of(friend));

    ListFriendsOverviewUseCase overviewUseCase = new ListFriendsOverviewUseCase(
        userRepo, friendshipRepo, new EffectiveStreakResolver(txRepo));
    var overview = overviewUseCase.execute(viewerId);
    assertEquals(1, overview.friendsCount());
    verify(friendshipRepo).findAllInvolvingUser(viewerId);
    verify(friendshipRepo, never()).findAcceptedByUserId(any());

    when(userRepo.searchSocialUsers("amig", viewerId, 15)).thenReturn(List.of(friend));
    when(friendshipRepo.findAllBetweenUserAndTargets(viewerId, List.of(friendId))).thenReturn(List.of(rel));

    SearchSocialUsersUseCase searchUseCase = new SearchSocialUsersUseCase(
        userRepo, friendshipRepo, new EffectiveStreakResolver(txRepo));
    var searchResults = searchUseCase.execute(viewerId, "amig");
    assertEquals(1, searchResults.size());
    assertEquals(SocialRelationshipStatus.FRIENDS, searchResults.get(0).relationshipStatus());
    verify(friendshipRepo, never()).findBetweenUsers(any(), any());
  }

  @Test
  void shouldAcceptFrontendAvatarFramesAndNormalizeFriendCodesSafely() {
    UUID id = UUID.randomUUID();
    User user = verifiedUser(id, "hero", "HP-HERO22");
    user.upgradeToPremium();
    user.updateShowcaseProfile("Aventureiro focado", "cyber_neon");
    assertEquals("cyber_neon", user.getAvatarFrame());

    assertNull(User.normalizeFriendCode("@alice"));
    assertNull(User.normalizeFriendCode("foo bar!"));
    assertEquals("HP-BOB222", User.normalizeFriendCode("bob222"));
  }

  @Test
  void shouldOnlyAllowBlockerToRemoveBlockedRelationship() {
    UUID blockerId = UUID.randomUUID();
    UUID blockedId = UUID.randomUUID();
    Friendship blocked = Friendship.createBlocked(blockerId, blockedId, Instant.now());

    assertThrows(UnauthorizedException.class, () -> blocked.ensureCanDelete(blockedId));
    blocked.ensureCanDelete(blockerId);
  }

  @Test
  void shouldClearPendingFriendRequestNotificationOnRespondAndFilterUnseenList() {
    UUID requesterId = UUID.randomUUID();
    UUID addresseeId = UUID.randomUUID();
    User requester = verifiedUser(requesterId, "req", "HP-REQ111");
    User addressee = verifiedUser(addresseeId, "addr", "HP-ADD222");
    Friendship pending = Friendship.createPending(requesterId, addresseeId, Instant.now());

    UserRepository userRepo = mock(UserRepository.class);
    FriendshipRepository friendshipRepo = mock(FriendshipRepository.class);
    SocialNotificationRepository notifRepo = mock(SocialNotificationRepository.class);

    when(friendshipRepo.findById(pending.getId())).thenReturn(Optional.of(pending));
    when(friendshipRepo.countAcceptedByUserId(any())).thenReturn(0L);
    when(friendshipRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
    when(userRepo.findById(addresseeId)).thenReturn(Optional.of(addressee));

    RespondFriendRequestUseCase respondUseCase = new RespondFriendRequestUseCase(
        friendshipRepo,
        userRepo,
        notifRepo,
        new UserTimeResolver(userRepo, Clock.systemUTC()));

    respondUseCase.execute(addresseeId, pending.getId(), true);
    verify(notifRepo).markSeenByReferenceIdAndType(
        pending.getId(), SocialNotificationType.FRIEND_REQUEST_RECEIVED);

    when(notifRepo.findUnseenRecentByRecipientId(addresseeId, 15)).thenReturn(List.of());
    when(notifRepo.countUnseenByRecipientId(addresseeId)).thenReturn(0L);
    ListSocialNotificationsUseCase listUseCase = new ListSocialNotificationsUseCase(notifRepo, userRepo);
    var feed = listUseCase.execute(addresseeId, 15, true);
    assertTrue(feed.notifications().isEmpty());
    verify(notifRepo).findUnseenRecentByRecipientId(addresseeId, 15);
    verify(notifRepo, never()).findRecentByRecipientId(any(), org.mockito.ArgumentMatchers.anyInt());
    assertEquals(requesterId, requester.getId());
  }
}
