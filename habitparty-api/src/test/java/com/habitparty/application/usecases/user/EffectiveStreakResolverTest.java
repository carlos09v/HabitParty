package com.habitparty.application.usecases.user;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;

@ExtendWith(MockitoExtension.class)
class EffectiveStreakResolverTest {

  @Mock
  private TransactionHistoryRepository transactionPort;

  private User buildUser(int streak) {
    User user = new User(
        UUID.randomUUID(),
        UserRole.USER,
        true,
        "Hero Test",
        "herotest",
        "hero@habitparty.com",
        "pwd",
        BigDecimal.ZERO,
        BigDecimal.ZERO,
        LocalDate.of(1995, 1, 1),
        null,
        UserGender.MALE,
        0,
        0,
        0,
        LocalDateTime.now());
    user.setCurrentStreak(streak);
    return user;
  }

  @Test
  @DisplayName("Retorna 0 sem consultar repositório quando streak do usuário já é zero")
  void returnsZeroWithoutQueryWhenStreakIsZero() {
    EffectiveStreakResolver resolver = new EffectiveStreakResolver(transactionPort);
    User user = buildUser(0);

    assertEquals(0, resolver.resolve(user));
    verifyNoInteractions(transactionPort);
  }

  @Test
  @DisplayName("Zera streak efetivo quando usuário não possui conclusão desde ontem")
  void zeroesExpiredStreakWhenNoCompletionSinceYesterday() {
    EffectiveStreakResolver resolver = new EffectiveStreakResolver(transactionPort);
    User user = buildUser(9);
    when(transactionPort.hasCompletedTasksSinceYesterday(eq(user.getId()), any())).thenReturn(false);

    assertEquals(0, resolver.resolve(user));
  }

  @Test
  @DisplayName("Mantém streak quando há conclusão desde ontem")
  void preservesStreakWhenCompletionExistsSinceYesterday() {
    EffectiveStreakResolver resolver = new EffectiveStreakResolver(transactionPort);
    User user = buildUser(9);
    when(transactionPort.hasCompletedTasksSinceYesterday(eq(user.getId()), any())).thenReturn(true);

    assertEquals(9, resolver.resolve(user));
  }

  @Test
  @DisplayName("Deve encaminhar o ZoneId configurado no usuário ao consultar conclusões recentes")
  void passesUserZoneIdToRepository() {
    EffectiveStreakResolver resolver = new EffectiveStreakResolver(transactionPort);
    User user = buildUser(4);
    user.setTimezone("Asia/Tokyo");
    when(transactionPort.hasCompletedTasksSinceYesterday(user.getId(), java.time.ZoneId.of("Asia/Tokyo")))
        .thenReturn(true);

    assertEquals(4, resolver.resolve(user));
  }
}
