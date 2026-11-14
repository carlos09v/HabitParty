package com.habitparty.core.domain.entities;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.ZoneId;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import com.habitparty.core.domain.enums.SubscriptionStatus;
import com.habitparty.core.domain.enums.UserExperienceMode;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserLevel;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.exceptions.DomainValidationException;

public class User {
  public static final String DEFAULT_TIMEZONE = "America/Sao_Paulo";
  public static final long TIMEZONE_CHANGE_COOLDOWN_HOURS = 24L;
  public static final String DEFAULT_THEME = "dark";
  public static final Set<String> FREE_THEMES = Set.of(
      "dark",
      "light"
  );
  public static final Set<String> PREMIUM_THEMES = Set.of(
      "dark-knight",
      "cyberpunk-neon",
      "forest-ranger"
  );
  public static final Set<String> VALID_THEMES = Set.of(
      "dark",
      "light",
      "dark-knight",
      "cyberpunk-neon",
      "forest-ranger"
  );
  public static final Set<String> VALID_AVATAR_FRAMES = Set.of(
      "none",
      "cosmic_gold",
      "neon_arcane",
      "emerald_nature",
      "crimson_ember",
      "celestial_diamond"
  );

  private UUID id;
  private UserRole role;
  private String fullName;
  private String username;
  private String email;
  private String password;
  private boolean emailVerified;
  private LocalDateTime emailVerifiedAt;
  private LocalDate birthDate;
  private String profilePhotoUrl;
  private String bio;
  private String avatarFrame = "none";
  private String theme = DEFAULT_THEME;
  private UserGender gender;
  private UserExperienceMode experienceMode = UserExperienceMode.PRODUCTIVITY;
  private String timezone = DEFAULT_TIMEZONE;
  private Instant timezoneUpdatedAt;
  private LocalDate lastDailyResetDate;
  private Instant nextDailyResetAt;
  private LocalDateTime createdAt;

  // Sub-entidades do Agregado (1:1 com PK compartilhada no banco)
  private UserStats stats;
  private UserSubscription subscription;

  // Construtor compatível anterior (16 parâmetros)
  public User(UUID id, UserRole role, boolean isPremium, String fullName, String username, String email,
      String password,
      BigDecimal currentCoins,
      BigDecimal totalGoldEarned,
      LocalDate birthDate, String profilePhotoUrl, UserGender gender, int totalXp, int currentStreak, int highestStreak,
      LocalDateTime createdAt) {
    this(id, role, isPremium, false, null, null, SubscriptionStatus.FREE, null, fullName, username, email, password,
        true, null, currentCoins, totalGoldEarned, birthDate, profilePhotoUrl, gender, totalXp, currentStreak, highestStreak,
        createdAt);
  }

  // Construtor compatível sem flag de fundador explícita (20 parâmetros)
  public User(UUID id, UserRole role, boolean isPremium, String stripeCustomerId, String stripeSubscriptionId,
      SubscriptionStatus subscriptionStatus, LocalDateTime subscriptionEndsAt, String fullName, String username,
      String email, String password, BigDecimal currentCoins, BigDecimal totalGoldEarned, LocalDate birthDate,
      String profilePhotoUrl, UserGender gender, int totalXp, int currentStreak, int highestStreak,
      LocalDateTime createdAt) {
    this(id, role, isPremium, false, stripeCustomerId, stripeSubscriptionId, subscriptionStatus, subscriptionEndsAt,
        fullName, username, email, password, true, null, currentCoins, totalGoldEarned, birthDate, profilePhotoUrl, gender,
        totalXp, currentStreak, highestStreak, createdAt);
  }

  // Construtor completo anterior com dados de Assinatura/Stripe e Membro Fundador (21 parâmetros)
  public User(UUID id, UserRole role, boolean isPremium, boolean isFounder, String stripeCustomerId,
      String stripeSubscriptionId, SubscriptionStatus subscriptionStatus, LocalDateTime subscriptionEndsAt,
      String fullName, String username, String email, String password, BigDecimal currentCoins,
      BigDecimal totalGoldEarned, LocalDate birthDate, String profilePhotoUrl, UserGender gender,
      int totalXp, int currentStreak, int highestStreak, LocalDateTime createdAt) {
    this(id, role, isPremium, isFounder, stripeCustomerId, stripeSubscriptionId, subscriptionStatus, subscriptionEndsAt,
        fullName, username, email, password, true, null, currentCoins, totalGoldEarned, birthDate, profilePhotoUrl, gender,
        totalXp, currentStreak, highestStreak, createdAt);
  }

