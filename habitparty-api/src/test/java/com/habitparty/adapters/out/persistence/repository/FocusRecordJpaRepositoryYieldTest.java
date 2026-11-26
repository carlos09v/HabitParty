package com.habitparty.adapters.out.persistence.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.adapters.out.persistence.entities.FocusRecordJpaEntity;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.FocusRecordType;
import com.habitparty.core.domain.enums.SubscriptionStatus;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;

@SpringBootTest
@Transactional
class FocusRecordJpaRepositoryYieldTest {

  @Autowired
  private FocusRecordJpaRepository focusRecordJpaRepository;

  @Autowired
  private UserRepository userRepository;

  @Test
  @DisplayName("Deve somar apenas minutos elegíveis à recompensa (>= 10 min e teto de 90 min) na cota diária")
  void shouldSumOnlyRewardableMinutesForDailyYieldCap() {
    User user = createAndSaveUser("yieldtest");
    UUID userId = user.getId();
    UUID activityId = UUID.randomUUID();
    LocalDateTime dayStart = LocalDateTime.of(2026, 11, 20, 0, 0);
    LocalDateTime nextDayStart = LocalDateTime.of(2026, 11, 21, 0, 0);

    // 1. Sessão < 10 min (9 min): 0 min elegível
    focusRecordJpaRepository.save(FocusRecordJpaEntity.builder()
        .id(UUID.randomUUID())
        .userId(userId)
        .focusActivityId(activityId)
        .startTime(LocalDateTime.of(2026, 11, 20, 8, 0))
        .endTime(LocalDateTime.of(2026, 11, 20, 8, 9))
        .recordType(FocusRecordType.STOPWATCH)
        .durationMinutes(9)
        .xpEarned(0)
        .coinsEarned(BigDecimal.ZERO)
        .build());

    // 2. Sessão dentro da faixa (45 min): 45 min elegíveis
    focusRecordJpaRepository.save(FocusRecordJpaEntity.builder()
        .id(UUID.randomUUID())
        .userId(userId)
        .focusActivityId(activityId)
        .startTime(LocalDateTime.of(2026, 11, 20, 9, 0))
        .endTime(LocalDateTime.of(2026, 11, 20, 9, 45))
        .recordType(FocusRecordType.STOPWATCH)
        .durationMinutes(45)
        .xpEarned(11)
        .coinsEarned(new BigDecimal("0.68"))
        .build());

    // 3. Sessão acima de 1h30 (99 min): apenas 90 min elegíveis
    focusRecordJpaRepository.save(FocusRecordJpaEntity.builder()
        .id(UUID.randomUUID())
        .userId(userId)
        .focusActivityId(activityId)
        .startTime(LocalDateTime.of(2026, 11, 20, 10, 0))
        .endTime(LocalDateTime.of(2026, 11, 20, 11, 39))
        .recordType(FocusRecordType.STOPWATCH)
        .durationMinutes(99)
        .xpEarned(21)
        .coinsEarned(new BigDecimal("1.35"))
        .build());

    // 4. Sessão de mochila/lazer (60 min): 0 min elegível
    focusRecordJpaRepository.save(FocusRecordJpaEntity.builder()
        .id(UUID.randomUUID())
        .userId(userId)
        .inventoryItemId(UUID.randomUUID())
        .startTime(LocalDateTime.of(2026, 11, 20, 12, 0))
        .endTime(LocalDateTime.of(2026, 11, 20, 13, 0))
        .recordType(FocusRecordType.STOPWATCH)
        .durationMinutes(60)
        .xpEarned(0)
        .coinsEarned(BigDecimal.ZERO)
        .build());

    // 5. Sessão encerrada exatamente à meia-noite de D+1: deve ficar FORA do intervalo [dayStart, nextDayStart)
    focusRecordJpaRepository.save(FocusRecordJpaEntity.builder()
        .id(UUID.randomUUID())
        .userId(userId)
        .focusActivityId(activityId)
        .startTime(LocalDateTime.of(2026, 11, 20, 23, 30))
        .endTime(LocalDateTime.of(2026, 11, 21, 0, 0))
        .recordType(FocusRecordType.STOPWATCH)
        .durationMinutes(30)
        .xpEarned(8)
        .coinsEarned(new BigDecimal("0.45"))
        .build());

    focusRecordJpaRepository.flush();

    int sum = focusRecordJpaRepository.sumTodayFocusMinutesByUserId(userId, dayStart, nextDayStart);
    assertEquals(135, sum);

    UUID session99Id = focusRecordJpaRepository.findAllByUserIdOrderByStartTimeDesc(userId)
        .stream()
        .filter(r -> r.getDurationMinutes() == 99)
        .findFirst()
        .orElseThrow()
        .getId();

    int sumExcluding99 = focusRecordJpaRepository.sumTodayFocusMinutesByUserIdExcludingRecord(
        userId, dayStart, nextDayStart, session99Id);
    assertEquals(45, sumExcluding99);

    int productiveExcluding99 = focusRecordJpaRepository.sumProductiveFocusMinutesByUserIdExcludingRecord(
        userId, dayStart, nextDayStart, session99Id);
    assertEquals(54, productiveExcluding99);

    var analyticsRows = focusRecordJpaRepository.findProductiveAnalyticsByUserId(userId);
    // Deve retornar apenas as 4 sessões produtivas (ignorando a sessão de inventário/lazer de 60 min)
    assertEquals(4, analyticsRows.size());
    int totalProductiveMins = analyticsRows.stream().mapToInt(r -> r.getDurationMinutes()).sum();
    assertEquals(9 + 45 + 99 + 30, totalProductiveMins);
  }

  private User createAndSaveUser(String prefix) {
    String suffix = UUID.randomUUID().toString().substring(0, 8);
    User user = new User(
        UUID.randomUUID(),
        UserRole.USER,
        false,
        false,
        null,
        null,
        SubscriptionStatus.FREE,
        null,
        "Yield Test " + suffix,
        prefix + "_" + suffix,
        prefix + "_" + suffix + "@habitparty.com",
        "hashed_password",
        true,
        LocalDateTime.now(),
        BigDecimal.ZERO,
        BigDecimal.ZERO,
        LocalDate.of(1995, 5, 10),
        null,
        UserGender.PREFER_NOT_TO_SAY,
        0,
        0,
        0,
        LocalDateTime.now());
    user.initializeTimezone(User.DEFAULT_TIMEZONE, Clock.systemUTC());
    return userRepository.save(user);
  }
}
