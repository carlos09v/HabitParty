package com.habitparty.application.usecases.user;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.adapters.in.web.dtos.request.CreateUserDTO;
import com.habitparty.application.ports.PasswordHasherPort;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.UserRole;

@Service
public class CreateUserUseCase {
  private final UserRepository port;
  private final PasswordHasherPort passwordHasher;

  public CreateUserUseCase(UserRepository port, PasswordHasherPort passwordHasher) {
    this.port = port;
    this.passwordHasher = passwordHasher;
  }

  public User execute(CreateUserDTO dto) {
    // 1. Gera o hash da senha
    String hashedPassword = passwordHasher.encode(dto.password());

    // Aqui ele "fabrica" o usuário a partir do DTO cru. Obs: os dados precisam estar em ordem conforme constructor do dominio
    User newUser = new User(
        UUID.randomUUID(), // O sistema gera o ID e não o DB
        UserRole.USER,
        false, // Todo user nasce Free
        dto.fullName(), // Vem do DTO
        dto.username(), // Vem do DTO
        dto.email(), // Vem do DTO
        hashedPassword, // Vem do DTO (No futuro, você vai encriptar isso aqui)
        BigDecimal.ZERO, // = currentCoins. Regra de Negócio: Todo mundo começa com 0 moedas
        BigDecimal.ZERO, // = totalGoldEarned
        dto.birthday(), // Vem do DTO
        null, // = profilePhotoUrl. Sem foto no cadastro
        dto.gender(), // Transforma a String do DTO no Enum do Domínio
        0, // = totalXp
        0, // = currentStreak
        0, // = highestStreak
        LocalDateTime.now() // Data exata do cadastro
    );

    // 2. Manda o Adapter salvar no banco
    return port.save(newUser);
  }
}
