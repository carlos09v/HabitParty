package com.habitparty.application.usecases.reward;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.adapters.in.web.dtos.request.CreateRewardDTO;
import com.habitparty.application.ports.RewardRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.reward.Reward;
import com.habitparty.core.domain.enums.RewardCategory;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;
import com.habitparty.core.exceptions.DomainValidationException;
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
    User user = userPort.findById(userIdLogado) // <-- Usa o ID confiável do Backend!
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado!"));

    // Limite de Rewards por User no Plano Free
    int currentCount = port.countByUserId(userIdLogado);
    if (currentCount >= 25) {
      throw new LimitExceededException(
          "Limite de 25 recompensas por usuário atingido no plano gratuito.");
    }

    // 1. Descobre qual é o maior índice atual desse quadro
    int maxIndex = port.getMaxOrderIndex(user.getId());

    // 2. Define o índice da nova coluna como o maior + 1
    int newIndex = maxIndex + 1;

    // 1. Regra da Categoria (Se vier null do DTO, já vira NONE na variável)
    RewardCategory categoriaFinal = dto.category() != null ? dto.category() : RewardCategory.NONE;

    // 2. Extrai os valores originais do dto para tratar
    Integer durationFinal = dto.baseDurationMinutes(); // Sem usar get do dominio ainda
    RewardPackageLevel packageFinal = dto.packageLevel();

    // 3. Aplica a Regra do Tipo (SINGLE_USE vs TIME_BASED)
    if (dto.type() == RewardType.SINGLE_USE) {
        durationFinal = null;
        packageFinal = null;
        
    } else if (dto.type() == RewardType.TIME_BASED) {
        if (durationFinal == null || durationFinal <= 0) {
            durationFinal = 30; // Tempo padrão
        }
        if (packageFinal == null) {
            packageFinal = RewardPackageLevel.NONE;
        }
    } else if (dto.type() == RewardType.MISTERY_BOX) {
        durationFinal = null; // A caixa em si não tem tempo, o prêmio sorteado é que terá
        
        if (packageFinal == null || packageFinal == RewardPackageLevel.NONE) {
            throw new DomainValidationException("Precisa ter um nível de pacote selecionado!");
        }
    }

    Reward newReward = new Reward(
        UUID.randomUUID(),
        userIdLogado,
        dto.name(),
        dto.price(),
        dto.tags(),
        dto.type(),
        newIndex,
        dto.icon(),
        dto.description(),
        categoriaFinal,
        durationFinal,
        packageFinal);

    return port.save(newReward);
  }
}
