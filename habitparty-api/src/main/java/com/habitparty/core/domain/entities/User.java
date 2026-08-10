package com.habitparty.core.domain.entities;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.Optional;
import java.util.UUID;

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
  public User(UUID id, UserRole role, String fullName, String username, String email, String password,
      BigDecimal currentCoins,
      BigDecimal totalGoldEarned,
      LocalDate birthday, String profilePhotoUrl, UserGender gender, int totalXp, int currentStreak, int highestStreak,
      LocalDateTime createdAt) {
    this.id = id;
    this.role = role != null ? role : UserRole.USER;
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
    UserLevel[] allLevels = UserLevel.values();
    UserLevel levelCalculado = allLevels[0]; // Começa no nível mais baixo (Nível 1)

    for (UserLevel level : allLevels) {
      // Se o totalXp do usuário for maior ou igual ao exigido por este nível, ele assume este nível
      if (this.totalXp >= level.getMinXpRequired()) {
        levelCalculado = level;
      } else {
        // Como os Enums geralmente estão em ordem, se ele não tem XP para este, ele também não tem para os próximos. Pode parar a busca.
        break;
      }
    }
    return levelCalculado;
  }

  public UserLevel getNextLevel() {
    UserLevel current = getCurrentLevel();
    UserLevel[] allLevels = UserLevel.values();

    // Verifica a posição do nível atual no Enum
    int currentIndex = current.ordinal();

    // Se não for o último nível do jogo, retorna o próximo
    if (currentIndex < allLevels.length - 1) {
      return allLevels[currentIndex + 1];
    }

    // Se for o nível máximo, retorna ele mesmo
    return current;
  }

  public void addXp(int xpToAdd) {
    if (xpToAdd <= 0) {
      throw new DomainValidationException("O XP a ser adicionado deve ser maior que zero.");
    }
    // Apenas soma o XP. O nível se atualiza "sozinho" através dos métodos abaixo!
    this.totalXp += xpToAdd;
  }

  // Calcula quantos XP faltam para o próximo nível
  // O frontend usa isso para desenhar a "barrinha de progresso" preenchendo até o final.
  public int getXpToNextLevel() {
    UserLevel nextLevel = getNextLevel();
    if (this.getCurrentLevel() == nextLevel) {
      return 0; // Já está no nível máximo
    }
    return nextLevel.getMinXpRequired() - this.totalXp;
  }

  // --- LÓGICA DE OFENSIVA (STREAK) ---
  public void incrementStreak() {
    this.currentStreak += 1;

    // Se a ofensiva atual superou o recorde do usuário, atualiza o recorde
    if (this.currentStreak > this.highestStreak) {
      this.highestStreak = this.currentStreak;
    }
  }

  public void resetStreak() {
    // Essa é a penalidade por ficar 1 dia sem completar tarefas
    this.currentStreak = 0;
  }

  // Compra do Reward
  public void spendMoney(BigDecimal amountToSpend) {
    if (amountToSpend == null || amountToSpend.compareTo(BigDecimal.ZERO) < 0) {
      throw new DomainValidationException("Valor de cobrança inválido.");
    }

    // Se o saldo atual for MENOR que o preço da recompensa...
    if (this.currentCoins.compareTo(amountToSpend) < 0) {
      throw new DomainValidationException("Você não tem moedas suficientes para resgatar esta recompensa.");
    }

    // Se passou, subtrai o dinheiro.
    this.currentCoins = this.currentCoins.subtract(amountToSpend);
  }

  // --- ATUALIZAÇÃO DE PERFIL ---
  public void updateProfile(String fullName, LocalDate birthday, UserGender gender) {
    if (fullName == null || fullName.trim().isEmpty()) {
      throw new DomainValidationException("O nome não pode estar vazio.");
    }
    this.fullName = fullName;
    this.birthday = birthday;
    this.gender = gender;
  }

  // Método dinâmico que não vai pro banco, só devolve pro Frontend!
  public Integer getAge() {
    if (this.birthday == null)
      return null;
    return Period.between(this.birthday, LocalDate.now()).getYears();
  }

  // --- ATUALIZAÇÃO DE FOTO E SENHA ---
  public void updateProfilePhoto(String photoUrl) {
    this.profilePhotoUrl = photoUrl;
  }

  public void updatePassword(String newHashedPassword) {
    if (newHashedPassword == null || newHashedPassword.isEmpty()) {
      throw new DomainValidationException("A senha não pode ser nula.");
    }
    this.password = newHashedPassword; // A senha já chega criptografada do UseCase
  }

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
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
