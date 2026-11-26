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
@Table(name = "user_artifacts")
@IdClass(UserArtifactJpaEntity.UserArtifactId.class)
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(onlyExplicitlyIncluded = true)
public class UserArtifactJpaEntity implements Persistable<UserArtifactJpaEntity.UserArtifactId> {

  @Id
  @ToString.Include
  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Id
  @ToString.Include
  @Column(name = "artifact_id", nullable = false)
  private UUID artifactId;

  @Builder.Default
  @Column(name = "obtained_source", nullable = false, length = 40)
  private String obtainedSource = "ACHIEVEMENT";

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
  public UserArtifactId getId() {
    return (userId != null && artifactId != null)
        ? new UserArtifactId(userId, artifactId)
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
    UserArtifactJpaEntity that = (UserArtifactJpaEntity) o;
    return userId != null
        && artifactId != null
        && Objects.equals(userId, that.userId)
        && Objects.equals(artifactId, that.artifactId);
  }

  @Override
  public final int hashCode() {
    return this instanceof HibernateProxy proxy
        ? proxy.getHibernateLazyInitializer().getPersistentClass().hashCode()
        : getClass().hashCode();
  }

  public record UserArtifactId(UUID userId, UUID artifactId) implements Serializable {}
}
