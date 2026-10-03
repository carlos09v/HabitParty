package com.habitparty.application.usecases.focus;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.adapters.in.web.dtos.request.CreateFocusActivityDTO;
import com.habitparty.adapters.in.web.dtos.response.FocusActivityResponseDTO;
import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.focus.FocusActivity;
import com.habitparty.core.exceptions.LimitExceededException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class CreateFocusActivityUseCase {
  private final FocusActivityRepository port;
  private final UserRepository userPort;

  public CreateFocusActivityUseCase(FocusActivityRepository port, UserRepository userPort) {
    this.port = port;
    this.userPort = userPort;
  }

  public FocusActivityResponseDTO execute(UUID userIdLogado, CreateFocusActivityDTO dto) {
    // Não precisa validar existencia do User nesse caso pois o Spring Security ja vê pelo Token

    // Buscar o usuário para verificar o plano (Free ou Premium)
    User user = userPort.findById(userIdLogado)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado!"));
    int limit = user.isPremium() ? 8 : 5;

    int currentCount = port.countByUserId(userIdLogado);
    if (currentCount >= limit) {
      throw new LimitExceededException(
          "Limite de " + limit + " atividades por usuário atingido. " +
              (user.isPremium() ? "Você já atingiu o teto máximo."
                  : "Assine o plano Premium para criar até 8 atividades!"));
    }

    // Calcula a nova posição no final da lista
    // O repositório retorna -1 se não houver nenhuma, então -1 + 1 = 0 (primeira posição)
    int maxIndex = port.getMaxOrderIndexByUserId(userIdLogado);
    int newOrderIndex = maxIndex + 1;

    FocusActivity activity = new FocusActivity(
        null, // O dominio esta gerando
        userIdLogado,
        dto.name(),
        dto.icon(),
        newOrderIndex,
        dto.recordType(),
        dto.targetTimeMinutes(),
        null // O dominio esta gerando
    );

    // 4. Salva no banco e converte para Response
    FocusActivity savedActivity = port.save(activity);

    return FocusActivityResponseDTO.fromDomain(savedActivity);
  }
}
