package com.habitparty.core.domain.entities;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserLevel;

public class User {
  private UUID id;
  private String fullName;
  private String username;
  private String email;
  private String password;
  private BigDecimal currentCoins;
  private BigDecimal totalGoldEarned;
  private LocalDate birthday;
  private String profilePhotoUrl;
  private UserGender gender;
  private int totalXp;
  private int currentStreak;
  private int highestStreak;
  private LocalDateTime createdAt; // Esta sendo definida por ser uma informação relevante pra regra de negócio (vai ser usada)
  // Tudo definido aqui deve ir pra Entity!

  // Construtor no Java
  public User(UUID id, String fullName, String username, String email, String password, BigDecimal currentCoins,
      BigDecimal totalGoldEarned,
      LocalDate birthday, String profilePhotoUrl, UserGender gender, int totalXp, int currentStreak, int highestStreak,
      LocalDateTime createdAt) {
    this.id = id;
    this.fullName = fullName;
    this.username = username;
    this.email = email;
    this.password = password;
    this.currentCoins = currentCoins;
    this.totalGoldEarned = totalGoldEarned;
    this.birthday = birthday;
    this.profilePhotoUrl = profilePhotoUrl;
    this.gender = gender;
    this.totalXp = totalXp;
    this.currentStreak = currentStreak;
    this.highestStreak = highestStreak;
    this.createdAt = createdAt;
  }

  public UserLevel getCurrentLevel() {
    return UserLevel.calculateLevel(this.totalXp);
  }

  public UserLevel getNextLevel() {
    return getCurrentLevel().getNextLevel();
  }

  // Calcula quantos XP faltam para o próximo nível
  public int getXpToNextLevel() {
    UserLevel nextLevel = getNextLevel();
    if (this.getCurrentLevel() == nextLevel) {
      return 0; // Já está no nível máximo
    }
    return nextLevel.getMinXpRequired() - this.totalXp;
  }

  // Calcula a idade atual
  public int getAge() {
    if (this.birthday == null) {
      return 0; // Proteção extra, caso falte no banco
    }
    // Period.between calcula a diferença exata considerando anos bissextos, meses e dias
    return Period.between(this.birthday, LocalDate.now()).getYears();
  }

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
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

  public BigDecimal getCurrentCoins() {
    return currentCoins;
  }

  public void setCurrentCoins(BigDecimal currentCoins) {
    this.currentCoins = currentCoins;
  }

  public BigDecimal getTotalGoldEarned() {
    return totalGoldEarned;
  }

  public void setTotalGoldEarned(BigDecimal totalGoldEarned) {
    this.totalGoldEarned = totalGoldEarned;
  }

  public LocalDate getBirthday() {
    return birthday;
  }

  public void setBirthday(LocalDate birthday) {
    this.birthday = birthday;
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

  public int getTotalXp() {
    return totalXp;
  }

  public void setTotalXp(int totalXp) {
    this.totalXp = totalXp;
  }

  public int getCurrentStreak() {
    return currentStreak;
  }

  public void setCurrentStreak(int currentStreak) {
    this.currentStreak = currentStreak;
  }

  public int getHighestStreak() {
    return highestStreak;
  }

  public void setHighestStreak(int highestStreak) {
    this.highestStreak = highestStreak;
  }

}
