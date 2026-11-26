package com.habitparty.adapters.out.persistence.entities;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "checklist_item")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(onlyExplicitlyIncluded = true)
public class ChecklistItemJpaEntity extends BaseUuidJpaEntity {

  @Id
  @ToString.Include
  @Column(name = "checklist_item_id")
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "task_id", nullable = false)
  private TaskJpaEntity task;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @ToString.Include
  @Column(nullable = false)
  private String name;

  @Builder.Default
  @Column(name = "is_completed", nullable = false)
  private boolean isCompleted = false;

  @Builder.Default
  @Column(name = "is_rewarded", nullable = false)
  private boolean isRewarded = false;

  @Builder.Default
  @Column(name = "order_index", nullable = false)
  private int orderIndex = 0;

  @Builder.Default
  @Column(name = "auto_completed", nullable = false)
  private boolean autoCompleted = false;
}
