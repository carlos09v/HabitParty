package com.habitparty.application.usecases.reward;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.RewardRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.core.domain.entities.reward.Reward;
import com.habitparty.core.domain.enums.RewardCategory;
import com.habitparty.core.domain.enums.RewardType;
import com.habitparty.core.exceptions.ResourceNotFoundException;
import com.habitparty.core.exceptions.UnauthorizedException;

@ExtendWith(MockitoExtension.class)
class CheckRewardHasHistoryUseCaseTest {

  @Mock
  private RewardRepository rewardPort;

  @Mock
  private TransactionHistoryRepository transactionPort;

  @InjectMocks
  private CheckRewardHasHistoryUseCase useCase;

  private UUID userId;
  private UUID rewardId;
  private Reward reward;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    rewardId = UUID.randomUUID();

    reward = new Reward(
        rewardId,
        userId,
        "Sessão de Cinema",
        new BigDecimal("50"),
        List.of(),
        RewardType.SINGLE_USE,
        0,
        "film",
        null,
        RewardCategory.ENTERTAINMENT,
        null,
        null
    );
  }

  @Test
  @DisplayName("Deve retornar true quando existir registro em transaction_history para a recompensa")
  void shouldReturnTrueWhenTransactionHistoryExists() {
    when(rewardPort.findById(rewardId)).thenReturn(Optional.of(reward));
    when(transactionPort.existsByReferenceIdAndUserId(rewardId, userId)).thenReturn(true);

    boolean result = useCase.execute(rewardId, userId);

    assertTrue(result);
    verify(transactionPort).existsByReferenceIdAndUserId(rewardId, userId);
  }

  @Test
  @DisplayName("Deve retornar false quando não houver histórico vinculado à recompensa")
  void shouldReturnFalseWhenNoHistoryExists() {
    when(rewardPort.findById(rewardId)).thenReturn(Optional.of(reward));
    when(transactionPort.existsByReferenceIdAndUserId(rewardId, userId)).thenReturn(false);

    boolean result = useCase.execute(rewardId, userId);

    assertFalse(result);
  }

  @Test
  @DisplayName("Deve lançar ResourceNotFoundException quando recompensa não existir")
  void shouldThrowWhenRewardNotFound() {
    when(rewardPort.findById(rewardId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class, () -> useCase.execute(rewardId, userId));
  }

  @Test
  @DisplayName("Deve lançar UnauthorizedException quando recompensa pertencer a outro usuário")
  void shouldThrowWhenNotOwner() {
    UUID otherUserId = UUID.randomUUID();
    when(rewardPort.findById(rewardId)).thenReturn(Optional.of(reward));

    assertThrows(UnauthorizedException.class, () -> useCase.execute(rewardId, otherUserId));
  }
}
