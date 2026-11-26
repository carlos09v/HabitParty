package com.habitparty.adapters.out.persistence.entities;

import java.util.UUID;

import com.habitparty.core.domain.enums.AchievementRarity;
import com.habitparty.core.domain.enums.ArtifactSourceType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "artifacts")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(onlyExplicitlyIncluded = true)
public class ArtifactJpaEntity extends BaseUuidJpaEntity {

  @Id
  @ToString.Include
  @Column(name = "artifact_id")
  private UUID id;

  @ToString.Include
  @Column(name = "code", nullable = false, unique = true, length = 60)
  private String code;

  @Column(name = "icon_name", nullable = false, length = 60)
  private String iconName;

  @Enumerated(EnumType.STRING)
  @Column(name = "rarity", nullable = false, length = 30)
  private AchievementRarity rarity;

  @Enumerated(EnumType.STRING)
  @Column(name = "source_type", nullable = false, length = 30)
  private ArtifactSourceType sourceType;

  @Column(name = "required_achievement_code", length = 60)
  private String requiredAchievementCode;

  @Builder.Default
  @Column(name = "display_order", nullable = false)
  private int displayOrder = 0;
}
