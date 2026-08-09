package com.habitparty.application.usecases.user;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import com.habitparty.adapters.in.web.dtos.request.CreateUserDTO;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;

public class CreateUserUseCase {
  private final UserRepository port;

  public CreateUserUseCase(UserRepository port) {
    this.port = port;
  }

  public User execute(CreateUserDTO dto) {
        
        // 1. O Caso de Uso aplica as regras de negócio iniciais
        // Aqui ele "fabrica" o usuário a partir do DTO cru. Obs: os dados precisam estar em ordem conforme constructor do dominio
        User newUser = new User(
            UUID.randomUUID(),           // Sistema gera o ID
            dto.fullName(),              // Vem do DTO
            dto.username(),              // Vem do DTO
            dto.email(),                 // Vem do DTO
            dto.password(),              // Vem do DTO (No futuro, você vai encriptar isso aqui)
            BigDecimal.ZERO,             // = currentCoins. Regra de Negócio: Todo mundo começa com 0 moedas
            BigDecimal.ZERO, // = totalGoldEarned
            dto.birthday(),              // Vem do DTO
            null,                        // = profilePhotoUrl. Sem foto no cadastro
            dto.gender(), // Transforma a String do DTO no Enum do Domínio
            0, // = totalXp
            0, // = currentStreak
            0, // = highestStreak
            LocalDateTime.now()          // Data exata do cadastro
        );

        // 2. Manda o Adapter salvar no banco
        return port.save(newUser);
    }
}
