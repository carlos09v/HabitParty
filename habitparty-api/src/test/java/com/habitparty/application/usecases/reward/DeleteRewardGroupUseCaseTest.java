package com.habitparty.application.usecases.reward;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.RewardRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.core.domain.entities.reward.Reward;
import com.habitparty.core.domain.enums.RewardCategory;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;
import com.habitparty.core.exceptions.UnauthorizedException;

@ExtendWith(MockitoExtension.class)
class DeleteRewardGroupUseCaseTest {

  @Mock
  private RewardRepository rewardRepository;

  @Mock
  private TransactionHistoryRepository transactionHistoryRepository;

  @InjectMocks
  private DeleteRewardGroupUseCase useCase;

  @Test
  void shouldDeleteAllVariantsAndHistoryWhenRequested() {
    UUID userId = UUID.randomUUID();
    UUID id1 = UUID.randomUUID();
    UUID id2 = UUID.randomUUID();
    Reward r1 = new Reward(id1, userId, "Videogame (30m)", BigDecimal.TEN, List.of(), RewardType.TIME_BASED, 0, "gamepad", null, RewardCategory.ENTERTAINMENT, 30, RewardPackageLevel.BASIC);
    Reward r2 = new Reward(id2, userId, "Videogame (1h)", BigDecimal.TEN, List.of(), RewardType.TIME_BASED, 1, "gamepad", null, RewardCategory.ENTERTAINMENT, 60, RewardPackageLevel.PREMIUM);

    when(rewardRepository.findById(id1)).thenReturn(Optional.of(r1));
    when(rewardRepository.findById(id2)).thenReturn(Optional.of(r2));

    useCase.execute(List.of(id1, id2), userId, true);

    verify(transactionHistoryRepository).deleteAllByReferenceIdsAndUserId(List.of(id1, id2), userId);
    verify(rewardRepository).deleteById(id1);
    verify(rewardRepository).deleteById(id2);
  }

  @Test
  void shouldRejectDeletingForeignRewardInsideGroup() {
    UUID userId = UUID.randomUUID();
    UUID otherUser = UUID.randomUUID();
    UUID id1 = UUID.randomUUID();
    Reward foreign = new Reward(id1, otherUser, "Videogame (30m)", BigDecimal.TEN, List.of(), RewardType.TIME_BASED, 0, "gamepad", null, RewardCategory.ENTERTAINMENT, 30, RewardPackageLevel.BASIC);

    when(rewardRepository.findById(id1)).thenReturn(Optional.of(foreign));

    assertThrows(UnauthorizedException.class, () -> useCase.execute(List.of(id1), userId, false));
    verify(rewardRepository, never()).deleteById(id1);
  }
}
