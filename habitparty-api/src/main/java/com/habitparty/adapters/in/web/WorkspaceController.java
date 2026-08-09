package com.habitparty.adapters.in.web;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.habitparty.adapters.in.web.dtos.request.CreateWorkspaceDTO;
import com.habitparty.adapters.in.web.dtos.response.WorkspaceResponseDTO;
import com.habitparty.application.usecases.workspace.CreateWorkspaceUseCase;
import com.habitparty.application.usecases.workspace.DeleteWorkspaceUseCase;
import com.habitparty.application.usecases.workspace.ListUserWorkspacesUseCase;
import com.habitparty.core.domain.entities.Workspace;

import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.GetMapping;



@RestController
@RequestMapping("/workspaces") 
public class WorkspaceController {
  private final CreateWorkspaceUseCase createWorkspaceUseCase;
  private final DeleteWorkspaceUseCase deleteWorkspaceUseCase;
  private final ListUserWorkspacesUseCase listUserWorkspacesUseCase;

  public WorkspaceController(CreateWorkspaceUseCase createWorkspaceUseCase,
      DeleteWorkspaceUseCase deleteWorkspaceUseCase, ListUserWorkspacesUseCase listUserWorkspacesUseCase) {
    this.createWorkspaceUseCase = createWorkspaceUseCase;
    this.deleteWorkspaceUseCase = deleteWorkspaceUseCase;
    this.listUserWorkspacesUseCase = listUserWorkspacesUseCase;
  }

  @PostMapping
  public ResponseEntity<WorkspaceResponseDTO> createWorkspace(
    @RequestBody @Valid CreateWorkspaceDTO requestDTO,
    @RequestHeader("X-User-Id") UUID userIdLogado
  ) {
      Workspace createdWorkspace = createWorkspaceUseCase.execute(requestDTO, userIdLogado);
      
      return ResponseEntity.status(HttpStatus.CREATED).body(WorkspaceResponseDTO.fromDomain(createdWorkspace));
  }
  
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteWorkspace(
    @PathVariable UUID id,
    @RequestHeader("X-User-Id") UUID userIdLogado
  ) {
    deleteWorkspaceUseCase.execute(id, userIdLogado);

    return ResponseEntity.noContent().build();
  }

  @GetMapping()
  public ResponseEntity<List<WorkspaceResponseDTO>> getWorkspaceListByUserId(
    @RequestHeader("X-User-Id") UUID userIdLogado // Identidade segura
  ) {
      List<Workspace> workspaces = listUserWorkspacesUseCase.execute(userIdLogado);

      List<WorkspaceResponseDTO> responseList = workspaces.stream()
          .map(WorkspaceResponseDTO::fromDomain)
          .toList();

      return ResponseEntity.ok(responseList);
  }
  

  // Falta o Update
}
