package com.habitparty.adapters.in.web;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import com.habitparty.adapters.in.web.api.WorkspaceApi;
import com.habitparty.adapters.in.web.dtos.request.CreateWorkspaceDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateWorkspaceDTO;
import com.habitparty.adapters.in.web.dtos.response.WorkspaceResponseDTO;
import com.habitparty.application.usecases.workspace.CreateWorkspaceUseCase;
import com.habitparty.application.usecases.workspace.DeleteWorkspaceUseCase;
import com.habitparty.application.usecases.workspace.GetFullKanbanBoardUseCase;
import com.habitparty.application.usecases.workspace.ListUserWorkspacesUseCase;
import com.habitparty.application.usecases.workspace.UpdateWorkspaceUseCase;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
public class WorkspaceController implements WorkspaceApi {
  private final CreateWorkspaceUseCase createWorkspaceUseCase;
  private final DeleteWorkspaceUseCase deleteWorkspaceUseCase;
  private final ListUserWorkspacesUseCase listUserWorkspacesUseCase;
  private final UpdateWorkspaceUseCase updateWorkspaceUseCase;
  private final GetFullKanbanBoardUseCase getFullKanbanBoardUseCase;

  @Override
  public ResponseEntity<WorkspaceResponseDTO> createWorkspace(
      CreateWorkspaceDTO requestDTO,
      AuthenticatedUser usuarioLogado) {
    UUID userId = usuarioLogado.id();
    Workspace createdWorkspace = createWorkspaceUseCase.execute(requestDTO, userId);

    return ResponseEntity.status(HttpStatus.CREATED).body(WorkspaceResponseDTO.fromDomain(createdWorkspace));
  }

  @Override
  public ResponseEntity<Void> deleteWorkspace(
      UUID id,
      AuthenticatedUser usuarioLogado) {
    UUID userId = usuarioLogado.id();
    deleteWorkspaceUseCase.execute(id, userId);

    return ResponseEntity.noContent().build();
  }

  @Override
  public ResponseEntity<List<WorkspaceResponseDTO>> getWorkspaceListByUserId(
      AuthenticatedUser usuarioLogado) {
    UUID userId = usuarioLogado.id();
    List<Workspace> workspaces = listUserWorkspacesUseCase.execute(userId);

    List<WorkspaceResponseDTO> responseList = workspaces.stream()
        .map(WorkspaceResponseDTO::fromDomain)
        .toList();

    return ResponseEntity.ok(responseList);
  }

  @Override
  public ResponseEntity<WorkspaceResponseDTO> update(
      UUID workspaceId,
      UpdateWorkspaceDTO dto,
      AuthenticatedUser usuarioLogado) {
    UUID userId = usuarioLogado.id();
    Workspace updatedWorkspace = updateWorkspaceUseCase.execute(workspaceId, dto, userId);

    return ResponseEntity.ok(WorkspaceResponseDTO.fromDomain(updatedWorkspace));
  }

  @Override
  public ResponseEntity<WorkspaceResponseDTO> getFullKanbanBoard(
      UUID workspaceId,
      AuthenticatedUser usuarioLogado) {
    UUID userId = usuarioLogado.id();
    WorkspaceResponseDTO kanbanBoard = getFullKanbanBoardUseCase.execute(workspaceId, userId);

    return ResponseEntity.ok(kanbanBoard);
  }
}
