package com.habitparty.adapters.in.web;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import com.habitparty.adapters.in.web.api.AuthApi;
import com.habitparty.adapters.in.web.dtos.request.RefreshTokenRequestDTO;
import com.habitparty.adapters.in.web.dtos.request.SignInRequestDTO;
import com.habitparty.adapters.in.web.dtos.response.SignInResponseDTO;
import com.habitparty.application.usecases.auth.LogoutUseCase;
import com.habitparty.application.usecases.auth.RefreshTokenUseCase;
import com.habitparty.application.usecases.auth.SignInUseCase;
import com.habitparty.infrastructure.security.AuthenticatedUser;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
public class AuthController implements AuthApi {
    private final SignInUseCase signInUseCase;
    private final RefreshTokenUseCase refreshTokenUseCase;
    private final LogoutUseCase logoutUseCase;

    @Override
    public ResponseEntity<SignInResponseDTO> signIn(SignInRequestDTO dto) {
        SignInResponseDTO response = signInUseCase.execute(dto);
        return ResponseEntity.ok(response);
    }

    @Override
    public ResponseEntity<SignInResponseDTO> refresh(RefreshTokenRequestDTO dto) {
        SignInResponseDTO response = refreshTokenUseCase.execute(dto);
        return ResponseEntity.ok(response);
    }

    @Override
    public ResponseEntity<Void> logout(
            RefreshTokenRequestDTO dto,
            AuthenticatedUser usuarioLogado) {
        UUID userId = usuarioLogado.id();
        logoutUseCase.execute(dto, userId);
        return ResponseEntity.noContent().build();
    }
}