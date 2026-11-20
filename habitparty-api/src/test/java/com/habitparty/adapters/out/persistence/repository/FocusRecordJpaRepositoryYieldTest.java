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
    LocalDateTime dayEnd = LocalDateTime.of(2026, 11, 20, 23, 59, 59, 999_999_999);

    // 1. Sessão < 10 min (9 min): 0 min elegível
    focusRecordJpaRepository.save(new FocusRecordJpaEntity(
        UUID.randomUUID(), userId, activityId, null, null, null, null,
        LocalDateTime.of(2026, 11, 20, 8, 0),
        LocalDateTime.of(2026, 11, 20, 8, 9),
        FocusRecordType.STOPWATCH, null, null, 9, 0, BigDecimal.ZERO));

    // 2. Sessão dentro da faixa (45 min): 45 min elegíveis
    focusRecordJpaRepository.save(new FocusRecordJpaEntity(
        UUID.randomUUID(), userId, activityId, null, null, null, null,
        LocalDateTime.of(2026, 11, 20, 9, 0),
        LocalDateTime.of(2026, 11, 20, 9, 45),
        FocusRecordType.STOPWATCH, null, null, 45, 11, new BigDecimal("0.68")));

    // 3. Sessão acima de 1h30 (99 min): apenas 90 min elegíveis
    focusRecordJpaRepository.save(new FocusRecordJpaEntity(
        UUID.randomUUID(), userId, activityId, null, null, null, null,
        LocalDateTime.of(2026, 11, 20, 10, 0),
        LocalDateTime.of(2026, 11, 20, 11, 39),
        FocusRecordType.STOPWATCH, null, null, 99, 21, new BigDecimal("1.35")));

    // 4. Sessão de mochila/lazer (60 min): 0 min elegível
    focusRecordJpaRepository.save(new FocusRecordJpaEntity(
        UUID.randomUUID(), userId, null, UUID.randomUUID(), null, null, null,
        LocalDateTime.of(2026, 11, 20, 12, 0),
        LocalDateTime.of(2026, 11, 20, 13, 0),
        FocusRecordType.STOPWATCH, null, null, 60, 0, BigDecimal.ZERO));

    focusRecordJpaRepository.flush();

    int sum = focusRecordJpaRepository.sumTodayFocusMinutesByUserId(userId, dayStart, dayEnd);
    assertEquals(135, sum);
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
