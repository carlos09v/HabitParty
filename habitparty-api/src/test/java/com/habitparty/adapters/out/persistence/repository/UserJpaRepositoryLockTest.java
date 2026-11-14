package com.habitparty.adapters.out.persistence.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.support.TransactionTemplate;

import com.habitparty.adapters.out.persistence.entities.UserJpaEntity;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.SubscriptionStatus;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;

@SpringBootTest
class UserJpaRepositoryLockTest {

  @Autowired
  private UserJpaRepository userJpaRepository;

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private TransactionTemplate transactionTemplate;

  @Test
  @DisplayName("Deve bloquear usuários com PESSIMISTIC_WRITE sem erro de TableReference para stats/subscription")
  void shouldLockUsersForUpdateWithoutUnknownTableReferenceError() {
    User saved1 = createAndSaveUser("locktest1");
    User saved2 = createAndSaveUser("locktest2");

    try {
      transactionTemplate.executeWithoutResult(status -> {
        UserJpaEntity singleLocked = userJpaRepository.findByIdForUpdate(saved1.getId()).orElseThrow();
        assertEquals(saved1.getId(), singleLocked.getId());
        assertNotNull(singleLocked.getStats());
        assertNotNull(singleLocked.getSubscription());

        List<UserJpaEntity> batchLocked = userJpaRepository.findAllByIdInForUpdate(
            List.of(saved1.getId(), saved2.getId()));
        assertEquals(2, batchLocked.size());

        List<UUID> expectedOrder = List.of(saved1.getId(), saved2.getId()).stream()
            .sorted(Comparator.comparing(UUID::toString))
            .toList();
        assertEquals(expectedOrder, batchLocked.stream().map(UserJpaEntity::getId).toList());
        assertTrue(batchLocked.stream().allMatch(entity ->
            entity.getStats() != null && entity.getSubscription() != null));
      });
    } finally {
      userRepository.deleteById(saved1.getId());
      userRepository.deleteById(saved2.getId());
    }
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
        "Lock Test " + suffix,
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
