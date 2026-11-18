package com.habitparty.application.usecases.admin;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.achievement.EvaluateUserAchievementsUseCase;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.domain.enums.FocusRecordType;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;

@ExtendWith(MockitoExtension.class)
class RecalculateFocusRewardsUseCaseTest {

  @Mock
  private UserRepository userRepository;

  @Mock
  private FocusRecordRepository focusRecordRepository;

  @Mock
  private TransactionHistoryRepository transactionHistoryRepository;

  @Mock
  private EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase;

  @InjectMocks
  private RecalculateFocusRewardsUseCase useCase;

  private UUID userId;
  private UUID activityId;
  private User user;
  private FocusRecord stopwatch30;

  @BeforeEach
  void setUp() {
    useCase.setEvaluateUserAchievementsUseCase(evaluateUserAchievementsUseCase);
    userId = UUID.randomUUID();
    activityId = UUID.randomUUID();
    user = new User(
        userId,
        UserRole.USER,
        false,
        "Carlos",
        "carlos",
        "carlos@habitparty.com",
        "pwd",
        new BigDecimal("1.00"),
        new BigDecimal("5.00"),
        LocalDate.of(1998, 1, 1),
        null,
        UserGender.MALE,
        50,
        0,
        0,
        LocalDateTime.now());

    stopwatch30 = new FocusRecord(
        UUID.randomUUID(),
        userId,
        activityId,
        null,
        null,
        null,
        null,
        LocalDateTime.of(2026, 11, 17, 10, 0),
        LocalDateTime.of(2026, 11, 17, 10, 30),
        FocusRecordType.STOPWATCH,
        null,
        null,
        7,
        new BigDecimal("0.40"));
  }

  @Test
  @DisplayName("Em modo dryRun=true, apenas calcula prévia sem alterar banco ou saldo")
  void shouldPreviewWithoutMutatingWhenDryRunIsTrue() {
    when(transactionHistoryRepository.countMismatchedFocusCompletedTimestamps()).thenReturn(2L);
    when(userRepository.findAll()).thenReturn(List.of(user));
    when(focusRecordRepository.findAllByUserId(userId)).thenReturn(List.of(stopwatch30));

    var result = useCase.execute(true);

    assertEquals(true, result.dryRun());
    assertEquals(2L, result.recordsTimestampSynced());
    assertEquals(1L, result.recordsRewardUpgraded());
    assertEquals(1L, result.usersAffected());
    assertEquals(0, result.totalXpAdded());
    assertEquals(new BigDecimal("0.05"), result.totalCoinsAdded());

    assertEquals(new BigDecimal("1.00"), user.getCurrentCoins());
    verify(focusRecordRepository, never()).updateFocusRewards(any(), anyInt(), any());
    verify(transactionHistoryRepository, never()).syncFocusCompletedTimestamps();
    verify(userRepository, never()).save(any());
  }

  @Test
  @DisplayName("Em modo dryRun=false, sincroniza datas, credita diferenças positivas e avalia conquistas")
  void shouldApplyUpdatesAndEvaluateAchievementsWhenDryRunIsFalse() {
    when(transactionHistoryRepository.syncFocusCompletedTimestamps()).thenReturn(2);
    when(userRepository.findAll()).thenReturn(List.of(user));
    when(focusRecordRepository.findAllByUserId(userId)).thenReturn(List.of(stopwatch30));

    var result = useCase.execute(false);

    assertEquals(false, result.dryRun());
    assertEquals(2L, result.recordsTimestampSynced());
    assertEquals(1L, result.recordsRewardUpgraded());
    assertEquals(1L, result.usersAffected());
    assertEquals(new BigDecimal("0.05"), result.totalCoinsAdded());

    assertEquals(new BigDecimal("1.05"), user.getCurrentCoins());
    assertEquals(new BigDecimal("5.05"), user.getTotalGoldEarned());
    verify(focusRecordRepository).updateFocusRewards(stopwatch30.getId(), 7, new BigDecimal("0.45"));
    verify(transactionHistoryRepository).updateFocusRewardSnapshot(
        stopwatch30.getId(), userId, 7, new BigDecimal("0.45"));
    verify(userRepository).save(user);
    verify(evaluateUserAchievementsUseCase).execute(user);
  }
}
