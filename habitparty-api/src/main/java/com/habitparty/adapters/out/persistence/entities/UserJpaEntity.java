package com.habitparty.adapters.out.persistence.entities;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import com.habitparty.core.domain.enums.UserExperienceMode;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserJpaEntity {
  @Id
  @Column(name = "user_id")
  private UUID id;

  @Enumerated(EnumType.STRING)
  @Column(name = "role", nullable = false)
  private UserRole role;

  @Column(nullable = false, length = 150, name = "full_name")
  private String fullName;

  @Column(unique = true, nullable = false)
  private String username;

  @Column(unique = true, nullable = false)
  private String email;

  @Column(nullable = false)
  private String password;

  @Column(name = "email_verified", nullable = false, columnDefinition = "boolean default false")
  private boolean emailVerified = false;

  @Column(name = "email_verified_at")
  private LocalDateTime emailVerifiedAt;

  @Column(name = "profile_photo_url")
  private String profilePhotoUrl;

  @Column(name = "bio", length = 160)
  private String bio;

  @Column(name = "avatar_frame", nullable = false, length = 40, columnDefinition = "varchar(40) default 'none'")
  private String avatarFrame = "none";

  @Column(name = "theme", nullable = false, length = 40, columnDefinition = "varchar(40) default 'dark'")
  private String theme = "dark";

  @Column(name = "birth_date", nullable = true)
  private LocalDate birthDate;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private UserGender gender;

  @Enumerated(EnumType.STRING)
  @Column(name = "experience_mode", nullable = false, length = 30, columnDefinition = "varchar(30) default 'PRODUCTIVITY'")
  private UserExperienceMode experienceMode = UserExperienceMode.PRODUCTIVITY;

  @Column(name = "timezone", nullable = false, length = 64, columnDefinition = "varchar(64) default 'America/Sao_Paulo'")
  private String timezone = "America/Sao_Paulo";

  @Column(name = "timezone_updated_at")
  private Instant timezoneUpdatedAt;

  @Column(name = "last_daily_reset_date")
  private LocalDate lastDailyResetDate;

  @Column(name = "next_daily_reset_at")
  private Instant nextDailyResetAt;

  @Column(name = "created_at", nullable = false, updatable = false)
  @CreationTimestamp
  private LocalDateTime createdAt;

  @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  private UserStatsJpaEntity stats;

  @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  private UserSubscriptionJpaEntity subscription;

  public void setStats(UserStatsJpaEntity stats) {
    this.stats = stats;
    if (stats != null) {
      stats.setUser(this);
      stats.setUserId(this.id);
    }
  }

  public void setSubscription(UserSubscriptionJpaEntity subscription) {
    this.subscription = subscription;
    if (subscription != null) {
      subscription.setUser(this);
      subscription.setUserId(this.id);
    }
  }
}
