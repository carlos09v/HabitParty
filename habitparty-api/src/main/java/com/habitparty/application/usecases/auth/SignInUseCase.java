package com.habitparty.application.usecases.auth;

import java.time.Instant;
import org.springframework.transaction.annotation.Transactional;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.adapters.in.web.dtos.request.SignInRequestDTO;
import com.habitparty.adapters.in.web.dtos.response.SignInResponseDTO;
import com.habitparty.application.ports.PasswordHasherPort;
import com.habitparty.application.ports.RefreshTokenRepository;
import com.habitparty.application.ports.TokenPort;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.RefreshToken;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.exceptions.DomainValidationException;

@Service
@Transactional
public class SignInUseCase {
    private final UserRepository userRepository;
    private final PasswordHasherPort passwordHasher;
    private final TokenPort tokenPort;
    private final RefreshTokenRepository refreshTokenRepository;

    public SignInUseCase(UserRepository userRepository, PasswordHasherPort passwordHasher, TokenPort tokenPort,
            RefreshTokenRepository refreshTokenRepository) {
        this.userRepository = userRepository;
        this.passwordHasher = passwordHasher;
        this.tokenPort = tokenPort;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    // Define o limite máximo de dispositivos na regra de negócio
    private static final int MAX_ACTIVE_SESSIONS = 3;

    public SignInResponseDTO execute(SignInRequestDTO dto) {
        // 1. Busca o usuário pelo e-mail
        User user = userRepository.findByEmail(dto.email())
                .orElseThrow(() -> new DomainValidationException("E-mail ou senha incorretos."));

        // 2. Verifica se a senha bate usando a porta do BCrypt
        if (!passwordHasher.matches(dto.password(), user.getPassword())) {
            throw new DomainValidationException("E-mail ou senha incorretos."); // Mesma mensagem por segurança!
        }

        // ANOVA REGRA DE LIMITAÇÃO:
        int activeSessions = refreshTokenRepository.countActiveByUserId(user.getId());
        // Se já bateu o limite (ou até passou), revoga a sessão mais velha!
        if (activeSessions >= MAX_ACTIVE_SESSIONS) {
            refreshTokenRepository.revokeOldestSession(user.getId());
        }

        // 3. Fabrica o Access Token (O crachá JWT curto de 2 horas)
        String accessToken = tokenPort.generateToken(user);

        // 4. Cria o Refresh Token (O passe longo de 7 dias)
        // Dica: O valor do RefreshToken não precisa ser um JWT, pode ser apenas uma string aleatória gigantesca e única.
        RefreshToken refreshToken = new RefreshToken(
                UUID.randomUUID(),
                user.getId(),
                UUID.randomUUID().toString(), // String aleatória do token
                Instant.now().plus(7, ChronoUnit.DAYS), // Expira em 7 dias
                false // Não está revogado
        );

        // 5. Salva o Refresh Token no banco de dados
        refreshTokenRepository.save(refreshToken);

        // 6. Empacota tudo e devolve para o Controller
        return new SignInResponseDTO(accessToken, refreshToken.getToken());
    }
}
