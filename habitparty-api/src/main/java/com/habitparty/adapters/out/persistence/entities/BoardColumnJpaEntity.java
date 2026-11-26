package com.habitparty.adapters.out.persistence.entities;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "board_columns")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(onlyExplicitlyIncluded = true)
public class BoardColumnJpaEntity extends BaseUuidJpaEntity {

  @Id
  @ToString.Include
  @Column(name = "board_column_id")
  private UUID id;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "workspace_id", nullable = false)
  private UUID workspaceId;

  @Column(name = "is_visible", nullable = false)
  private boolean isVisible;

  @ToString.Include
  @Column(nullable = false, length = 30)
  private String name;

  @Column(length = 20)
  private String icon;

  @Column(name = "order_index", nullable = false)
  private int orderIndex;
}
