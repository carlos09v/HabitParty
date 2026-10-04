package com.habitparty.adapters.in.web.api;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.habitparty.adapters.in.web.dtos.request.CreateUserDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateUserDTO;
import com.habitparty.adapters.in.web.dtos.request.UpdateUserPasswordDTO;
import com.habitparty.adapters.in.web.dtos.response.UserResponseDTO;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RequestMapping("/users")
@Tag(name = "Users", description = "Endpoints para gerenciamento do perfil e conta de usuário")
public interface UserApi {

    @Operation(summary = "Criar Usuário", description = "Cadastra um novo usuário na plataforma.")
    @PostMapping
    ResponseEntity<UserResponseDTO> createUser(@Valid @RequestBody CreateUserDTO requestDto);

    @Operation(summary = "Obter Perfil do Usuário Logado", description = "Retorna os dados do perfil do usuário autenticado.")
    @GetMapping("/me")
    ResponseEntity<UserResponseDTO> getUserById(
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Listar Todos os Usuários", description = "Retorna todos os usuários (rota administrativa).")
    @GetMapping
    ResponseEntity<List<UserResponseDTO>> getAllUsers();

    @Operation(summary = "Deletar Conta do Usuário", description = "Exclui a conta do usuário logado.")
    @DeleteMapping("/me")
    ResponseEntity<Void> deleteUser(
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Alterar Senha", description = "Atualiza a senha do usuário logado.")
    @PatchMapping("/password")
    ResponseEntity<Void> updatePassword(
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado,
        @RequestBody @Valid UpdateUserPasswordDTO dto
    );

    @Operation(summary = "Atualizar Perfil", description = "Atualiza dados gerais do perfil do usuário.")
    @PutMapping
    ResponseEntity<UserResponseDTO> update(
        @RequestBody @Valid UpdateUserDTO dto,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );

    @Operation(summary = "Atualizar Foto de Perfil", description = "Faz upload de uma nova foto de perfil para o usuário.")
    @PatchMapping(value = "/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ResponseEntity<Void> updateProfilePhoto(
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado,
        @RequestParam("file") MultipartFile photoFile
    );
}
