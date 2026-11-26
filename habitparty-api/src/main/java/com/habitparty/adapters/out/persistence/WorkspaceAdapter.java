package com.habitparty.adapters.out.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.WorkspaceJpaEntity;
import com.habitparty.adapters.out.persistence.mappers.WorkspaceMapper;
import com.habitparty.adapters.out.persistence.repository.WorkspaceJpaRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.core.domain.entities.Workspace;

@Component
public class WorkspaceAdapter implements WorkspaceRepository {
  private final WorkspaceJpaRepository workspaceRepository;
  private final WorkspaceMapper workspaceMapper;

  public WorkspaceAdapter(WorkspaceJpaRepository workspaceRepository, WorkspaceMapper workspaceMapper) {
    this.workspaceRepository = workspaceRepository;
    this.workspaceMapper = workspaceMapper;
  }

  @Override
  public Workspace save(Workspace workspace) {
    WorkspaceJpaEntity entity = workspaceRepository.findById(workspace.getId())
        .map(existing -> {
          workspaceMapper.updateEntityFromDomain(existing, workspace);
          return existing;
        })
        .orElseGet(() -> workspaceMapper.toEntity(workspace));

    WorkspaceJpaEntity savedEntity = workspaceRepository.save(entity);
    return workspaceMapper.toDomain(savedEntity);
  }

  @Override
  public void deleteById(UUID id) {
    workspaceRepository.deleteById(id);
  }

  @Override
  public int countByUserId(UUID id) {
    return workspaceRepository.countByUserId(id);
  }

  @Override
  public List<Workspace> findAllByUserId(UUID userId) {
    List<WorkspaceJpaEntity> entities = workspaceRepository.findByUserIdOrderByCreatedAtAsc(userId);
    return entities.stream()
        .map(workspaceMapper::toDomain)
        .toList();
  }

  @Override
  public Optional<Workspace> findById(UUID id) {
    return workspaceRepository.findById(id)
        .map(workspaceMapper::toDomain);
  }

  @Override
  public void deleteAllByUserId(UUID userId) {
    workspaceRepository.deleteAllByUserId(userId);
  }
}
