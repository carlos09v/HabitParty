package com.habitparty.adapters.out.persistence.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.habitparty.core.domain.enums.RewardCategory;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "rewards")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RewardJpaEntity {
  @Id
  // @GeneratedValue(strategy = GenerationType.UUID) => O usecase que irá gerar
  @Column(name = "reward_id")
  private UUID id;

  // Relacionamento N:1 (Muitos rewards pertencem a 1 User)
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private UserJpaEntity user;

  @Column(nullable = false, length = 30)
  private String name;

  @Column(length = 20)
  private String icon;

  @Column(length = 140)
  private String description;

  @Column(name = "order_index", nullable = false)
  private int orderIndex;

  @Column(nullable = false)
  private BigDecimal price;

  // Coluna nativa do Postegre chamada Array (text[])
  @JdbcTypeCode(SqlTypes.ARRAY)
  @Column(name = "tags", columnDefinition = "text[]")
  private List<String> tags = new ArrayList<>();

  @Enumerated(EnumType.STRING)
  @Column(name = "reward_type", nullable = false)
  private RewardType type;

  @Enumerated(EnumType.STRING)
  @Column(name = "category")
  private RewardCategory category;

  @Enumerated(EnumType.STRING)
  @Column(name = "package_level")
  private RewardPackageLevel packageLevel;

  @Column(name = "base_duration_minutes")
  private Integer baseDurationMinutes;

  @Column(name = "created_at", nullable = false, updatable = false)
  @CreationTimestamp
  private LocalDateTime createdAt;
}
