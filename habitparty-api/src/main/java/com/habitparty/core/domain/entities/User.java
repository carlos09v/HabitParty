package com.habitparty.core.domain.entities;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import com.habitparty.core.domain.entities.achievement.CosmeticCatalog;
import com.habitparty.core.domain.entities.achievement.CosmeticCatalog.CosmeticUnlockContext;
import com.habitparty.core.domain.entities.user.FriendCode;
import com.habitparty.core.domain.entities.user.OnboardingPreferences;
import com.habitparty.core.domain.entities.user.PrivacySettings;
import com.habitparty.core.domain.entities.user.UserTimezonePolicy;
import com.habitparty.core.domain.enums.FriendRequestPolicy;
import com.habitparty.core.domain.enums.PrivacyLevel;
import com.habitparty.core.domain.enums.SubscriptionStatus;
import com.habitparty.core.domain.enums.UserExperienceMode;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserLevel;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.exceptions.DomainValidationException;

public class User {
  public static final String DEFAULT_TIMEZONE = UserTimezonePolicy.DEFAULT_TIMEZONE;
  public static final long TIMEZONE_CHANGE_COOLDOWN_HOURS = UserTimezonePolicy.TIMEZONE_CHANGE_COOLDOWN_HOURS;
  public static final String DEFAULT_THEME = "dark";
  public static final String DEFAULT_LIGHT_THEME = "light";
  public static final Set<String> LIGHT_THEMES = Set.of(
      "light",
      "solar-parchment",
      "royal-gold"
  );
  public static final Set<String> FREE_THEMES = Set.of(
      "dark",
      "light",
      "dark-knight",
      "solar-parchment"
  );
  public static final Set<String> PREMIUM_THEMES = Set.of(
      "cyberpunk-neon",
      "forest-ranger",
      "royal-gold"
  );
  public static final Set<String> VALID_THEMES = Stream.concat(
      FREE_THEMES.stream(),
      PREMIUM_THEMES.stream()
  ).collect(Collectors.toUnmodifiableSet());
  public static final Set<String> VALID_AVATAR_FRAMES = CosmeticCatalog.VALID_AVATAR_FRAMES;

  private UUID id;
  private UserRole role;
  private String fullName;
  private String username;
  private String email;
  private String password;
  private boolean hasPassword = true;
  private boolean emailVerified;
  private LocalDateTime emailVerifiedAt;
  private LocalDate birthDate;
  private String profilePhotoUrl;
  private String bio;
  private String avatarFrame = "none";
  private String equippedTitle;
  private String avatarPreset;
  private String theme = DEFAULT_THEME;
  private UserGender gender;
  private UserExperienceMode experienceMode = UserExperienceMode.PRODUCTIVITY;
  private String timezone = DEFAULT_TIMEZONE;
  private Instant timezoneUpdatedAt;
  private LocalDate lastDailyResetDate;
  private Instant nextDailyResetAt;
  private LocalDateTime createdAt;

  // Social & Privacidade (v1.4)
  private String friendCode;
  private PrivacySettings privacySettings = PrivacySettings.DEFAULT;

  // Preferências coletadas no FirstStep (v1.6)
  private OnboardingPreferences onboardingPreferences = OnboardingPreferences.EMPTY;

  // Sub-entidades do Agregado (1:1 com PK compartilhada no banco)
  private UserStats stats;
  private UserSubscription subscription;

  /**
   * Factory coesa para criação de novas contas (cadastro tradicional ou OAuth),
   * evitando duplicação da montagem inicial de {@link UserStats}, {@link UserSubscription} e timezone.
   */
  public static User createNew(
      String fullName,
      String username,
      String email,
      String encodedPassword,
      boolean hasPassword,
      boolean emailVerified,
      LocalDate birthDate,
      String profilePhotoUrl,
      UserGender gender,
      String requestedTimezone,
      Clock clock) {
    Clock effectiveClock = clock != null ? clock : Clock.system(ZoneId.of(DEFAULT_TIMEZONE));
    LocalDateTime createdAtUtc = LocalDateTime.now(effectiveClock.withZone(java.time.ZoneOffset.UTC));
    UUID newUserId = UUID.randomUUID();
    String normalizedEmail = email != null ? email.trim().toLowerCase(Locale.ROOT) : null;

    User newUser = new User(
        newUserId,
        UserRole.USER,
        fullName,
        username,
        normalizedEmail,
        encodedPassword,
        emailVerified,
        emailVerified ? createdAtUtc : null,
        birthDate,
        profilePhotoUrl,
        gender,
        UserExperienceMode.PRODUCTIVITY,
        createdAtUtc,
        UserStats.createInitial(newUserId),
        UserSubscription.createInitial(newUserId));
    newUser.setHasPassword(hasPassword);
    newUser.initializeTimezone(requestedTimezone, effectiveClock);
    return newUser;
  }

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

