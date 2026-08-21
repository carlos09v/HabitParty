package com.habitparty.adapters.in.web;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.habitparty.adapters.in.web.dtos.request.RefreshTokenRequestDTO;
import com.habitparty.adapters.in.web.dtos.request.SignInRequestDTO;
import com.habitparty.adapters.in.web.dtos.response.SignInResponseDTO;
import com.habitparty.adapters.out.persistence.entities.UserJpaEntity;
import com.habitparty.application.usecases.auth.LogoutUseCase;
import com.habitparty.application.usecases.auth.RefreshTokenUseCase;
import com.habitparty.application.usecases.auth.SignInUseCase;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final SignInUseCase signInUseCase;
    private final RefreshTokenUseCase refreshTokenUseCase;
    private final LogoutUseCase logoutUseCase;

    public AuthController(SignInUseCase signInUseCase, RefreshTokenUseCase refreshTokenUseCase,
        LogoutUseCase logoutUseCase) {
      this.signInUseCase = signInUseCase;
      this.refreshTokenUseCase = refreshTokenUseCase;
      this.logoutUseCase = logoutUseCase;
    }

    @PostMapping("/login")
    public ResponseEntity<SignInResponseDTO> signIn(@RequestBody @Valid SignInRequestDTO dto) {
        // O Caso de Uso verifica a senha, gera o JWT, gera o Refresh e salva no banco.
        SignInResponseDTO response = signInUseCase.execute(dto);
        
        // Retorna HTTP 200 OK com os tokens no corpo da resposta
        return ResponseEntity.ok(response);
    }

    // 2. Rota de Refresh (Pega o token longo antigo e devolve um novo JWT curto)
    @PostMapping("/refresh")
    public ResponseEntity<SignInResponseDTO> refresh(@RequestBody @Valid RefreshTokenRequestDTO dto) {
        SignInResponseDTO response = refreshTokenUseCase.execute(dto);
        return ResponseEntity.ok(response);
    }

    // 3. Rota de Logout (Invalida o token longo no banco)
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
      @RequestBody @Valid RefreshTokenRequestDTO dto,
      @AuthenticationPrincipal UserJpaEntity usuarioLogado) {
        UUID userId = usuarioLogado.getId();
        logoutUseCase.execute(dto, userId);
        return ResponseEntity.noContent().build(); // 204 No Content
    }
}