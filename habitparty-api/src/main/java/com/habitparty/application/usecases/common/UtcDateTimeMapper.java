package com.habitparty.application.usecases.common;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;

/**
 * Utilitário centralizado para conversões entre o relógio do servidor e o fuso horário do usuário.
 */
public final class UtcDateTimeMapper {
  private UtcDateTimeMapper() {
  }

  public static OffsetDateTime toUtcOffsetDateTime(LocalDateTime serverLocalDateTime) {
    return toUserOffsetDateTime(serverLocalDateTime, ZoneOffset.UTC);
  }

  public static OffsetDateTime toUserOffsetDateTime(LocalDateTime serverLocalDateTime, ZoneId userZone) {
    return toUserOffsetDateTime(serverLocalDateTime, userZone, ZoneId.systemDefault());
  }

  public static OffsetDateTime toUserOffsetDateTime(
      LocalDateTime serverLocalDateTime, ZoneId userZone, ZoneId serverZone) {
    if (serverLocalDateTime == null) {
      return null;
    }
    ZoneId effectiveServerZone = serverZone != null ? serverZone : ZoneId.systemDefault();
    ZoneId effectiveZone = userZone != null ? userZone : effectiveServerZone;
    return serverLocalDateTime
        .atZone(effectiveServerZone)
        .withZoneSameInstant(effectiveZone)
        .toOffsetDateTime();
  }

  public static LocalDateTime toServerLocalDateTime(LocalDateTime userLocalDateTime, ZoneId userZone) {
    return toServerLocalDateTime(userLocalDateTime, userZone, ZoneId.systemDefault());
  }

  public static LocalDateTime toServerLocalDateTime(
      LocalDateTime userLocalDateTime, ZoneId userZone, ZoneId serverZone) {
    if (userLocalDateTime == null) {
      return null;
    }
    ZoneId effectiveServerZone = serverZone != null ? serverZone : ZoneId.systemDefault();
    ZoneId effectiveZone = userZone != null ? userZone : effectiveServerZone;
    return userLocalDateTime
        .atZone(effectiveZone)
        .withZoneSameInstant(effectiveServerZone)
        .toLocalDateTime();
  }

  public static LocalDateTime startOfMonthInServerZone(LocalDate userToday, ZoneId userZone) {
    return startOfMonthInServerZone(userToday, userZone, ZoneId.systemDefault());
  }

  public static LocalDateTime startOfMonthInServerZone(LocalDate userToday, ZoneId userZone, ZoneId serverZone) {
    ZoneId effectiveServerZone = serverZone != null ? serverZone : ZoneId.systemDefault();
    ZoneId effectiveZone = userZone != null ? userZone : effectiveServerZone;
    return userToday.withDayOfMonth(1)
        .atStartOfDay(effectiveZone)
        .withZoneSameInstant(effectiveServerZone)
        .toLocalDateTime();
  }
}
