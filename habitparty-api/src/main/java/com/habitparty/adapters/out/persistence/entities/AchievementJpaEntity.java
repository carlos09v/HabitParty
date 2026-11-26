package com.habitparty.adapters.out.persistence.entities;

import java.util.UUID;

import com.habitparty.core.domain.enums.AchievementCategory;
import com.habitparty.core.domain.enums.AchievementRarity;

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
@Table(name = "achievements")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(onlyExplicitlyIncluded = true)
public class AchievementJpaEntity extends BaseUuidJpaEntity {

  @Id
  @ToString.Include
  @Column(name = "achievement_id")
  private UUID id;

  @ToString.Include
  @Column(name = "code", nullable = false, unique = true, length = 60)
  private String code;

  @Column(name = "title", nullable = false, length = 120)
  private String title;

  @Column(name = "description", nullable = false, length = 300)
  private String description;

  @Column(name = "icon_name", nullable = false, length = 60)
  private String iconName;

  @Builder.Default
  @Column(name = "points", nullable = false)
  private int points = 10;

  @Enumerated(EnumType.STRING)
  @Column(name = "category", nullable = false, length = 40)
  private AchievementCategory category;

  @Enumerated(EnumType.STRING)
  @Column(name = "rarity", nullable = false, length = 30)
  private AchievementRarity rarity;

  @Builder.Default
  @Column(name = "target_value", nullable = false)
  private int targetValue = 1;

  @Builder.Default
  @Column(name = "display_order", nullable = false)
  private int displayOrder = 0;

  @Builder.Default
  @Column(name = "is_secret", nullable = false)
  private boolean secret = false;
}
