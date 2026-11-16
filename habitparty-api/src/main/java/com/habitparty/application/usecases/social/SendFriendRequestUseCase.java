package com.habitparty.application.usecases.social;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.FriendshipRepository;
import com.habitparty.application.ports.SocialNotificationRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.user.EffectiveStreakResolver;
import com.habitparty.application.usecases.user.UserTimeResolver;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.social.Friendship;
import com.habitparty.core.domain.entities.social.SocialNotification;
import com.habitparty.core.domain.enums.FriendRequestPolicy;
import com.habitparty.core.domain.enums.FriendshipStatus;
import com.habitparty.core.domain.enums.SocialNotificationType;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.LimitExceededException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class SendFriendRequestUseCase {

  public static final int MAX_FRIENDS = 100;

  private final UserRepository userRepository;
  private final FriendshipRepository friendshipRepository;
  private final SocialNotificationRepository notificationRepository;
  private final EffectiveStreakResolver effectiveStreakResolver;
  private final UserTimeResolver timeResolver;

  public SendFriendRequestUseCase(
      UserRepository userRepository,
      FriendshipRepository friendshipRepository,
      SocialNotificationRepository notificationRepository,
      EffectiveStreakResolver effectiveStreakResolver,
      UserTimeResolver timeResolver) {
    this.userRepository = userRepository;
    this.friendshipRepository = friendshipRepository;
    this.notificationRepository = notificationRepository;
    this.effectiveStreakResolver = effectiveStreakResolver;
    this.timeResolver = timeResolver;
  }

  public record SendFriendRequestResult(
      Friendship friendship,
      SocialUserSummary targetUser,
      boolean autoAccepted) {
  }

  @Transactional
  public SendFriendRequestResult execute(SendFriendRequestCommand command) {
    User requester = userRepository.findById(command.requesterId())
        .orElseThrow(() -> new ResourceNotFoundException("Usuário solicitante não encontrado."));

    requester.validateEmailVerified("enviar solicitações de amizade");

    String normalizedCode = User.normalizeFriendCode(command.targetFriendCode());
    String rawUsername = SocialAccessSupport.normalizeUsernameQuery(command.targetUsername());

    if ((normalizedCode == null || normalizedCode.isBlank()) && (rawUsername == null || rawUsername.isBlank())) {
      throw new DomainValidationException("Informe um nome de usuário ou código de amigo.");
    }

    boolean usedFriendCode = normalizedCode != null && !normalizedCode.isBlank();
    User target;
    if (usedFriendCode) {
      target = userRepository.findByFriendCode(normalizedCode)
          .orElseThrow(() -> new ResourceNotFoundException("Nenhum usuário encontrado com este Código de Amigo."));
      if (rawUsername != null && !rawUsername.isBlank()
          && !target.getUsername().equalsIgnoreCase(rawUsername)) {
        throw new DomainValidationException("O código de amigo não corresponde ao usuário informado.");
      }
    } else {
      target = userRepository.findByUsernameIgnoreCase(rawUsername)
          .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
    }

    if (requester.getId().equals(target.getId())) {
      throw new DomainValidationException("Você não pode enviar uma solicitação de amizade para si mesmo.");
    }

    Instant now = timeResolver.nowInstant();

    Optional<Friendship> existingOpt = friendshipRepository.findBetweenUsers(requester.getId(), target.getId());
    if (existingOpt.isPresent()) {
      Friendship existing = existingOpt.get();
      if (existing.getStatus() == FriendshipStatus.BLOCKED) {
        if (existing.getRequesterId().equals(requester.getId())) {
          throw new DomainValidationException(
              "Você bloqueou este usuário. Desbloqueie primeiro para enviar uma solicitação.");
        }
        throw new DomainValidationException("Não foi possível enviar solicitação para este usuário.");
      }
      if (existing.getStatus() == FriendshipStatus.ACCEPTED) {
        throw new DomainValidationException("Vocês já estão conectados como amigos.");
      }
      if (existing.getStatus() == FriendshipStatus.PENDING) {
        if (existing.getRequesterId().equals(requester.getId())) {
          throw new DomainValidationException("Já existe uma solicitação pendente para este usuário.");
        }
        // Convite cruzado: aceita automaticamente!
        validateFriendLimits(requester.getId(), target.getId());
        existing.accept(requester.getId(), now);
        Friendship saved = friendshipRepository.save(existing);
        notificationRepository.markSeenByReferenceIdAndType(
            saved.getId(), SocialNotificationType.FRIEND_REQUEST_RECEIVED);
        notificationRepository.save(SocialNotification.create(
            target.getId(),
            requester.getId(),
            SocialNotificationType.FRIEND_REQUEST_ACCEPTED,
            saved.getId(),
            SocialNotificationPayloadHelper.actorOnly(requester),
            now));

        int targetStreak = canViewTargetStats(target, true) ? effectiveStreakResolver.resolve(target) : 0;
        return new SendFriendRequestResult(
            saved,
            SocialUserSummary.fromUserForViewer(target, targetStreak, SocialRelationshipStatus.FRIENDS),
            true);
      }
    }

    FriendRequestPolicy policy = target.getFriendRequestPolicy();
    if (policy == FriendRequestPolicy.NONE) {
      throw new DomainValidationException("Este usuário não está aceitando novas solicitações de amizade.");
    }
    if (policy == FriendRequestPolicy.FRIEND_CODE_ONLY && !usedFriendCode) {
      throw new DomainValidationException(
          "Este usuário aceita solicitações apenas por meio do Código de Amigo.");
    }

    long currentCount = friendshipRepository.countAcceptedByUserId(requester.getId());
    if (currentCount >= MAX_FRIENDS) {
      throw new LimitExceededException(
          "Você atingiu o limite máximo de " + MAX_FRIENDS + " amigos conectados.");
    }

    Friendship pending = Friendship.createPending(requester.getId(), target.getId(), now);
    Friendship saved = friendshipRepository.save(pending);

    notificationRepository.save(SocialNotification.create(
        target.getId(),
        requester.getId(),
        SocialNotificationType.FRIEND_REQUEST_RECEIVED,
        saved.getId(),
        SocialNotificationPayloadHelper.actorOnly(requester),
        now));

    int targetStreak = canViewTargetStats(target, false) ? effectiveStreakResolver.resolve(target) : 0;
    return new SendFriendRequestResult(
        saved,
        SocialUserSummary.fromUserForViewer(target, targetStreak, SocialRelationshipStatus.PENDING_SENT),
        false);
  }

  private boolean canViewTargetStats(User target, boolean isFriend) {
    return SocialUserSummary.isAllowed(target.getProfileVisibility(), false, isFriend)
        && SocialUserSummary.isAllowed(target.getStatsVisibility(), false, isFriend);
  }

  private void validateFriendLimits(UUID userA, UUID userB) {
    if (friendshipRepository.countAcceptedByUserId(userA) >= MAX_FRIENDS) {
      throw new LimitExceededException(
          "Você atingiu o limite máximo de " + MAX_FRIENDS + " amigos conectados.");
    }
    if (friendshipRepository.countAcceptedByUserId(userB) >= MAX_FRIENDS) {
      throw new LimitExceededException(
          "O outro usuário atingiu o limite máximo de amigos conectados.");
    }
  }
}
