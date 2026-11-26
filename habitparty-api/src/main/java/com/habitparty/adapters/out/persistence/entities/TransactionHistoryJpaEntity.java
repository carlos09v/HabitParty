package com.habitparty.adapters.out.persistence.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.domain.enums.task.TaskDifficulty;

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
@Table(name = "transaction_history")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(onlyExplicitlyIncluded = true)
public class TransactionHistoryJpaEntity extends BaseUuidJpaEntity {

  @Id
  @ToString.Include
  @Column(name = "transaction_history_id")
  private UUID id;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @ToString.Include
  @Enumerated(EnumType.STRING)
  @Column(name = "transaction_type", nullable = false)
  private TransactionType transactionType;

  @Column(name = "reference_id")
  private UUID referenceId;

  @Column(name = "name_snapshot", nullable = false)
  private String nameSnapshot;

  @Column(name = "gold_amount", precision = 10, scale = 2)
  private BigDecimal goldAmount;

  @Column(name = "xp_amount")
  private Integer xpAmount;

  @Column(name = "price_snapshot", precision = 10, scale = 2)
  private BigDecimal priceSnapshot;

  @Column(name = "icon_snapshot")
  private String iconSnapshot;

  @Enumerated(EnumType.STRING)
  @Column(name = "difficulty_snapshot")
  private TaskDifficulty difficultySnapshot;

  @Enumerated(EnumType.STRING)
  @Column(name = "package_level_snapshot")
  private RewardPackageLevel packageLevelSnapshot;

  @Builder.Default
  @JdbcTypeCode(SqlTypes.ARRAY)
  @Column(name = "tags_snapshot", columnDefinition = "text[]")
  private List<String> tagsSnapshot = new ArrayList<>();

  @Column(name = "column_name_snapshot")
  private String columnNameSnapshot;

  @Column(name = "description_snapshot", length = 500)
  private String descriptionSnapshot;

  @Column(name = "checklist_completed_snapshot")
  private Boolean checklistCompletedSnapshot;

  @Column(name = "effort_units_snapshot")
  private Integer effortUnitsSnapshot;

  @Builder.Default
  @Column(name = "hidden_from_history", nullable = false, columnDefinition = "boolean default false")
  private boolean hiddenFromHistory = false;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;
}
