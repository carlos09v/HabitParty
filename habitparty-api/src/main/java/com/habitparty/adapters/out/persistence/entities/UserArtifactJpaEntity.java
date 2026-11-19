package com.habitparty.adapters.out.persistence.entities;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_artifacts")
@IdClass(UserArtifactJpaEntity.UserArtifactId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserArtifactJpaEntity {

  @Id
  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Id
  @Column(name = "artifact_id", nullable = false)
  private UUID artifactId;

  @Column(name = "obtained_source", nullable = false, length = 40)
  private String obtainedSource = "ACHIEVEMENT";

  @Column(name = "unlocked_at", nullable = false)
  private LocalDateTime unlockedAt = LocalDateTime.now();

  @Column(name = "is_seen", nullable = false)
  private boolean seen = false;

  @Getter
  @Setter
  @NoArgsConstructor
  @AllArgsConstructor
  public static class UserArtifactId implements Serializable {
    private UUID userId;
    private UUID artifactId;

    @Override
    public boolean equals(Object o) {
      if (this == o) return true;
      if (o == null || getClass() != o.getClass()) return false;
      UserArtifactId that = (UserArtifactId) o;
      return Objects.equals(userId, that.userId) && Objects.equals(artifactId, that.artifactId);
    }

    @Override
    public int hashCode() {
      return Objects.hash(userId, artifactId);
    }
  }
}
