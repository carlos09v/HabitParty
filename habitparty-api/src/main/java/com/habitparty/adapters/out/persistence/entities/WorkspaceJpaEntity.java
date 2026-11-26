package com.habitparty.adapters.out.persistence.entities;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

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
@Table(name = "workspaces")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(onlyExplicitlyIncluded = true)
public class WorkspaceJpaEntity extends BaseUuidJpaEntity {

  @Id
  @ToString.Include
  @Column(name = "workspace_id")
  private UUID id;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @ToString.Include
  @Column(nullable = false, length = 25)
  private String name;

  @Column(name = "created_at", nullable = false, updatable = false)
  @CreationTimestamp
  private LocalDateTime createdAt;
}