  // Construtor completo com verificação de e-mail explícita (23 parâmetros)
  public User(UUID id, UserRole role, boolean isPremium, boolean isFounder, String stripeCustomerId,
      String stripeSubscriptionId, SubscriptionStatus subscriptionStatus, LocalDateTime subscriptionEndsAt,
      String fullName, String username, String email, String password,
      boolean emailVerified, LocalDateTime emailVerifiedAt,
      BigDecimal currentCoins, BigDecimal totalGoldEarned, LocalDate birthDate, String profilePhotoUrl, UserGender gender,
      int totalXp, int currentStreak, int highestStreak, LocalDateTime createdAt) {
    this(
        id,
        role,
        fullName,
        username,
        email,
        password,
        emailVerified,
        emailVerifiedAt,
        birthDate,
        profilePhotoUrl,
        gender,
        createdAt,
        new UserStats(id, currentCoins, totalGoldEarned, totalXp, currentStreak, highestStreak, createdAt),
        new UserSubscription(id, isPremium, isFounder, stripeCustomerId, stripeSubscriptionId, subscriptionStatus, subscriptionEndsAt, createdAt)
    );
  }

  // Construtor orientado às sub-entidades do agregado (UserStats + UserSubscription)
  public User(
      UUID id,
      UserRole role,
      String fullName,
      String username,
      String email,
      String password,
      boolean emailVerified,
      LocalDateTime emailVerifiedAt,
      LocalDate birthDate,
      String profilePhotoUrl,
      UserGender gender,
      LocalDateTime createdAt,
      UserStats stats,
      UserSubscription subscription) {
    this(
        id,
        role,
        fullName,
        username,
        email,
        password,
        emailVerified,
        emailVerifiedAt,
        birthDate,
        profilePhotoUrl,
        gender,
        UserExperienceMode.PRODUCTIVITY,
        createdAt,
        stats,
        subscription);
  }

  public User(
      UUID id,
      UserRole role,
      String fullName,
      String username,
      String email,
      String password,
      boolean emailVerified,
      LocalDateTime emailVerifiedAt,
      LocalDate birthDate,
      String profilePhotoUrl,
      UserGender gender,
      UserExperienceMode experienceMode,
      LocalDateTime createdAt,
      UserStats stats,
      UserSubscription subscription) {
    this.id = id;
    this.role = role != null ? role : UserRole.USER;
    this.fullName = fullName;
    this.username = username;
    this.email = email;
    this.password = password;
    this.emailVerified = emailVerified;
    this.emailVerifiedAt = emailVerifiedAt;
    this.birthDate = birthDate;
    this.profilePhotoUrl = profilePhotoUrl;
    this.gender = gender;
    this.experienceMode = experienceMode != null ? experienceMode : UserExperienceMode.PRODUCTIVITY;
    this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
    this.stats = stats != null ? stats : UserStats.createInitial(id);
    this.subscription = subscription != null ? subscription : UserSubscription.createInitial(id);
  }

  // --- VERIFICAÇÃO DE E-MAIL E SEGURANÇA DA CONTA ---
  public boolean isEmailVerified() {
    return emailVerified;
  }

  public void setEmailVerified(boolean emailVerified) {
    this.emailVerified = emailVerified;
  }

  public LocalDateTime getEmailVerifiedAt() {
    return emailVerifiedAt;
  }

  public void setEmailVerifiedAt(LocalDateTime emailVerifiedAt) {
    this.emailVerifiedAt = emailVerifiedAt;
  }

  public void verifyEmail() {
    this.emailVerified = true;
    if (this.emailVerifiedAt == null) {
      this.emailVerifiedAt = LocalDateTime.now();
    }
  }

  public void validateEmailVerified(String actionDescription) {
    if (!this.emailVerified) {
      String suffix = (actionDescription != null && !actionDescription.isBlank())
          ? " antes de " + actionDescription + "."
          : ".";
      throw new DomainValidationException(
          "Confirme seu e-mail para garantir a segurança da conta" + suffix);
    }
  }

  // --- DELEGAÇÃO PARA USER_STATS (GAMIFICAÇÃO E ECONOMIA) ---
  public UserStats getStats() {
    return stats;
  }

  public void setStats(UserStats stats) {
    this.stats = stats != null ? stats : UserStats.createInitial(this.id);
  }

  public UserLevel getCurrentLevel() {
    return stats.getCurrentLevel();
  }

