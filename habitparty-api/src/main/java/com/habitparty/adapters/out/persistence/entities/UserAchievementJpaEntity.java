package com.habitparty.adapters.out.persistence.entities;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

import org.hibernate.proxy.HibernateProxy;
import org.springframework.data.domain.Persistable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "user_achievements")
@IdClass(UserAchievementJpaEntity.UserAchievementId.class)
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(onlyExplicitlyIncluded = true)
public class UserAchievementJpaEntity implements Persistable<UserAchievementJpaEntity.UserAchievementId> {

  @Id
  @ToString.Include
  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Id
  @ToString.Include
  @Column(name = "achievement_id", nullable = false)
  private UUID achievementId;

  @Column(name = "unlocked_at", nullable = false)
  private LocalDateTime unlockedAt;

  @Builder.Default
  @Column(name = "is_seen", nullable = false)
  private boolean seen = false;

  @Transient
  @Builder.Default
  @Setter(AccessLevel.NONE)
  private boolean isNew = true;

  @Override
  public UserAchievementId getId() {
    return (userId != null && achievementId != null)
        ? new UserAchievementId(userId, achievementId)
        : null;
  }

  @PostLoad
  @PostPersist
  protected void markNotNew() {
    this.isNew = false;
  }

  public void markAsExisting() {
    this.isNew = false;
  }

  @Override
  public final boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null) {
      return false;
    }
    Class<?> oEffectiveClass = o instanceof HibernateProxy proxy
        ? proxy.getHibernateLazyInitializer().getPersistentClass()
        : o.getClass();
    Class<?> thisEffectiveClass = this instanceof HibernateProxy proxy
        ? proxy.getHibernateLazyInitializer().getPersistentClass()
        : this.getClass();
    if (thisEffectiveClass != oEffectiveClass) {
      return false;
    }
    UserAchievementJpaEntity that = (UserAchievementJpaEntity) o;
    return userId != null
        && achievementId != null
        && Objects.equals(userId, that.userId)
        && Objects.equals(achievementId, that.achievementId);
  }

  @Override
  public final int hashCode() {
    return this instanceof HibernateProxy proxy
        ? proxy.getHibernateLazyInitializer().getPersistentClass().hashCode()
        : getClass().hashCode();
  }

  public record UserAchievementId(UUID userId, UUID achievementId) implements Serializable {}
}
