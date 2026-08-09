package com.habitparty.adapters.out.persistence.entities;

import java.util.UUID;

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

// Usando o Lambok pra gerar Getters e Setters
@Entity
@Table(name = "board_columns")
@Getter
@Setter
@NoArgsConstructor // Cria aquele construtor vazio que o JPA obriga a ter
@AllArgsConstructor // Cria um construtor com todos os campos
public class BoardColumnJpaEntity {
  @Id
  // @GeneratedValue(strategy = GenerationType.UUID) => O domínio que irá gerar
  @Column(name = "board_column_id")
  private UUID id;
  
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private UserJpaEntity user;

  // Relacionamento N:1 (Muitos boards_columns pertencem a 1 Workspace)
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "workspace_id", nullable = false)
  private WorkspaceJpaEntity workspace;

  @Column(nullable = false, length = 12)
  private String name;

  @Column(length = 20)
  private String icon;

  @Column(name = "order_index", nullable = false)
  private int orderIndex;
}
