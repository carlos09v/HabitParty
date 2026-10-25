package com.habitparty.adapters.in.web;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import com.habitparty.adapters.in.web.api.AuthApi;
import com.habitparty.adapters.in.web.dtos.request.ForgotPasswordRequestDTO;
import com.habitparty.adapters.in.web.dtos.request.GoogleSignInRequestDTO;
import com.habitparty.adapters.in.web.dtos.request.RefreshTokenRequestDTO;
import com.habitparty.adapters.in.web.dtos.request.ResetPasswordRequestDTO;
import com.habitparty.adapters.in.web.dtos.request.SignInRequestDTO;
import com.habitparty.adapters.in.web.dtos.response.SignInResponseDTO;
import com.habitparty.application.usecases.auth.GoogleSignInUseCase;
import com.habitparty.application.usecases.auth.LogoutUseCase;
import com.habitparty.application.usecases.auth.RefreshTokenUseCase;
import com.habitparty.application.usecases.auth.RequestPasswordResetUseCase;
import com.habitparty.application.usecases.auth.ResetPasswordUseCase;
import com.habitparty.application.usecases.auth.SignInUseCase;
import com.habitparty.core.exceptions.UnauthorizedException;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
public class AuthController implements AuthApi {
    private final SignInUseCase signInUseCase;
    private final RefreshTokenUseCase refreshTokenUseCase;
    private final LogoutUseCase logoutUseCase;
    private final RequestPasswordResetUseCase requestPasswordResetUseCase;
    private final ResetPasswordUseCase resetPasswordUseCase;
    private final GoogleSignInUseCase googleSignInUseCase;

    @Override
    public ResponseEntity<SignInResponseDTO> signIn(SignInRequestDTO dto) {
        var tokens = signInUseCase.execute(dto.email(), dto.password());
        return ResponseEntity.ok(SignInResponseDTO.fromDomain(tokens));
    }

    @Override
    public ResponseEntity<SignInResponseDTO> refresh(RefreshTokenRequestDTO dto) {
        var tokens = refreshTokenUseCase.execute(dto.refreshToken());
        return ResponseEntity.ok(SignInResponseDTO.fromDomain(tokens));
    }

    @Override
    public ResponseEntity<Void> logout(
            RefreshTokenRequestDTO dto,
            AuthenticatedUser usuarioLogado) {
        if (usuarioLogado == null) {
            throw new UnauthorizedException("Usuário não autenticado.");
        }
        UUID userId = usuarioLogado.id();
        logoutUseCase.execute(dto.refreshToken(), userId);
        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<Void> forgotPassword(ForgotPasswordRequestDTO dto) {
        requestPasswordResetUseCase.execute(dto.email());
        return ResponseEntity.ok().build();
    }

    @Override
    public ResponseEntity<Void> resetPassword(ResetPasswordRequestDTO dto) {
        resetPasswordUseCase.execute(dto.token(), dto.password());
        return ResponseEntity.ok().build();
    }

    @Override
    public ResponseEntity<SignInResponseDTO> googleSignIn(GoogleSignInRequestDTO dto) {
        var tokens = googleSignInUseCase.execute(dto.code());
        return ResponseEntity.ok(SignInResponseDTO.fromDomain(tokens));
    }
}