  public UserLevel getNextLevel() {
    return stats.getNextLevel();
  }

  public void addXp(int xpToAdd) {
    stats.addXp(xpToAdd);
  }

  public int getXpToNextLevel() {
    return stats.getXpToNextLevel();
  }

  public void removeXp(int xpToRemove) {
    stats.removeXp(xpToRemove);
  }

  public void applyPenalty(BigDecimal penaltyAmount, int xpPenalty) {
    stats.applyPenalty(penaltyAmount, xpPenalty);
  }

  public void incrementStreak() {
    stats.incrementStreak();
  }

  public void resetStreak() {
    stats.resetStreak();
  }

  public void addCoins(BigDecimal amount) {
    stats.addCoins(amount);
  }

  public void removeCoins(BigDecimal penaltyAmount) {
    stats.removeCoins(penaltyAmount);
  }

  public void spendMoney(BigDecimal amountToSpend) {
    stats.spendMoney(amountToSpend);
  }

  public BigDecimal getCurrentCoins() {
    return stats.getCurrentCoins();
  }

  public void setCurrentCoins(BigDecimal currentCoins) {
    stats.setCurrentCoins(currentCoins);
  }

  public BigDecimal getTotalGoldEarned() {
    return stats.getTotalGoldEarned();
  }

  public void setTotalGoldEarned(BigDecimal totalGoldEarned) {
    stats.setTotalGoldEarned(totalGoldEarned);
  }

  public int getTotalXp() {
    return stats.getTotalXp();
  }

  public void setTotalXp(int totalXp) {
    stats.setTotalXp(totalXp);
  }

  public int getCurrentStreak() {
    return stats.getCurrentStreak();
  }

  public void setCurrentStreak(int currentStreak) {
    stats.setCurrentStreak(currentStreak);
  }

  public int getHighestStreak() {
    return stats.getHighestStreak();
  }

  public void setHighestStreak(int highestStreak) {
    stats.setHighestStreak(highestStreak);
  }

  // --- DELEGAÇÃO PARA USER_SUBSCRIPTION (PLANOS & STRIPE) ---
  public UserSubscription getSubscription() {
    return subscription;
  }

  public void setSubscription(UserSubscription subscription) {
    this.subscription = subscription != null ? subscription : UserSubscription.createInitial(this.id);
  }

  public void upgradeToPremium() {
    subscription.upgradeToPremium();
  }

  public boolean isPremium() {
    return subscription.isPremium();
  }

  public boolean hasActiveRecurringSubscription() {
    return subscription.hasActiveRecurringSubscription();
  }

  public void setPremium(boolean isPremium) {
    subscription.setPremium(isPremium);
  }

  public boolean isFounder() {
    return subscription.isFounder();
  }

  public void setFounder(boolean isFounder) {
    subscription.setFounder(isFounder);
  }

  public void grantFounderStatus() {
    subscription.grantFounderStatus();
  }

  public void activateSubscription(String customerId, String subscriptionId, LocalDateTime endsAt) {
    subscription.activateSubscription(customerId, subscriptionId, endsAt);
  }

  public void extendSubscriptionDays(int days) {
    subscription.extendSubscriptionDays(days);
  }

  public void cancelSubscription() {
    subscription.cancelSubscription();
  }

  public void markPastDue() {
    subscription.markPastDue();
  }

  public String getStripeCustomerId() {
    return subscription.getStripeCustomerId();
  }

  public void setStripeCustomerId(String stripeCustomerId) {
    subscription.setStripeCustomerId(stripeCustomerId);
  }

  public String getStripeSubscriptionId() {
    return subscription.getStripeSubscriptionId();
  }

  public void setStripeSubscriptionId(String stripeSubscriptionId) {
    subscription.setStripeSubscriptionId(stripeSubscriptionId);
  }

  public SubscriptionStatus getSubscriptionStatus() {
    return subscription.getSubscriptionStatus();
  }

  public void setSubscriptionStatus(SubscriptionStatus subscriptionStatus) {
    subscription.setSubscriptionStatus(subscriptionStatus);
  }

  public LocalDateTime getSubscriptionEndsAt() {
    return subscription.getSubscriptionEndsAt();
  }

  public void setSubscriptionEndsAt(LocalDateTime subscriptionEndsAt) {
    subscription.setSubscriptionEndsAt(subscriptionEndsAt);
  }

