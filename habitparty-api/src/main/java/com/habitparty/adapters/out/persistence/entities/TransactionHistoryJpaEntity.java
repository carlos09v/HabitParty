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
@Table(name = "transaction_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TransactionHistoryJpaEntity {
  @Id
  // Gerado pelo dominio
  @Column(name = "transaction_history_id")
  private UUID id;

  // Relacionamento forte apenas com o usuário (dono do histórico)
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private UserJpaEntity user;

  @Enumerated(EnumType.STRING)
  @Column(name = "transaction_type", nullable = false)
  private TransactionType transactionType;

  // === SOFT-LINKS (Sem relacionamentos do Hibernate, apenas os UUIDs) ===
  @Column(name = "reference_id")
  private UUID referenceId;

  // === SNAPSHOTS E DADOS FINANCEIROS ===
  @Column(name = "name_snapshot", nullable = false)
  private String nameSnapshot;

  @Column(name = "gold_amount")
  private BigDecimal goldAmount;

  @Column(name = "xp_amount")
  private Integer xpAmount;

  @Column(name = "price_snapshot")
  private BigDecimal priceSnapshot;

  @Column(name = "icon_snapshot")
  private String iconSnapshot;

  @Enumerated(EnumType.STRING)
  @Column(name = "difficulty_snapshot")
  private TaskDifficulty difficultySnapshot;

  @Enumerated(EnumType.STRING)
  @Column(name = "package_level_snapshot")
  private RewardPackageLevel packageLevelSnapshot;

  @JdbcTypeCode(SqlTypes.ARRAY)
  @Column(name = "tags_snapshot", columnDefinition = "text[]")
  private List<String> tagsSnapshot = new ArrayList<>();

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;
}
