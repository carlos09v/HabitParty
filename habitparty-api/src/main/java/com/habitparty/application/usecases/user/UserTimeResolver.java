package com.habitparty.application.usecases.user;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;

@Service
public class UserTimeResolver {
  private final UserRepository userPort;
  private final Clock clock;

  @Autowired
  public UserTimeResolver(UserRepository userPort, Clock clock) {
    this.userPort = userPort;
    this.clock = clock != null ? clock : Clock.system(ZoneId.of(User.DEFAULT_TIMEZONE));
  }

  public UserTimeResolver(UserRepository userPort) {
    this(userPort, Clock.system(ZoneId.of(User.DEFAULT_TIMEZONE)));
  }

  public Clock clock() {
    return clock;
  }

  public Instant nowInstant() {
    return Instant.now(clock);
  }

  public ZoneId resolveZone(User user) {
    ZoneId fallback = defaultZone();
    return user != null ? user.resolveZoneId(fallback) : fallback;
  }

  public ZoneId resolveZone(UUID userId) {
    if (userId == null || userPort == null) {
      return defaultZone();
    }
    return userPort.findById(userId)
        .map(this::resolveZone)
        .orElseGet(this::defaultZone);
  }

  public LocalDate resolveDate(User user) {
    return user != null
        ? user.resolveLocalDate(clock)
        : LocalDate.now(clock.withZone(defaultZone()));
  }

  public LocalDate resolveDate(UUID userId) {
    return LocalDate.now(clock.withZone(resolveZone(userId)));
  }

  public LocalDateTime resolveDateTime(User user) {
    return user != null
        ? user.resolveLocalDateTime(clock)
        : LocalDateTime.now(clock.withZone(defaultZone()));
  }

  public LocalDateTime resolveDateTime(UUID userId) {
    return LocalDateTime.now(clock.withZone(resolveZone(userId)));
  }

  private ZoneId defaultZone() {
    return clock.getZone() != null ? clock.getZone() : ZoneId.of(User.DEFAULT_TIMEZONE);
  }
}
