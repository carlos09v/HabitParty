package com.habitparty.application.usecases.reward;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.adapters.in.web.dtos.request.CreateRewardDTO;
import com.habitparty.application.ports.RewardRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.Reward;
import com.habitparty.core.exceptions.LimitExceededException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class CreateRewardUseCase {
  private final RewardRepository port;
  private final UserRepository userPort;


  public CreateRewardUseCase(RewardRepository port, UserRepository userPort) {
    this.port = port;
    this.userPort = userPort;
  }

  public Reward execute(CreateRewardDTO dto, UUID userIdLogado) {
    // Verificar se o user existe.
    userPort.findById(userIdLogado) // <-- Usa o ID confiável do Backend!
      .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado!"));

    // Limite de Rewards por User no Plano Free
    int currentCount = port.countByUserId(userIdLogado);
    if (currentCount >= 25) {
      throw new LimitExceededException(
          "Limite de 25 recompensas por usuário atingido no plano gratuito.");
    }

    Reward newReward = new Reward(
        UUID.randomUUID(),
        userIdLogado,
        dto.name(),
        dto.price(),
        dto.tags(),
        dto.type(),
        currentCount,
        dto.icon(),
        dto.description(),
        dto.category(),
        dto.baseDurationMinutes(),
        dto.packageLevel()
    );

    return port.save(newReward);
  }
}
