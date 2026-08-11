package com.habitparty.application.usecases.auth;

import org.springframework.stereotype.Service;

import com.habitparty.adapters.in.web.dtos.request.RefreshTokenRequestDTO;
import com.habitparty.application.ports.RefreshTokenRepository;

@Service
public class LogoutUseCase {
  private final RefreshTokenRepository refreshTokenRepository;

  public LogoutUseCase(RefreshTokenRepository refreshTokenRepository) {
    this.refreshTokenRepository = refreshTokenRepository;
  }

  public void execute(RefreshTokenRequestDTO dto) {
        // Usamos ifPresent para não estourar erro se o token já não existir mais.
        // Se já não existe, o usuário de certa forma já está deslogado.
        refreshTokenRepository.findByToken(dto.refreshToken()).ifPresent(tokenDomain -> {
            // O domínio marca a flag 'revoked' como true
            tokenDomain.revoke(); 
            
            // Atualiza no banco
            refreshTokenRepository.save(tokenDomain);
        });
    }
}
