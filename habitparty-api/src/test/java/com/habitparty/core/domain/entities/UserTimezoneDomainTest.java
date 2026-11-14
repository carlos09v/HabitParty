package com.habitparty.core.domain.entities;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.exceptions.DomainValidationException;

class UserTimezoneDomainTest {

  private User createUser() {
    return new User(
        UUID.randomUUID(),
        UserRole.USER,
        false,
        "Lucas",
        "lucas",
        "lucas@habitparty.com",
        "pwd",
        BigDecimal.ZERO,
        BigDecimal.ZERO,
        LocalDate.of(1996, 3, 10),
        null,
        UserGender.MALE,
        0,
        1,
        0,
        LocalDateTime.of(2026, 1, 1, 12, 0)
    );
  }

  @Test
  @DisplayName("initializeTimezone deve validar IANA, preencher reset inicial e manter cooldown livre")
  void initializeTimezoneSetsValidZoneAndNullCooldown() {
    User user = createUser();
    Clock fixedClock = Clock.fixed(Instant.parse("2026-11-13T18:00:00Z"), ZoneId.of("UTC"));

    user.initializeTimezone("Asia/Tokyo", fixedClock);

    assertEquals("Asia/Tokyo", user.getTimezone());
    assertNull(user.getTimezoneUpdatedAt());
    // 2026-11-13T18:00:00Z = 2026-11-14 03:00 em Asia/Tokyo
    assertEquals(LocalDate.of(2026, 11, 14), user.getLastDailyResetDate());
    assertEquals(
        LocalDate.of(2026, 11, 15).atStartOfDay(ZoneId.of("Asia/Tokyo")).toInstant(),
        user.getNextDailyResetAt());
  }

  @Test
  @DisplayName("initializeTimezone e changeTimezone devem rejeitar IANA inválido")
  void rejectInvalidIanaTimezone() {
    User user = createUser();
    Clock fixedClock = Clock.fixed(Instant.parse("2026-11-13T18:00:00Z"), ZoneId.of("UTC"));

    assertThrows(DomainValidationException.class, () -> user.initializeTimezone("Mars/Phobos", fixedClock));
    assertThrows(DomainValidationException.class, () -> user.changeTimezone("Invalid/Zone", fixedClock));
  }

  @Test
  @DisplayName("changeTimezone deve aplicar cooldown de 24h entre trocas manuais e ignorar mesmo fuso")
  void changeTimezoneEnforces24hCooldown() {
    User user = createUser();
    Clock t0 = Clock.fixed(Instant.parse("2026-11-13T12:00:00Z"), ZoneId.of("UTC"));
    user.initializeTimezone("America/Sao_Paulo", t0);

    // Repetir mesmo fuso é no-op e não consome o cooldown
    user.changeTimezone("America/Sao_Paulo", t0);
    assertNull(user.getTimezoneUpdatedAt());

    // Primeira troca real funciona imediatamente
    user.changeTimezone("Europe/Lisbon", t0);
    assertEquals("Europe/Lisbon", user.getTimezone());
    assertEquals(Instant.parse("2026-11-13T12:00:00Z"), user.getTimezoneUpdatedAt());

    // Segunda troca após 12h é bloqueada
    Clock t12h = Clock.fixed(Instant.parse("2026-11-14T00:00:00Z"), ZoneId.of("UTC"));
    assertThrows(DomainValidationException.class, () -> user.changeTimezone("America/New_York", t12h));

    // Troca após exatamente 24h é permitida
    Clock t24h = Clock.fixed(Instant.parse("2026-11-14T12:00:00Z"), ZoneId.of("UTC"));
    user.changeTimezone("America/New_York", t24h);
    assertEquals("America/New_York", user.getTimezone());
  }

  @Test
  @DisplayName("changeTimezone deve preservar max(lastDailyResetDate, newToday) evitando reset duplicado ou retroativo")
  void changeTimezonePreservesMaxResetDate() {
    // 2026-11-14 02:00 UTC -> 2026-11-13 23:00 São Paulo / 2026-11-14 11:00 Tóquio
    Clock clock = Clock.fixed(Instant.parse("2026-11-14T02:00:00Z"), ZoneId.of("UTC"));

    // Caso 1: Indo para o leste (2026-11-13 -> 2026-11-14) evita punição retroativa imediata
    User eastward = createUser();
    eastward.initializeTimezone("America/Sao_Paulo", clock);
    assertEquals(LocalDate.of(2026, 11, 13), eastward.getLastDailyResetDate());

    eastward.changeTimezone("Asia/Tokyo", clock);
    assertEquals(LocalDate.of(2026, 11, 14), eastward.getLastDailyResetDate());
    assertFalse(eastward.shouldRunDailyReset(LocalDate.of(2026, 11, 14)));

    // Caso 2: Voltando para o oeste (2026-11-14 -> 2026-11-13) evita resetar o mesmo dia duas vezes
    User westward = createUser();
    westward.initializeTimezone("Asia/Tokyo", clock);
    assertEquals(LocalDate.of(2026, 11, 14), westward.getLastDailyResetDate());

    westward.changeTimezone("America/Sao_Paulo", clock);
    assertEquals(LocalDate.of(2026, 11, 14), westward.getLastDailyResetDate());
    assertEquals(
        LocalDate.of(2026, 11, 15).atStartOfDay(ZoneId.of("America/Sao_Paulo")).toInstant(),
        westward.getNextDailyResetAt());
  }

  @Test
  @DisplayName("changeTimezone deve tratar aliases IANA equivalentes como no-op sem consumir cooldown")
  void canonicalAliasEquivalenceDoesNotConsumeCooldown() {
    User user = createUser();
    Clock t0 = Clock.fixed(Instant.parse("2026-11-13T12:00:00Z"), ZoneId.of("UTC"));
    user.initializeTimezone("Asia/Calcutta", t0);

    assertEquals("Asia/Kolkata", user.getTimezone());
    assertTrue(User.areTimezonesEquivalent("Asia/Calcutta", "Asia/Kolkata"));
    assertTrue(User.areTimezonesEquivalent("Etc/UTC", "UTC"));
    assertTrue(User.areTimezonesEquivalent("America/Buenos_Aires", "America/Argentina/Buenos_Aires"));

    user.changeTimezone("Asia/Kolkata", t0);
    assertNull(user.getTimezoneUpdatedAt());

    user.changeTimezone("Etc/UTC", t0);
    assertEquals("UTC", user.getTimezone());
    assertNotNull(user.getTimezoneUpdatedAt());

    // Repetir alias equivalente durante cooldown é no-op permitido
    user.changeTimezone("UTC", t0);
    assertEquals("UTC", user.getTimezone());
  }
}
