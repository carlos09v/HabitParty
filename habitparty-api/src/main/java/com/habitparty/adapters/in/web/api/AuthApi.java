package com.habitparty.adapters.in.web.api;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import com.habitparty.adapters.in.web.dtos.request.RefreshTokenRequestDTO;
import com.habitparty.adapters.in.web.dtos.request.SignInRequestDTO;
import com.habitparty.adapters.in.web.dtos.response.SignInResponseDTO;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RequestMapping("/auth")
@Tag(name = "Authentication", description = "Endpoints para autenticação, login, refresh token e logout")
public interface AuthApi {

    @Operation(summary = "Login / Sign-in", description = "Autentica o usuário com email/username e senha, retornando os tokens.")
    @PostMapping("/login")
    ResponseEntity<SignInResponseDTO> signIn(@RequestBody @Valid SignInRequestDTO dto);

    @Operation(summary = "Refresh Token", description = "Gera um novo token JWT a partir de um refresh token válido.")
    @PostMapping("/refresh")
    ResponseEntity<SignInResponseDTO> refresh(@RequestBody @Valid RefreshTokenRequestDTO dto);

    @Operation(summary = "Logout", description = "Invalida o refresh token da sessão ativa do usuário.")
    @PostMapping("/logout")
    ResponseEntity<Void> logout(
        @RequestBody @Valid RefreshTokenRequestDTO dto,
        @Parameter(hidden = true) @AuthenticationPrincipal AuthenticatedUser usuarioLogado
    );
}
