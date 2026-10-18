package com.habitparty.core.domain.entities;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.habitparty.core.domain.enums.SubscriptionStatus;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;

class UserSubscriptionDomainTest {

  private User user;

  @BeforeEach
  void setUp() {
    user = new User(
        UUID.randomUUID(),
        UserRole.USER,
        false,
        "Aventureiro Teste",
        "aventureiro",
        "teste@habitparty.com",
        "hashed_pwd",
        BigDecimal.ZERO,
        BigDecimal.ZERO,
        LocalDate.of(1995, 5, 20),
        null,
        UserGender.MALE,
        0,
        0,
        0,
        LocalDateTime.now()
    );
  }

  @Test
  @DisplayName("Novo usuário nasce com status FREE e não é premium")
  void testInitialState() {
    assertFalse(user.isPremium());
    assertEquals(SubscriptionStatus.FREE, user.getSubscriptionStatus());
    assertNull(user.getSubscriptionEndsAt());
    assertFalse(user.hasActiveRecurringSubscription());
  }

  @Test
  @DisplayName("Ativar assinatura recorrente (Cartão) atualiza status para ACTIVE e isPremium = true")
  void testActivateSubscription() {
    LocalDateTime endsAt = LocalDateTime.now().plusMonths(1);
    user.activateSubscription("cus_123", "sub_abc", endsAt);

    assertTrue(user.isPremium());
    assertEquals(SubscriptionStatus.ACTIVE, user.getSubscriptionStatus());
    assertEquals("cus_123", user.getStripeCustomerId());
    assertEquals("sub_abc", user.getStripeSubscriptionId());
    assertEquals(endsAt, user.getSubscriptionEndsAt());
    assertTrue(user.hasActiveRecurringSubscription());
  }

  @Test
  @DisplayName("Pagamento Pix avulso adiciona 30 dias de acesso premium")
  void testExtendSubscriptionDaysPix() {
    user.extendSubscriptionDays(30);

    assertTrue(user.isPremium());
    assertEquals(SubscriptionStatus.ACTIVE, user.getSubscriptionStatus());
    assertNotNull(user.getSubscriptionEndsAt());
    assertTrue(user.getSubscriptionEndsAt().isAfter(LocalDateTime.now().plusDays(29)));
    assertFalse(user.hasActiveRecurringSubscription()); // Pix não é assinatura recorrente
  }

  @Test
  @DisplayName("Pagamento Pix avulso subsequente é cumulativo sobre a data restante")
  void testCumulativePixDays() {
    LocalDateTime futureDate = LocalDateTime.now().plusDays(10);
    user.setSubscriptionEndsAt(futureDate);
    user.setSubscriptionStatus(SubscriptionStatus.ACTIVE);

    user.extendSubscriptionDays(30);

    assertTrue(user.isPremium());
    // Deve somar 30 dias aos 10 dias restantes, totalizando ~40 dias a partir de agora
    assertTrue(user.getSubscriptionEndsAt().isAfter(LocalDateTime.now().plusDays(39)));
  }

  @Test
  @DisplayName("Quando os dias do Pix expiram no passado, isPremium DEVE retornar false")
  void testExpiredPixSubscriptionReturnsFalse() {
    user.extendSubscriptionDays(30);
    assertTrue(user.isPremium());

    // Simula passagem de 31 dias no tempo
    user.setSubscriptionEndsAt(LocalDateTime.now().minusDays(1));

    assertFalse(user.isPremium(), "Usuário com data expirada NÃO pode ser considerado Premium!");
  }

  @Test
  @DisplayName("Cancelamento de assinatura mantém acesso até o fim do período já pago e expira depois")
  void testCancelSubscriptionGracePeriodAndExpiration() {
    LocalDateTime endsAt = LocalDateTime.now().plusDays(5);
    user.activateSubscription("cus_123", "sub_abc", endsAt);
    user.cancelSubscription();

    assertEquals(SubscriptionStatus.CANCELED, user.getSubscriptionStatus());
    // Enquanto a data final estiver no futuro, usuário ainda desfruta do que pagou
    assertTrue(user.isPremium());

    // Quando a data passa, perde o premium automaticamente
    user.setSubscriptionEndsAt(LocalDateTime.now().minusMinutes(1));
    assertFalse(user.isPremium());
  }
}
