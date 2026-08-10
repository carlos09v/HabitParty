package com.habitparty.adapters.out.persistence.entities;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "workspaces")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceJpaEntity {
  @Id
  // @GeneratedValue(strategy = GenerationType.UUID) =? O usecase que irá gerar
  @Column(name = "workspace_id")
  private UUID id;

  // Relacionamento N:1 (Muitos Workspaces pertencem a 1 Usuário)
  // FetchType.LAZY garante performance no JPA. Quando buscar um Workspace no banco, o Hibernate não vai fazer um mega SELECT para trazer todos os dados do Usuário junto, a menos que você peça explicitamente. Ele traz o Workspace rápido e leve.
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private UserJpaEntity user;

  @Column(nullable = false, length = 12)
  private String name;

  @Column(name = "created_at", nullable = false, updatable = false)
  @CreationTimestamp
  private LocalDateTime createdAt;
}
