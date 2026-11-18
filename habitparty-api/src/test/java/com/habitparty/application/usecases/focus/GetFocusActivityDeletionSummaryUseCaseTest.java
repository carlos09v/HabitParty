package com.habitparty.application.usecases.focus;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.core.domain.entities.focus.FocusActivity;
import com.habitparty.core.domain.enums.FocusRecordType;
import com.habitparty.core.exceptions.UnauthorizedException;

@ExtendWith(MockitoExtension.class)
class GetFocusActivityDeletionSummaryUseCaseTest {

  @Mock
  private FocusActivityRepository focusActivityPort;

  @Mock
  private FocusRecordRepository focusRecordPort;

  @InjectMocks
  private GetFocusActivityDeletionSummaryUseCase useCase;

  @Test
  @DisplayName("Deve retornar resumo total de registros, XP e moedas da atividade")
  void shouldReturnSummaryForActivityOwner() {
    UUID userId = UUID.randomUUID();
    UUID activityId = UUID.randomUUID();
    FocusActivity activity = new FocusActivity(
        activityId,
        userId,
        "Leitura",
        "book",
        0,
        FocusRecordType.POMO,
        25,
        LocalDateTime.now());
    var expected = new FocusRecordRepository.ActivityDeletionSummary(12L, 340, new BigDecimal("18.50"));

    when(focusActivityPort.findById(activityId)).thenReturn(Optional.of(activity));
    when(focusRecordPort.summarizeImpactByFocusActivityId(activityId)).thenReturn(expected);

    var result = useCase.execute(userId, activityId);

    assertEquals(12L, result.totalRecordsCount());
    assertEquals(340, result.totalXpEarned());
    assertEquals(new BigDecimal("18.50"), result.totalCoinsEarned());
  }

  @Test
  @DisplayName("Deve bloquear consulta de resumo de atividade de outro usuário")
  void shouldRejectNonOwner() {
    UUID ownerId = UUID.randomUUID();
    UUID intruderId = UUID.randomUUID();
    UUID activityId = UUID.randomUUID();
    FocusActivity activity = new FocusActivity(
        activityId,
        ownerId,
        "Leitura",
        "book",
        0,
        FocusRecordType.POMO,
        25,
        LocalDateTime.now());

    when(focusActivityPort.findById(activityId)).thenReturn(Optional.of(activity));

    assertThrows(UnauthorizedException.class, () -> useCase.execute(intruderId, activityId));
  }
}
