package com.habitparty.application.usecases.auth;

import com.habitparty.adapters.in.web.dtos.request.RefreshTokenRequestDTO;
import com.habitparty.adapters.in.web.dtos.response.SignInResponseDTO;
import com.habitparty.application.ports.RefreshTokenRepository;
import com.habitparty.application.ports.TokenPort;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.RefreshToken;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

public class RefreshTokenUseCase {
  private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final TokenPort tokenPort;


    public RefreshTokenUseCase(RefreshTokenRepository refreshTokenRepository, UserRepository userRepository,
        TokenPort tokenPort) {
      this.refreshTokenRepository = refreshTokenRepository;
      this.userRepository = userRepository;
      this.tokenPort = tokenPort;
    }

    public SignInResponseDTO execute(RefreshTokenRequestDTO dto) {
        // 1. Busca o token no banco de dados
        RefreshToken tokenDomain = refreshTokenRepository.findByToken(dto.refreshToken())
            .orElseThrow(() -> new DomainValidationException("Refresh Token inválido ou não encontrado."));

        // 2. O domínio verifica as regras de negócio (expiração e revogação)
        if (!tokenDomain.isValid()) {
            throw new DomainValidationException("Refresh Token expirado ou revogado. Faça login novamente.");
        }

        // 3. Busca o dono do token para gerar o novo JWT
        User user = userRepository.findById(tokenDomain.getUserId())
            .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

        // 4. Fabrica apenas o crachá rápido novo (Access Token)
        String newAccessToken = tokenPort.generateToken(user);

        // 5. Devolve o novo Access Token e mantém o mesmo Refresh Token
        return new SignInResponseDTO(newAccessToken, tokenDomain.getToken());
    }
}
