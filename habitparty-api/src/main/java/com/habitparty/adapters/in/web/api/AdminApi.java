package com.habitparty.adapters.in.web.api;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.habitparty.adapters.in.web.dtos.request.admin.UpdateUserRoleRequestDTO;
import com.habitparty.adapters.in.web.dtos.response.UserResponseDTO;
import com.habitparty.adapters.in.web.dtos.response.admin.AdminOverviewDTO;
import com.habitparty.adapters.in.web.dtos.response.admin.AdminUserDetailDTO;
import com.habitparty.adapters.in.web.dtos.response.admin.AdminUserSummaryDTO;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RequestMapping("/api/v1/admin")
@Tag(name = "Admin", description = "Endpoints administrativos para métricas do sistema, cotas do Resend e controle de recursos")
public interface AdminApi {

  @Operation(summary = "Visão Geral do Sistema", description = "Retorna métricas globais de usuários, cota de e-mails do Resend e tamanho do banco de dados.")
  @GetMapping("/overview")
  ResponseEntity<AdminOverviewDTO> getOverview();

  @Operation(summary = "Listar Usuários com Métricas", description = "Lista paginada de usuários com métricas de e-mail, tarefas ativas e espaço ocupado.")
  @GetMapping("/users")
  ResponseEntity<Page<AdminUserSummaryDTO>> listUsers(
      @RequestParam(required = false) String search,
      @RequestParam(required = false, defaultValue = "ALL") String filter,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "15") int size
  );

  @Operation(summary = "Detalhes de um Usuário", description = "Retorna detalhamento minucioso de espaço por tabela e histórico de disparos de e-mail.")
  @GetMapping("/users/{userId}")
  ResponseEntity<AdminUserDetailDTO> getUserDetails(@PathVariable UUID userId);

  @Operation(summary = "Alterar Role de Usuário", description = "Promove ou rebaixa o papel de um usuário (USER ou ADMIN).")
  @PatchMapping("/users/{userId}/role")
  ResponseEntity<UserResponseDTO> updateUserRole(
      @PathVariable UUID userId,
      @Valid @RequestBody UpdateUserRoleRequestDTO request,
      @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
  );
}
