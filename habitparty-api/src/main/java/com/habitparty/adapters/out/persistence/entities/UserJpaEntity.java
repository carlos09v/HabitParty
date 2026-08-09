package com.habitparty.adapters.out.persistence.entities;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import com.habitparty.core.domain.enums.UserGender;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Usando o Lambok pra gerar Getters e Setters
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor // Cria aquele construtor vazio que o JPA obriga a ter
@AllArgsConstructor // Cria um construtor com todos os campos
public class UserJpaEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "user_id")
  private UUID id;

  @Column(nullable = false, length = 150, name = "full_name")
  private String fullName;

  @Column(unique = true, nullable = false)
  private String username;

  @Column(unique = true, nullable = false)
  private String email;

  @Column(nullable = false)
  private String password;

  @Column(nullable = false, name = "current_coins", columnDefinition = "decimal(10,2) default 0.00")
  private BigDecimal currentCoins;

  @Column(nullable = false, name = "total_gold_earned", columnDefinition = "decimal(10,2) default 0.00")
  private BigDecimal totalGoldEarned;

  @Column(name = "profile_photo_url")
  private String profilePhotoUrl;

  @Column(nullable = false)
  private LocalDate birthday;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private UserGender gender;

  @Column(name = "total_xp", nullable = false, columnDefinition = "int default 0")
  private int totalXp;

  @Column(name = "current_streak", nullable = false, columnDefinition = "int default 0")
  private int currentStreak;

  @Column(name = "highest_streak", nullable = false, columnDefinition = "int default 0")
  private int highestStreak;  

  @Column(name = "created_at", nullable = false, updatable = false)
  @CreationTimestamp
  private LocalDateTime createdAt;
}
