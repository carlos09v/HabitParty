package com.habitparty.core.domain.entities;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.enums.SubscriptionStatus;
import com.habitparty.core.domain.enums.UserExperienceMode;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserLevel;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.exceptions.DomainValidationException;

public class User {
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
  private UserGender gender;
  private UserExperienceMode experienceMode = UserExperienceMode.PRODUCTIVITY;
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
    if (fullName == null || fullName.trim().isEmpty()) {
      throw new DomainValidationException("O nome não pode estar vazio.");
    }
    if (birthDate != null) {
      if (birthDate.isAfter(LocalDate.now())) {
        throw new DomainValidationException("A data de nascimento deve estar no passado.");
      }
      int age = Period.between(birthDate, LocalDate.now()).getYears();
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
    if (this.birthDate == null)
      return null;
    return Period.between(this.birthDate, LocalDate.now()).getYears();
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

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }
}
