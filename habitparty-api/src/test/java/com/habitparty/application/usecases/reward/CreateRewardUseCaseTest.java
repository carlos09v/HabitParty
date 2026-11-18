package com.habitparty.application.usecases.reward;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.RewardRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.reward.Reward;
import com.habitparty.core.domain.enums.RewardCategory;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.exceptions.DomainValidationException;

@ExtendWith(MockitoExtension.class)
class CreateRewardUseCaseTest {

  @Mock
  private RewardRepository rewardRepository;

  @Mock
  private UserRepository userRepository;

  @InjectMocks
  private CreateRewardUseCase useCase;

  private UUID userId;
  private User user;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    user = new User(
        userId,
        UserRole.USER,
        false,
        "Hero Test",
        "herotest",
        "hero@habitparty.com",
        "hashed",
        BigDecimal.TEN,
        BigDecimal.TEN,
        LocalDate.of(1995, 1, 1),
        null,
        UserGender.MALE,
        0,
        0,
        0,
        LocalDateTime.now());
  }

  @Test
  void shouldRejectZeroPriceWhenCreatingReward() {
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(rewardRepository.countByUserId(userId)).thenReturn(0);
    when(rewardRepository.getMaxOrderIndex(userId)).thenReturn(0);

    CreateRewardCommand cmd = new CreateRewardCommand(
        "Mimo grátis",
        "gift",
        null,
        BigDecimal.ZERO,
        RewardCategory.ENTERTAINMENT,
        List.of(),
        RewardType.SINGLE_USE,
        RewardPackageLevel.NONE,
        null);

    assertThrows(DomainValidationException.class, () -> useCase.execute(cmd, userId));
    verify(rewardRepository, never()).save(any());
  }

  @Test
  void shouldPersistOptionalPackageLevelForSingleUseReward() {
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(rewardRepository.countByUserId(userId)).thenReturn(1);
    when(rewardRepository.getMaxOrderIndex(userId)).thenReturn(0);
    when(rewardRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

    CreateRewardCommand cmd = new CreateRewardCommand(
        "Livro Novo",
        "book",
        "Livro técnico",
        new BigDecimal("50"),
        RewardCategory.HOBBIES,
        List.of(),
        RewardType.SINGLE_USE,
        RewardPackageLevel.EPIC,
        60);

    Reward saved = useCase.execute(cmd, userId);

    ArgumentCaptor<Reward> captor = ArgumentCaptor.forClass(Reward.class);
    verify(rewardRepository).save(captor.capture());
    assertEquals(Optional.of(RewardPackageLevel.EPIC), saved.getPackageLevel());
    assertEquals(Optional.empty(), captor.getValue().getBaseDurationMinutes());
    assertNull(captor.getValue().getLootItems());
  }
}
