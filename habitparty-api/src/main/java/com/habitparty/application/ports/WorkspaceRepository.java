package com.habitparty.application.ports;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.entities.Workspace;

public interface WorkspaceRepository {
  int countByUserId(UUID userId); // Contagem pra validação do limite de 2 workspaces (plano free)
  Workspace save(Workspace workspace);
  void deleteById(UUID id);
  List<Workspace> findAllByUserId(UUID userId);
  Optional<Workspace> findById(UUID id);
  void deleteAllByUserId(UUID userId);
}