  // --- ATUALIZAÇÃO DE PERFIL, FOTO E SENHA ---
  public void updateProfile(String fullName, LocalDate birthDate, UserGender gender) {
    updateProfile(fullName, birthDate, gender, LocalDate.now());
  }

  public void updateProfile(String fullName, LocalDate birthDate, UserGender gender, LocalDate referenceDate) {
    if (fullName == null || fullName.trim().isEmpty()) {
      throw new DomainValidationException("O nome não pode estar vazio.");
    }
    if (birthDate != null) {
      LocalDate effectiveToday = referenceDate != null ? referenceDate : LocalDate.now();
      if (birthDate.isAfter(effectiveToday)) {
        throw new DomainValidationException("A data de nascimento deve estar no passado.");
      }
      int age = Period.between(birthDate, effectiveToday).getYears();
      if (age < 12) {
        throw new DomainValidationException("Você deve ter no mínimo 12 anos.");
      }
      if (age > 120) {
        throw new DomainValidationException("Data de nascimento inválida.");
      }
    }
    this.fullName = fullName;
    this.birthDate = birthDate;
    this.gender = gender;
  }

  public Integer getAge() {
    return getAge(LocalDate.now(resolveZoneId(null)));
  }

  public Integer getAge(LocalDate referenceDate) {
    if (this.birthDate == null)
      return null;
    LocalDate effectiveToday = referenceDate != null ? referenceDate : LocalDate.now(resolveZoneId(null));
    return Period.between(this.birthDate, effectiveToday).getYears();
  }

  public void updateProfilePhoto(String photoUrl) {
    this.profilePhotoUrl = photoUrl;
  }