  public void resetStats() {
    this.stats = UserStats.createInitial(this.id);
  }

  public void resetShowcaseCosmetics() {
    this.bio = null;
    this.avatarFrame = "none";
    this.equippedTitle = null;
    this.avatarPreset = null;
  }

  /**
   * Revalida cosméticos equipados após reset de métricas, removendo apenas itens
   * vinculados a conquistas, nível/XP, coleção de artefatos ou histórico excluído.
   */
  public void revalidateShowcaseCosmeticsAfterMetricsReset(boolean historyDeleted) {
    if (CosmeticCatalog.shouldResetFrameOnMetricsReset(this.avatarFrame)) {
      this.avatarFrame = "none";
    }
    if (CosmeticCatalog.shouldResetTitleOnMetricsReset(this.equippedTitle, historyDeleted)) {
      this.equippedTitle = null;
    }
    if (CosmeticCatalog.shouldResetAvatarPresetOnMetricsReset(this, this.avatarPreset)) {
      this.avatarPreset = null;
    }
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

  public boolean incrementStreakForDate(LocalDate streakDate) {
    return stats.incrementStreakForDate(streakDate);
  }

  public boolean revertTodayStreakIncrement(LocalDate todayDate) {
    return stats.revertTodayStreakIncrement(todayDate);
  }

  public LocalDate getLastStreakDate() {
    return stats.getLastStreakDate();
  }

  public void setLastStreakDate(LocalDate lastStreakDate) {
    stats.setLastStreakDate(lastStreakDate);
  }

  public void resetStreak() {
    stats.resetStreak();
  }

  public SubscriptionStatus getEffectiveSubscriptionStatus() {
    return subscription.getEffectiveSubscriptionStatus();
  }

  public boolean isCancelAtPeriodEnd() {
    return subscription.isCancelAtPeriodEnd();
  }

  public LocalDateTime getPrepaidEndsAt() {
    return subscription.getPrepaidEndsAt();
  }

  public void syncActiveSubscription(
      String customerId,
      String subscriptionId,
      LocalDateTime endsAt,
      boolean cancelAtPeriodEnd) {
    subscription.syncActiveSubscription(customerId, subscriptionId, endsAt, cancelAtPeriodEnd);
  }

  public void revokeOnPaymentFailure(SubscriptionStatus targetStatus) {
    subscription.revokeOnPaymentFailure(targetStatus);
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

  public boolean hasCancelableStripeSubscription() {
    return subscription.hasCancelableStripeSubscription();
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
    if (photoUrl != null && !photoUrl.isBlank()) {
      this.avatarPreset = null;
    }
  }

  public void updateOnboardingPreferences(
      String usageMode,
      List<String> primaryGoals,
      String mainObstacle,
      Integer dailyFocusGoalMinutes,
      String peakPeriod,
      String disciplineStyle) {
    this.onboardingPreferences = this.onboardingPreferences.update(
        usageMode,
        primaryGoals,
        mainObstacle,
        dailyFocusGoalMinutes,
        peakPeriod,
        disciplineStyle);
  }

  public OnboardingPreferences getOnboardingPreferences() {
    return onboardingPreferences;
  }

  public PrivacySettings getPrivacySettings() {
    return privacySettings;
  }

  public void updatePassword(String newHashedPassword) {
    if (newHashedPassword == null || newHashedPassword.isEmpty()) {
      throw new DomainValidationException("A senha não pode ser nula.");
    }
    this.password = newHashedPassword;
    this.hasPassword = true;
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

  public boolean hasPassword() {
    return hasPassword;
  }

  public void setHasPassword(boolean hasPassword) {
    this.hasPassword = hasPassword;
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

  public Optional<String> getEquippedTitle() {
    return Optional.ofNullable(equippedTitle).filter(t -> !t.isBlank());
  }

  public void setEquippedTitle(String equippedTitle) {
    this.equippedTitle = (equippedTitle != null && !equippedTitle.isBlank())
        ? equippedTitle.trim().toUpperCase(Locale.ROOT)
        : null;
  }

  public Optional<String> getAvatarPreset() {
    return Optional.ofNullable(avatarPreset).filter(p -> !p.isBlank());
  }

  public void setAvatarPreset(String avatarPreset) {
    this.avatarPreset = (avatarPreset != null && !avatarPreset.isBlank())
        ? avatarPreset.trim().toLowerCase(Locale.ROOT)
        : null;
  }

  public static boolean isPremiumTheme(String themeId) {
    return themeId != null && PREMIUM_THEMES.contains(themeId.trim().toLowerCase(Locale.ROOT));
  }

  public static String getFallbackThemeForPolarity(String themeId) {
    if (themeId != null && LIGHT_THEMES.contains(themeId.trim().toLowerCase(Locale.ROOT))) {
      return DEFAULT_LIGHT_THEME;
    }
    return DEFAULT_THEME;
  }

  public String getTheme() {
    return (theme != null && !theme.isBlank()) ? theme.trim().toLowerCase(Locale.ROOT) : DEFAULT_THEME;
  }

  public void setTheme(String theme) {
    this.theme = (theme != null && !theme.isBlank()) ? theme.trim().toLowerCase(Locale.ROOT) : DEFAULT_THEME;
  }

  public String getEffectiveTheme() {
    String current = getTheme();
    if (!VALID_THEMES.contains(current)) {
      return DEFAULT_THEME;
    }
    if (PREMIUM_THEMES.contains(current) && !this.isPremium()) {
      return getFallbackThemeForPolarity(current);
    }
    return current;
  }

  public void updateTheme(String newTheme) {
    if (newTheme == null || newTheme.isBlank()) {
      throw new DomainValidationException("O tema visual não pode estar vazio.");
    }
    String cleanTheme = newTheme.trim().toLowerCase(Locale.ROOT);
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
    updateShowcaseProfile(bio, avatarFrame, null, null, CosmeticUnlockContext.empty());
  }

  public void updateShowcaseProfile(
      String bio,
      String avatarFrame,
      String equippedTitle,
      String avatarPreset,
      CosmeticUnlockContext unlockContext) {
    if (bio != null) {
      setBio(bio);
    }
    if (avatarFrame != null && !avatarFrame.isBlank()) {
      this.avatarFrame = CosmeticCatalog.normalizeAndValidateFrame(this, avatarFrame, unlockContext);
    }
    if (equippedTitle != null) {
      this.equippedTitle = equippedTitle.isBlank()
          ? null
          : CosmeticCatalog.normalizeAndValidateTitle(this, equippedTitle, unlockContext);
    }
    if (avatarPreset != null) {
      this.avatarPreset = avatarPreset.isBlank()
          ? null
          : CosmeticCatalog.normalizeAndValidateAvatarPreset(this, avatarPreset);
    }
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  // --- FUSO HORÁRIO E CONTROLE IDEMPOTENTE DE VIRADA DIÁRIA (delegado a UserTimezonePolicy) ---

  public static ZoneId canonicalizeZoneId(ZoneId zone) {
    return UserTimezonePolicy.canonicalizeZoneId(zone);
  }

  public static boolean areTimezonesEquivalent(String first, String second) {
    return UserTimezonePolicy.areTimezonesEquivalent(first, second);
  }

  public static ZoneId parseValidZoneId(String rawTimezone) {
    return UserTimezonePolicy.parseValidZoneId(rawTimezone);
  }

  public static Instant calculateNextMidnightInstant(LocalDate referenceDate, ZoneId zone) {
    return UserTimezonePolicy.calculateNextMidnightInstant(referenceDate, zone);
  }

  public ZoneId resolveZoneId(ZoneId fallback) {
    return UserTimezonePolicy.resolveZoneId(this.timezone, fallback);
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
    if (this.lastDailyResetDate != null && newToday.isAfter(this.lastDailyResetDate)) {
      // Mantém lastDailyResetDate no ciclo anterior e marca vencimento imediato para que o rollover
      // processe legitimamente a virada do dia sem pular multas Hardcore nem quebras de streak.
      this.nextDailyResetAt = now;
      return;
    }

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

  public static String generateRandomFriendCode() {
    return FriendCode.generateRandom();
  }

  public static String normalizeFriendCode(String raw) {
    return FriendCode.normalize(raw);
  }

  public void assignFriendCodeIfMissing() {
    if (this.friendCode == null || this.friendCode.isBlank()) {
      this.friendCode = FriendCode.generateRandom();
    }
  }

  public void updatePrivacySettings(
      PrivacyLevel profileVisibility,
      PrivacyLevel statsVisibility,
      PrivacyLevel achievementsVisibility,
      FriendRequestPolicy friendRequestPolicy) {
    this.privacySettings = this.privacySettings.update(
        profileVisibility,
        statsVisibility,
        achievementsVisibility,
        friendRequestPolicy);
  }

  public String getFriendCode() {
    return friendCode;
  }

  public void setFriendCode(String friendCode) {
    this.friendCode = FriendCode.normalize(friendCode);
  }

  public PrivacyLevel getProfileVisibility() {
    return privacySettings.profileVisibility();
  }

  public void setProfileVisibility(PrivacyLevel profileVisibility) {
    this.privacySettings = this.privacySettings.withProfileVisibility(profileVisibility);
  }

  public PrivacyLevel getStatsVisibility() {
    return privacySettings.statsVisibility();
  }

  public void setStatsVisibility(PrivacyLevel statsVisibility) {
    this.privacySettings = this.privacySettings.withStatsVisibility(statsVisibility);
  }

  public PrivacyLevel getAchievementsVisibility() {
    return privacySettings.achievementsVisibility();
  }

  public void setAchievementsVisibility(PrivacyLevel achievementsVisibility) {
    this.privacySettings = this.privacySettings.withAchievementsVisibility(achievementsVisibility);
  }

  public FriendRequestPolicy getFriendRequestPolicy() {
    return privacySettings.friendRequestPolicy();
  }

  public void setFriendRequestPolicy(FriendRequestPolicy friendRequestPolicy) {
    this.privacySettings = this.privacySettings.withFriendRequestPolicy(friendRequestPolicy);
  }

  public String getUsageMode() {
    return onboardingPreferences.usageMode();
  }

  public void setUsageMode(String usageMode) {
    this.onboardingPreferences = this.onboardingPreferences.withUsageMode(usageMode);
  }

  public List<String> getPrimaryGoals() {
    return onboardingPreferences.primaryGoals();
  }

  public void setPrimaryGoals(List<String> primaryGoals) {
    this.onboardingPreferences = this.onboardingPreferences.withPrimaryGoals(primaryGoals);
  }

  public String getMainObstacle() {
    return onboardingPreferences.mainObstacle();
  }

  public void setMainObstacle(String mainObstacle) {
    this.onboardingPreferences = this.onboardingPreferences.withMainObstacle(mainObstacle);
  }

  public Integer getDailyFocusGoalMinutes() {
    return onboardingPreferences.dailyFocusGoalMinutes();
  }

  public void setDailyFocusGoalMinutes(Integer dailyFocusGoalMinutes) {
    this.onboardingPreferences = this.onboardingPreferences.withDailyFocusGoalMinutes(dailyFocusGoalMinutes);
  }

  public String getPeakPeriod() {
    return onboardingPreferences.peakPeriod();
  }

  public void setPeakPeriod(String peakPeriod) {
    this.onboardingPreferences = this.onboardingPreferences.withPeakPeriod(peakPeriod);
  }

  public String getDisciplineStyle() {
    return onboardingPreferences.disciplineStyle();
  }

  public void setDisciplineStyle(String disciplineStyle) {
    this.onboardingPreferences = this.onboardingPreferences.withDisciplineStyle(disciplineStyle);
  }
}
