package com.habitparty.adapters.in.web;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RestController;

import com.habitparty.adapters.in.web.api.AdminApi;
import com.habitparty.adapters.in.web.dtos.request.admin.UpdateUserRoleRequestDTO;
import com.habitparty.adapters.in.web.dtos.response.UserResponseDTO;
import com.habitparty.adapters.in.web.dtos.response.admin.AdminOverviewDTO;
import com.habitparty.adapters.in.web.dtos.response.admin.AdminUserDetailDTO;
import com.habitparty.adapters.in.web.dtos.response.admin.AdminUserSummaryDTO;
import com.habitparty.application.usecases.admin.GetAdminOverviewUseCase;
import com.habitparty.application.usecases.admin.GetAdminUserDetailUseCase;
import com.habitparty.application.usecases.admin.ListAdminUsersUseCase;
import com.habitparty.application.usecases.admin.UpdateUserRoleUseCase;
import com.habitparty.core.domain.entities.User;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController implements AdminApi {

  private final GetAdminOverviewUseCase getAdminOverviewUseCase;
  private final ListAdminUsersUseCase listAdminUsersUseCase;
  private final GetAdminUserDetailUseCase getAdminUserDetailUseCase;
  private final UpdateUserRoleUseCase updateUserRoleUseCase;

  @Override
  public ResponseEntity<AdminOverviewDTO> getOverview() {
    AdminOverviewDTO overview = getAdminOverviewUseCase.execute();
    return ResponseEntity.ok(overview);
  }

  @Override
  public ResponseEntity<Page<AdminUserSummaryDTO>> listUsers(
      String search,
      String filter,
      int page,
      int size) {
    int safeSize = Math.min(Math.max(size, 1), 100);
    int safePage = Math.max(page, 0);

    Page<AdminUserSummaryDTO> users = listAdminUsersUseCase.execute(
        search,
        filter,
        PageRequest.of(safePage, safeSize)
    );
    return ResponseEntity.ok(users);
  }

  @Override
  public ResponseEntity<AdminUserDetailDTO> getUserDetails(UUID userId) {
    AdminUserDetailDTO detail = getAdminUserDetailUseCase.execute(userId);
    return ResponseEntity.ok(detail);
  }

  @Override
  public ResponseEntity<UserResponseDTO> updateUserRole(
      UUID userId,
      UpdateUserRoleRequestDTO request,
      AuthenticatedUser usuarioLogado) {
    User updatedUser = updateUserRoleUseCase.execute(userId, usuarioLogado.id(), request.role());
    return ResponseEntity.ok(UserResponseDTO.fromDomain(updatedUser));
  }
}
