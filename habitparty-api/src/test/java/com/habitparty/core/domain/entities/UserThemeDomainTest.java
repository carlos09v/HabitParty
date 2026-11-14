package com.habitparty.core.domain.entities;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.exceptions.DomainValidationException;

class UserThemeDomainTest {

  private User createUser(boolean isPremium) {
    return new User(
        UUID.randomUUID(),
        UserRole.USER,
        isPremium,
        "Aventureiro",
        "aventureiro",
        "aventureiro@habitparty.com",
        "pwd",
        BigDecimal.ZERO,
        BigDecimal.ZERO,
        LocalDate.of(1998, 5, 20),
        null,
        UserGender.PREFER_NOT_TO_SAY,
        0,
        0,
        0,
        LocalDateTime.of(2026, 1, 1, 12, 0)
    );
  }

  @Test
  @DisplayName("Usuário deve iniciar com tema padrão 'dark'")
  void defaultThemeShouldBeDark() {
    User user = createUser(false);

    assertEquals("dark", user.getTheme());
    assertEquals("dark", user.getEffectiveTheme());
  }

  @Test
  @DisplayName("Usuário gratuito pode alternar entre os temas padrão ('light' e 'dark') com normalização")
  void freeUserCanSelectFreeThemesWithNormalization() {
    User user = createUser(false);

    user.updateTheme("  LIGHT ");
    assertEquals("light", user.getTheme());
    assertEquals("light", user.getEffectiveTheme());

    user.updateTheme("Dark");
    assertEquals("dark", user.getTheme());
    assertEquals("dark", user.getEffectiveTheme());
  }

  @Test
  @DisplayName("Usuário gratuito deve ser bloqueado ao tentar aplicar temas atmosféricos VIP")
  void freeUserCannotEquipVipThemes() {
    User user = createUser(false);

    DomainValidationException exception = assertThrows(
        DomainValidationException.class,
        () -> user.updateTheme("dark-knight")
    );

    assertTrue(exception.getMessage().contains("Premium"));
    assertEquals("dark", user.getTheme());
  }

  @Test
  @DisplayName("Usuário Premium pode equipar todos os temas atmosféricos VIP")
  void premiumUserCanEquipAllVipThemes() {
    User user = createUser(true);

    user.updateTheme("dark-knight");
    assertEquals("dark-knight", user.getEffectiveTheme());

    user.updateTheme("cyberpunk-neon");
    assertEquals("cyberpunk-neon", user.getEffectiveTheme());

    user.updateTheme("forest-ranger");
    assertEquals("forest-ranger", user.getEffectiveTheme());
  }

  @Test
  @DisplayName("Deve rejeitar tema vazio ou desconhecido com DomainValidationException")
  void shouldRejectBlankOrUnknownThemes() {
    User user = createUser(true);

    assertThrows(DomainValidationException.class, () -> user.updateTheme(null));
    assertThrows(DomainValidationException.class, () -> user.updateTheme("   "));
    assertThrows(DomainValidationException.class, () -> user.updateTheme("solarized-invalid"));
  }

  @Test
  @DisplayName("getEffectiveTheme deve reverter para 'dark' quando a assinatura Premium expira ou é cancelada")
  void effectiveThemeShouldFallbackToDarkWhenPremiumExpires() {
    User user = createUser(true);
    user.updateTheme("cyberpunk-neon");
    assertEquals("cyberpunk-neon", user.getEffectiveTheme());

    user.setPremium(false);
    assertEquals("cyberpunk-neon", user.getTheme());
    assertEquals("dark", user.getEffectiveTheme());

    // Se voltar a ser Premium sem trocar de tema, recupera a escolha anterior; se escolher light no plano Free, continua light
    user.setPremium(true);
    assertEquals("cyberpunk-neon", user.getEffectiveTheme());

    user.setPremium(false);
    user.updateTheme("light");
    assertEquals("light", user.getEffectiveTheme());
  }
}
