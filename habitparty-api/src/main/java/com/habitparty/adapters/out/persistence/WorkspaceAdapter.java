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
  // Uso do JpaRepository
  private final WorkspaceJpaRepository workspaceRepository;
  // Uso do Mapper (tradutor)
  private final WorkspaceMapper workspaceMapper;

  public WorkspaceAdapter(WorkspaceJpaRepository workspaceRepository, WorkspaceMapper workspaceMapper) {
    this.workspaceRepository = workspaceRepository;
    this.workspaceMapper = workspaceMapper;
  }

  @Override
  public Workspace save(Workspace workspace) {
    // 1. Usa o mapper para transformar o Workspace (Domínio) em WorkspaceJpaEntity (Banco)
    WorkspaceJpaEntity entity = workspaceMapper.toEntity(workspace);

    // 2. O repositório nos devolve a entidade salva (agora com possíveis campos gerados pelo banco, como createdAt).
    WorkspaceJpaEntity savedEntity = workspaceRepository.save(entity);

    // 3. Usa o mapper de novo para transformar o resultado do banco de volta em Domínio e devolver.
    return workspaceMapper.toDomain(savedEntity);
  }

  @Override
  public void deleteById(UUID id) {
    workspaceRepository.deleteById(id);
  }

  @Override
  public int countByUserId(UUID id) {
    return workspaceRepository.countByUser_Id(id);
  }

  @Override
  public List<Workspace> findAllByUserId(UUID userId) {
    // Busca no banco as entidades JPA ordenadas por criação
    List<WorkspaceJpaEntity> entities = workspaceRepository.findByUser_IdOrderByCreatedAtAsc(userId);

    // Transforma a lista de entidades JPA em uma lista de Domínio
    return entities.stream()
      .map(entity -> workspaceMapper.toDomain(entity))
      .toList();
  }

  @Override
  public Optional<Workspace> findById(UUID id) {
    return workspaceRepository.findById(id)
            .map(entity -> workspaceMapper.toDomain(entity));
  }

  @Override
  public void deleteAllByUserId(UUID userId) {
    workspaceRepository.deleteAllByUserId(userId);
  }
}
