package com.habitparty.adapters.out.persistence.entities;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskPriority;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.domain.enums.task.TaskType;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "tasks")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(onlyExplicitlyIncluded = true)
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class TaskJpaEntity extends BaseUuidJpaEntity {

  @Id
  @ToString.Include
  @Column(name = "task_id")
  private UUID id;

  @Column(name = "board_column_id", nullable = false)
  private UUID boardColumnId;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @ToString.Include
  @Column(nullable = false)
  private String name;

  @Column(length = 2000)
  private String description;

  @Column(name = "order_index", nullable = false)
  private int orderIndex;

  @Enumerated(EnumType.STRING)
  private TaskPriority priority;

  @Builder.Default
  @JdbcTypeCode(SqlTypes.ARRAY)
  @Column(name = "tags", columnDefinition = "text[]")
  private List<String> tags = new ArrayList<>();

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private TaskDifficulty difficulty;

  @ToString.Include
  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private TaskStatus status;

  @ToString.Include
  @Enumerated(EnumType.STRING)
  @Column(name = "task_type", nullable = false)
  private TaskType taskType;

  @Column(name = "is_hardcore_mode_enabled", nullable = false)
  private boolean isHardcoreModeEnabled;

  @Column(name = "due_date")
  private LocalDate dueDate;

  @Builder.Default
  @Column(name = "total_focus_minutes", nullable = false)
  private int totalFocusMinutes = 0;

  @Builder.Default
  @Column(name = "focus_cycles_count", nullable = false)
  private int focusCyclesCount = 0;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Version
  @Setter(AccessLevel.NONE)
  @Column(name = "version", nullable = false, columnDefinition = "bigint default 0")
  private Long version;

  @Builder.Default
  @OneToMany(mappedBy = "task", cascade = CascadeType.REMOVE)
  private List<ChecklistItemJpaEntity> checklist = new ArrayList<>();
}
