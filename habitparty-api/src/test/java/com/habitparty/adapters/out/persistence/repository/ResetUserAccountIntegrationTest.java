package com.habitparty.adapters.out.persistence.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.support.TransactionTemplate;

import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.SubscriptionStatus;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;

@SpringBootTest
class ResetUserAccountIntegrationTest {

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private TransactionTemplate transactionTemplate;

  @Test
  @DisplayName("Deve persistir reset de todas as métricas e cosméticos em user_stats/users preservando user_subscriptions")
  void shouldPersistZeroedUserStatsAndCosmeticsWhilePreservingSubscription() {
    User savedUser = createPopulatedUser();
    UUID userId = savedUser.getId();

    try {
      transactionTemplate.executeWithoutResult(status -> {
        User locked = userRepository.findByIdForUpdate(userId).orElseThrow();
        locked.resetStats();
        locked.resetShowcaseCosmetics();
        userRepository.save(locked);
      });

      User reloaded = userRepository.findById(userId).orElseThrow();
      assertEquals(0, reloaded.getCurrentCoins().compareTo(BigDecimal.ZERO));
      assertEquals(0, reloaded.getTotalGoldEarned().compareTo(BigDecimal.ZERO));
      assertEquals(0, reloaded.getTotalXp());
      assertEquals(0, reloaded.getCurrentStreak());
      assertEquals(0, reloaded.getHighestStreak());
      assertEquals(0, reloaded.getStats().getAchievementPoints());
      assertEquals(0, reloaded.getStats().getTotalTasksCompleted());
      assertEquals(0, reloaded.getStats().getTotalWorkspacesCreated());
      assertEquals(0, reloaded.getStats().getTotalCleanHabitCycles());
      assertFalse(reloaded.getBio().isPresent());
      assertEquals("none", reloaded.getAvatarFrame());

      assertTrue(reloaded.isPremium());
      assertTrue(reloaded.isFounder());
      assertEquals(SubscriptionStatus.ACTIVE, reloaded.getSubscriptionStatus());
      assertEquals("cus_reset_test", reloaded.getStripeCustomerId());
    } finally {
      userRepository.deleteById(userId);
    }
  }

  private User createPopulatedUser() {
    String suffix = UUID.randomUUID().toString().substring(0, 8);
    User user = new User(
        UUID.randomUUID(),
        UserRole.USER,
        true,
        true,
        "cus_reset_test",
        "sub_reset_test",
        SubscriptionStatus.ACTIVE,
        LocalDateTime.now().plusMonths(1),
        "Reset Test " + suffix,
        "reset_" + suffix,
        "reset_" + suffix + "@habitparty.com",
        "hashed_password",
        true,
        LocalDateTime.now(),
        new BigDecimal("120.00"),
        new BigDecimal("400.00"),
        LocalDate.of(1995, 5, 10),
        null,
        UserGender.PREFER_NOT_TO_SAY,
        1500,
        10,
        21,
        LocalDateTime.now());
    user.initializeTimezone(User.DEFAULT_TIMEZONE, Clock.systemUTC());
    user.getStats().setTotalTasksCompleted(42);
    user.getStats().setTotalWorkspacesCreated(3);
    user.getStats().setTotalCleanHabitCycles(11);
    user.getStats().setAchievementPoints(250);
    user.setBio("Missão Foco");
    user.setAvatarFrame("cosmic_gold");
    return userRepository.save(user);
  }
}
