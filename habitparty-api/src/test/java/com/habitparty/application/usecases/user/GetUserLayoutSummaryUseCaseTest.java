package com.habitparty.application.usecases.user;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.TransactionHistoryRepository;

@ExtendWith(MockitoExtension.class)
class GetUserLayoutSummaryUseCaseTest {

  @Mock
  private TransactionHistoryRepository transactionHistoryRepository;

  @Mock
  private UserTimeResolver userTimeResolver;

  @Test
  @DisplayName("Deve converter a última conclusão de tarefa para o fuso do usuário")
  void shouldConvertLatestCompletionToUserZone() {
    UUID userId = UUID.randomUUID();
    ZoneId spZone = ZoneId.of("America/Sao_Paulo");
    LocalDateTime stored = LocalDateTime.of(2026, 11, 18, 14, 30, 0);

    when(userTimeResolver.resolveZone(userId)).thenReturn(spZone);
    when(transactionHistoryRepository.findLatestTaskCompletionCreatedAtByUserId(userId))
        .thenReturn(Optional.of(stored));

    GetUserLayoutSummaryUseCase useCase =
        new GetUserLayoutSummaryUseCase(transactionHistoryRepository, userTimeResolver);
    var summary = useCase.execute(userId);

    OffsetDateTime expected = stored.atZone(ZoneId.systemDefault())
        .withZoneSameInstant(spZone)
        .toOffsetDateTime();
    assertEquals(expected, summary.lastTaskCompletionAt());
  }

  @Test
  @DisplayName("Deve retornar null quando usuário nunca concluiu tarefas")
  void shouldReturnNullWhenNoTaskCompletionExists() {
    UUID userId = UUID.randomUUID();
    when(userTimeResolver.resolveZone(userId)).thenReturn(ZoneId.of("UTC"));
    when(transactionHistoryRepository.findLatestTaskCompletionCreatedAtByUserId(userId))
        .thenReturn(Optional.empty());

    GetUserLayoutSummaryUseCase useCase =
        new GetUserLayoutSummaryUseCase(transactionHistoryRepository, userTimeResolver);
    assertNull(useCase.execute(userId).lastTaskCompletionAt());
  }
}
