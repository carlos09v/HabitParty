package com.habitparty.application.usecases.auth;

import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.stereotype.Service;

import com.habitparty.adapters.in.web.dtos.request.RefreshTokenRequestDTO;
import com.habitparty.application.ports.RefreshTokenRepository;
import com.habitparty.core.exceptions.DomainValidationException;

@Service
@Transactional
public class LogoutUseCase {
  private final RefreshTokenRepository refreshTokenRepository;

  public LogoutUseCase(RefreshTokenRepository refreshTokenRepository) {
    this.refreshTokenRepository = refreshTokenRepository;
  }

  public void execute(RefreshTokenRequestDTO dto, UUID userIdLogado) {
        // Usamos ifPresent para não estourar erro se o token já não existir mais.
        // Se já não existe, o usuário de certa forma já está deslogado.
        refreshTokenRepository.findByToken(dto.refreshToken()).ifPresent(tokenDomain -> {
          // Trava de Segurança: Garante que o token pertence a quem está pedindo o logout
            if (!tokenDomain.getUserId().equals(userIdLogado)) {
                throw new DomainValidationException("Você não tem permissão para revogar este token.");
            }

            // O domínio marca a flag 'revoked' como true
            tokenDomain.revoke(); 
            
            // Atualiza no banco
            refreshTokenRepository.save(tokenDomain);
        });
    }
}
