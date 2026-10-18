package com.habitparty.adapters.in.web.api;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import com.habitparty.adapters.in.web.dtos.request.ForgotPasswordRequestDTO;
import com.habitparty.adapters.in.web.dtos.request.GoogleSignInRequestDTO;
import com.habitparty.adapters.in.web.dtos.request.RefreshTokenRequestDTO;
import com.habitparty.adapters.in.web.dtos.request.ResetPasswordRequestDTO;
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

    @Operation(summary = "Solicitar Recuperação de Senha", description = "Envia um e-mail com link e token temporário para redefinir a senha.")
    @PostMapping("/forgot-password")
    ResponseEntity<Void> forgotPassword(@RequestBody @Valid ForgotPasswordRequestDTO dto);

    @Operation(summary = "Redefinir Senha", description = "Redefine a senha do usuário utilizando um token de recuperação válido.")
    @PostMapping("/reset-password")
    ResponseEntity<Void> resetPassword(@RequestBody @Valid ResetPasswordRequestDTO dto);

    @Operation(summary = "Login com Google", description = "Autentica ou cadastra o usuário via Google OAuth 2.0 através do código retornado pelo consentimento.")
    @PostMapping("/google")
    ResponseEntity<SignInResponseDTO> googleSignIn(@RequestBody @Valid GoogleSignInRequestDTO dto);
}
