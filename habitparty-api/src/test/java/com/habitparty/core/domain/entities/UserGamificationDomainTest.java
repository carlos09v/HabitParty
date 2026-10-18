package com.habitparty.core.domain.entities;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.exceptions.DomainValidationException;

class UserGamificationDomainTest {

  private User user;

  @BeforeEach
  void setUp() {
    user = new User(
        UUID.randomUUID(),
        UserRole.USER,
        false,
        "Jogador Teste",
        "jogador",
        "jogador@habitparty.com",
        "hashed_pwd",
        BigDecimal.ZERO,
        BigDecimal.ZERO,
        LocalDate.of(2000, 1, 1),
        null,
        UserGender.NON_BINARY,
        0, // totalXp
        0, // currentStreak
        0, // highestStreak
        LocalDateTime.now()
    );
  }

  @Test
  @DisplayName("Incrementar streak atualiza currentStreak e highestStreak corretamente")
  void testIncrementStreak() {
    user.incrementStreak();
    assertEquals(1, user.getCurrentStreak());
    assertEquals(1, user.getHighestStreak());

    user.incrementStreak();
    assertEquals(2, user.getCurrentStreak());
    assertEquals(2, user.getHighestStreak());

    user.resetStreak();
    assertEquals(0, user.getCurrentStreak());
    assertEquals(2, user.getHighestStreak());

    user.incrementStreak();
    assertEquals(1, user.getCurrentStreak());
    assertEquals(2, user.getHighestStreak());
  }

  @Test
  @DisplayName("Adicionar dinheiro aumenta currentCoins e totalGoldEarned")
  void testAddCoins() {
    user.addCoins(new BigDecimal("10.50"));
    assertEquals(new BigDecimal("10.50"), user.getCurrentCoins());
    assertEquals(new BigDecimal("10.50"), user.getTotalGoldEarned());

    user.addCoins(new BigDecimal("5.00"));
    assertEquals(new BigDecimal("15.50"), user.getCurrentCoins());
    assertEquals(new BigDecimal("15.50"), user.getTotalGoldEarned());
  }

  @Test
  @DisplayName("Gastar moedas reduz currentCoins mas não altera totalGoldEarned")
  void testSpendMoney() {
    user.addCoins(new BigDecimal("20.00"));
    user.spendMoney(new BigDecimal("12.50"));

    assertEquals(new BigDecimal("7.50"), user.getCurrentCoins());
    assertEquals(new BigDecimal("20.00"), user.getTotalGoldEarned());
  }

  @Test
  @DisplayName("Gastar mais moedas do que possui lança DomainValidationException")
  void testSpendMoneyInsufficient() {
    user.addCoins(new BigDecimal("5.00"));
    assertThrows(DomainValidationException.class, () -> user.spendMoney(new BigDecimal("10.00")));
  }

  @Test
  @DisplayName("Multa em moedas não deixa saldo negativo (mínimo 0)")
  void testPenaltyDoesNotGoNegativeCoins() {
    user.addCoins(new BigDecimal("2.00"));
    user.applyPenalty(new BigDecimal("10.00"), 5);

    assertEquals(BigDecimal.ZERO, user.getCurrentCoins());
  }

  @Test
  @DisplayName("Atualizar perfil com idade válida atualiza os dados com sucesso")
  void testUpdateProfileWithValidBirthday() {
    LocalDate validBirthday = LocalDate.now().minusYears(20);
    user.updateProfile("Novo Nome", validBirthday, UserGender.FEMALE);

    assertEquals("Novo Nome", user.getFullName());
    assertEquals(validBirthday, user.getBirthday());
    assertEquals(UserGender.FEMALE, user.getGender());
    assertEquals(20, user.getAge());
  }

  @Test
  @DisplayName("Atualizar perfil com idade menor que 12 anos lança DomainValidationException")
  void testUpdateProfileWithAgeUnder12ThrowsException() {
    LocalDate under12Birthday = LocalDate.now().minusYears(10);
    DomainValidationException ex = assertThrows(
        DomainValidationException.class,
        () -> user.updateProfile("Menor de Idade", under12Birthday, UserGender.MALE)
    );
    assertTrue(ex.getMessage().contains("no mínimo 12 anos"));
  }

  @Test
  @DisplayName("Atualizar perfil com data no futuro lança DomainValidationException")
  void testUpdateProfileWithFutureBirthdayThrowsException() {
    LocalDate futureBirthday = LocalDate.now().plusDays(2);
    DomainValidationException ex = assertThrows(
        DomainValidationException.class,
        () -> user.updateProfile("Futurista", futureBirthday, UserGender.PREFER_NOT_TO_SAY)
    );
    assertTrue(ex.getMessage().contains("deve estar no passado"));
  }
}
