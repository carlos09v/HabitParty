package com.habitparty.application.usecases.social;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.FriendshipRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.user.UserTimeResolver;
import com.habitparty.core.domain.entities.social.Friendship;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class RemoveOrBlockFriendUseCase {

  private final FriendshipRepository friendshipRepository;
  private final UserRepository userRepository;
  private final UserTimeResolver timeResolver;

  public RemoveOrBlockFriendUseCase(
      FriendshipRepository friendshipRepository,
      UserRepository userRepository,
      UserTimeResolver timeResolver) {
    this.friendshipRepository = friendshipRepository;
    this.userRepository = userRepository;
    this.timeResolver = timeResolver;
  }

  @Transactional
  public void removeFriendship(UUID actorId, UUID friendshipId) {
    Friendship friendship = friendshipRepository.findById(friendshipId)
        .orElseThrow(() -> new ResourceNotFoundException("Vínculo de amizade não encontrado."));

    friendship.ensureCanDelete(actorId);
    friendshipRepository.delete(friendship);
  }

  @Transactional
  public Friendship blockUser(UUID blockerId, UUID targetUserId) {
    if (blockerId.equals(targetUserId)) {
      throw new DomainValidationException("Não é possível bloquear a si mesmo.");
    }
    userRepository.findById(targetUserId)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    Instant now = timeResolver.nowInstant();
    Optional<Friendship> existingOpt = friendshipRepository.findBetweenUsers(blockerId, targetUserId);
    Friendship blocked;
    if (existingOpt.isPresent()) {
      blocked = existingOpt.get();
      blocked.blockBy(blockerId, now);
    } else {
      blocked = Friendship.createBlocked(blockerId, targetUserId, now);
    }
    return friendshipRepository.save(blocked);
  }
}
