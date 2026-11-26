package com.habitparty.core.domain.entities.user;

import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;

import com.habitparty.core.exceptions.DomainValidationException;

/**
 * Política de fuso horário IANA, canonicalização de aliases legados e cálculo de próxima meia-noite.
 */
public final class UserTimezonePolicy {
  public static final String DEFAULT_TIMEZONE = "America/Sao_Paulo";
  public static final long TIMEZONE_CHANGE_COOLDOWN_HOURS = 24L;

  private static final Map<String, String> CANONICAL_ZONE_ALIASES = Map.ofEntries(
      Map.entry("Z", "UTC"),
      Map.entry("GMT", "UTC"),
      Map.entry("GMT+0", "UTC"),
      Map.entry("GMT-0", "UTC"),
      Map.entry("GMT0", "UTC"),
      Map.entry("Etc/GMT", "UTC"),
      Map.entry("Etc/GMT+0", "UTC"),
      Map.entry("Etc/GMT-0", "UTC"),
      Map.entry("Etc/GMT0", "UTC"),
      Map.entry("Etc/UTC", "UTC"),
      Map.entry("Etc/Universal", "UTC"),
      Map.entry("Etc/Zulu", "UTC"),
      Map.entry("Universal", "UTC"),
      Map.entry("Zulu", "UTC"),
      Map.entry("Asia/Calcutta", "Asia/Kolkata"),
      Map.entry("Asia/Saigon", "Asia/Ho_Chi_Minh"),
      Map.entry("Asia/Katmandu", "Asia/Kathmandu"),
      Map.entry("Asia/Rangoon", "Asia/Yangon"),
      Map.entry("Europe/Kiev", "Europe/Kyiv"),
      Map.entry("America/Buenos_Aires", "America/Argentina/Buenos_Aires"),
      Map.entry("America/Godthab", "America/Nuuk"),
      Map.entry("Brazil/East", "America/Sao_Paulo"),
      Map.entry("Brazil/West", "America/Manaus"),
      Map.entry("US/Eastern", "America/New_York"),
      Map.entry("US/Central", "America/Chicago"),
      Map.entry("US/Mountain", "America/Denver"),
      Map.entry("US/Pacific", "America/Los_Angeles"),
      Map.entry("US/Hawaii", "Pacific/Honolulu"),
      Map.entry("US/Alaska", "America/Anchorage"),
      Map.entry("Africa/Asmera", "Africa/Asmara"),
      Map.entry("Atlantic/Faeroe", "Atlantic/Faroe"),
      Map.entry("Pacific/Ponape", "Pacific/Pohnpei"),
      Map.entry("Pacific/Truk", "Pacific/Chuuk")
  );

  private UserTimezonePolicy() {
  }

  public static ZoneId canonicalizeZoneId(ZoneId zone) {
    if (zone == null) {
      return ZoneId.of(DEFAULT_TIMEZONE);
    }
    String mapped = CANONICAL_ZONE_ALIASES.get(zone.getId());
    return mapped != null ? ZoneId.of(mapped) : zone;
  }

  public static boolean areTimezonesEquivalent(String first, String second) {
    if (first == null || first.isBlank() || second == null || second.isBlank()) {
      return false;
    }
    try {
      return canonicalizeZoneId(ZoneId.of(first.trim()))
          .equals(canonicalizeZoneId(ZoneId.of(second.trim())));
    } catch (DateTimeException e) {
      return false;
    }
  }

  public static ZoneId parseValidZoneId(String rawTimezone) {
    if (rawTimezone == null || rawTimezone.isBlank()) {
      throw new DomainValidationException("O fuso horário não pode estar vazio.");
    }
    String clean = rawTimezone.trim();
    if (clean.length() > 64) {
      throw new DomainValidationException("Identificador de fuso horário inválido.");
    }
    try {
      return canonicalizeZoneId(ZoneId.of(clean));
    } catch (DateTimeException e) {
      throw new DomainValidationException("Fuso horário IANA inválido: " + clean);
    }
  }

  public static Instant calculateNextMidnightInstant(LocalDate referenceDate, ZoneId zone) {
    ZoneId effectiveZone = zone != null ? zone : ZoneId.of(DEFAULT_TIMEZONE);
    return referenceDate.plusDays(1).atStartOfDay(effectiveZone).toInstant();
  }

  public static ZoneId resolveZoneId(String rawTimezone, ZoneId fallback) {
    if (rawTimezone != null && !rawTimezone.isBlank()) {
      try {
        return ZoneId.of(rawTimezone.trim());
      } catch (DateTimeException ignored) {
        // Cai para o fallback seguro caso um valor legado inválido exista
      }
    }
    return fallback != null ? fallback : ZoneId.of(DEFAULT_TIMEZONE);
  }
}