  public void updatePassword(String newHashedPassword) {
    if (newHashedPassword == null || newHashedPassword.isEmpty()) {
      throw new DomainValidationException("A senha não pode ser nula.");
    }
    this.password = newHashedPassword;
  }

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
    if (this.stats != null) {
      this.stats.setUserId(id);
    }
    if (this.subscription != null) {
      this.subscription.setUserId(id);
    }
  }

  public UserRole getRole() {
    return role;
  }

  public void setRole(UserRole role) {
    this.role = role;
  }

  public String getFullName() {
    return fullName;
  }

  public void setFullName(String fullName) {
    this.fullName = fullName;
  }

  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }

  public UserGender getGender() {
    return gender;
  }

  public void setGender(UserGender gender) {
    this.gender = gender;
  }

  public UserExperienceMode getExperienceMode() {
    return experienceMode != null ? experienceMode : UserExperienceMode.PRODUCTIVITY;
  }

  public void setExperienceMode(UserExperienceMode experienceMode) {
    this.experienceMode = experienceMode != null ? experienceMode : UserExperienceMode.PRODUCTIVITY;
  }

  public void updateExperienceMode(UserExperienceMode newMode) {
    if (newMode != null) {
      this.experienceMode = newMode;
    }
  }

  public LocalDate getBirthDate() {
    return birthDate;
  }

  public void setBirthDate(LocalDate birthDate) {
    this.birthDate = birthDate;
  }

  public Optional<String> getProfilePhotoUrl() {
    return Optional.ofNullable(profilePhotoUrl);
  }

  public void setProfilePhotoUrl(String profilePhotoUrl) {
    this.profilePhotoUrl = profilePhotoUrl;
  }

  public Optional<String> getBio() {
    return Optional.ofNullable(bio).filter(b -> !b.isBlank());
  }

  public void setBio(String bio) {
    if (bio != null && bio.trim().length() > 160) {
      throw new DomainValidationException("A bio do perfil deve ter no máximo 160 caracteres.");
    }
    this.bio = (bio != null && !bio.isBlank()) ? bio.trim() : null;
  }

  public String getAvatarFrame() {
    return (avatarFrame != null && !avatarFrame.isBlank()) ? avatarFrame : "none";
  }

  public void setAvatarFrame(String avatarFrame) {
    this.avatarFrame = (avatarFrame != null && !avatarFrame.isBlank()) ? avatarFrame.trim() : "none";
  }

  public static boolean isPremiumTheme(String themeId) {
    return themeId != null && PREMIUM_THEMES.contains(themeId.trim().toLowerCase());
  }

  public String getTheme() {
    return (theme != null && !theme.isBlank()) ? theme.trim().toLowerCase() : DEFAULT_THEME;
  }

  public void setTheme(String theme) {
    this.theme = (theme != null && !theme.isBlank()) ? theme.trim().toLowerCase() : DEFAULT_THEME;
  }

  public String getEffectiveTheme() {
    String current = getTheme();
    if (!VALID_THEMES.contains(current)) {
      return DEFAULT_THEME;
    }
    if (PREMIUM_THEMES.contains(current) && !this.isPremium()) {
      return DEFAULT_THEME;
    }
    return current;
  }

  public void updateTheme(String newTheme) {
    if (newTheme == null || newTheme.isBlank()) {
      throw new DomainValidationException("O tema visual não pode estar vazio.");
    }
    String cleanTheme = newTheme.trim().toLowerCase();
    if (!VALID_THEMES.contains(cleanTheme)) {
      throw new DomainValidationException("Tema visual inválido: " + newTheme);
    }
    if (PREMIUM_THEMES.contains(cleanTheme) && !this.isPremium()) {
      throw new DomainValidationException(
          "Temas atmosféricos VIP requerem o plano Guardião Cósmico (Premium).");
    }
    this.theme = cleanTheme;
  }

  public void updateShowcaseProfile(String bio, String avatarFrame) {
    if (bio != null) {
      setBio(bio);
    }
    if (avatarFrame != null && !avatarFrame.isBlank()) {
      String cleanFrame = avatarFrame.trim().toLowerCase();
      if (!VALID_AVATAR_FRAMES.contains(cleanFrame)) {
        throw new DomainValidationException("Moldura de avatar inválida: " + avatarFrame);
      }
      if (!"none".equalsIgnoreCase(cleanFrame) && !this.isPremium()) {
        throw new DomainValidationException("Molduras animadas exclusivas requerem o plano Guardião Cósmico (Premium).");
      }
      this.avatarFrame = cleanFrame;
    }
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  // --- FUSO HORÁRIO E CONTROLE IDEMPOTENTE DE VIRADA DIÁRIA ---

  private static final java.util.Map<String, String> CANONICAL_ZONE_ALIASES = java.util.Map.ofEntries(
      java.util.Map.entry("Z", "UTC"),
      java.util.Map.entry("GMT", "UTC"),
      java.util.Map.entry("GMT+0", "UTC"),
      java.util.Map.entry("GMT-0", "UTC"),
      java.util.Map.entry("GMT0", "UTC"),
      java.util.Map.entry("Etc/GMT", "UTC"),
      java.util.Map.entry("Etc/GMT+0", "UTC"),
      java.util.Map.entry("Etc/GMT-0", "UTC"),
      java.util.Map.entry("Etc/GMT0", "UTC"),
      java.util.Map.entry("Etc/UTC", "UTC"),
      java.util.Map.entry("Etc/Universal", "UTC"),
      java.util.Map.entry("Etc/Zulu", "UTC"),
      java.util.Map.entry("Universal", "UTC"),
      java.util.Map.entry("Zulu", "UTC"),
      java.util.Map.entry("Asia/Calcutta", "Asia/Kolkata"),
      java.util.Map.entry("Asia/Saigon", "Asia/Ho_Chi_Minh"),
      java.util.Map.entry("Asia/Katmandu", "Asia/Kathmandu"),
      java.util.Map.entry("Asia/Rangoon", "Asia/Yangon"),
      java.util.Map.entry("Europe/Kiev", "Europe/Kyiv"),
      java.util.Map.entry("America/Buenos_Aires", "America/Argentina/Buenos_Aires"),
      java.util.Map.entry("America/Godthab", "America/Nuuk"),
      java.util.Map.entry("Brazil/East", "America/Sao_Paulo"),
      java.util.Map.entry("Brazil/West", "America/Manaus"),
      java.util.Map.entry("US/Eastern", "America/New_York"),
      java.util.Map.entry("US/Central", "America/Chicago"),
      java.util.Map.entry("US/Mountain", "America/Denver"),
      java.util.Map.entry("US/Pacific", "America/Los_Angeles"),
      java.util.Map.entry("US/Hawaii", "Pacific/Honolulu"),
      java.util.Map.entry("US/Alaska", "America/Anchorage"),
      java.util.Map.entry("Africa/Asmera", "Africa/Asmara"),
      java.util.Map.entry("Atlantic/Faeroe", "Atlantic/Faroe"),
      java.util.Map.entry("Pacific/Ponape", "Pacific/Pohnpei"),
      java.util.Map.entry("Pacific/Truk", "Pacific/Chuuk")
  );

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

  public ZoneId resolveZoneId(ZoneId fallback) {
    if (this.timezone != null && !this.timezone.isBlank()) {
      try {
        return ZoneId.of(this.timezone.trim());
      } catch (DateTimeException ignored) {
        // Cai para o fallback seguro caso um valor legado inválido exista
      }
    }
    return fallback != null ? fallback : ZoneId.of(DEFAULT_TIMEZONE);
  }

  public LocalDate resolveLocalDate(Clock baseClock) {
    Clock effectiveClock = baseClock != null ? baseClock : Clock.systemDefaultZone();
    return LocalDate.now(effectiveClock.withZone(resolveZoneId(effectiveClock.getZone())));
  }

  public LocalDateTime resolveLocalDateTime(Clock baseClock) {
    Clock effectiveClock = baseClock != null ? baseClock : Clock.systemDefaultZone();
    return LocalDateTime.now(effectiveClock.withZone(resolveZoneId(effectiveClock.getZone())));
  }

  public void initializeTimezone(String requestedTimezone, Clock baseClock) {
    Clock effectiveClock = baseClock != null ? baseClock : Clock.systemDefaultZone();
    if (requestedTimezone != null && !requestedTimezone.isBlank()) {
      ZoneId zone = parseValidZoneId(requestedTimezone);
      this.timezone = zone.getId();
    } else {
      this.timezone = DEFAULT_TIMEZONE;
    }
    this.timezoneUpdatedAt = null;
    ZoneId effectiveZone = resolveZoneId(effectiveClock.getZone());
    LocalDate userToday = LocalDate.now(effectiveClock.withZone(effectiveZone));
    this.lastDailyResetDate = userToday;
    this.nextDailyResetAt = calculateNextMidnightInstant(userToday, effectiveZone);
  }

  public void changeTimezone(String newTimezone, Clock baseClock) {
    ZoneId newZone = parseValidZoneId(newTimezone);
    ZoneId currentZone = canonicalizeZoneId(resolveZoneId(null));
    if (newZone.equals(currentZone)) {
      return;
    }

    Clock effectiveClock = baseClock != null ? baseClock : Clock.systemDefaultZone();
    Instant now = Instant.now(effectiveClock);
    if (this.timezoneUpdatedAt != null) {
      Instant nextAllowedAt = this.timezoneUpdatedAt.plusSeconds(TIMEZONE_CHANGE_COOLDOWN_HOURS * 3600L);
      if (now.isBefore(nextAllowedAt)) {
        throw new DomainValidationException(
            "Você só pode alterar seu fuso horário manualmente uma vez a cada 24 horas.");
      }
    }

    this.timezone = newZone.getId();
    this.timezoneUpdatedAt = now;

    LocalDate newToday = LocalDate.now(effectiveClock.withZone(newZone));
    LocalDate effectiveResetDate = (this.lastDailyResetDate != null && this.lastDailyResetDate.isAfter(newToday))
        ? this.lastDailyResetDate
        : newToday;
    this.lastDailyResetDate = effectiveResetDate;
    this.nextDailyResetAt = calculateNextMidnightInstant(effectiveResetDate, newZone);
  }

  public boolean shouldRunDailyReset(LocalDate userToday) {
    return this.lastDailyResetDate == null || userToday.isAfter(this.lastDailyResetDate);
  }

  public void markDailyResetExecuted(LocalDate userToday, ZoneId userZone) {
    this.lastDailyResetDate = userToday;
    this.nextDailyResetAt = calculateNextMidnightInstant(userToday, userZone);
  }

  public String getTimezone() {
    return (timezone != null && !timezone.isBlank()) ? timezone : DEFAULT_TIMEZONE;
  }

  public void setTimezone(String timezone) {
    this.timezone = (timezone != null && !timezone.isBlank()) ? timezone.trim() : DEFAULT_TIMEZONE;
  }

  public Instant getTimezoneUpdatedAt() {
    return timezoneUpdatedAt;
  }

  public void setTimezoneUpdatedAt(Instant timezoneUpdatedAt) {
    this.timezoneUpdatedAt = timezoneUpdatedAt;
  }

  public LocalDate getLastDailyResetDate() {
    return lastDailyResetDate;
  }

  public void setLastDailyResetDate(LocalDate lastDailyResetDate) {
    this.lastDailyResetDate = lastDailyResetDate;
  }

  public Instant getNextDailyResetAt() {
    return nextDailyResetAt;
  }

  public void setNextDailyResetAt(Instant nextDailyResetAt) {
    this.nextDailyResetAt = nextDailyResetAt;
  }
}
