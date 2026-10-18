package com.habitparty.application.usecases.focus;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.focus.FocusActivity;
import com.habitparty.core.exceptions.LimitExceededException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class CreateFocusActivityUseCase {
  private final FocusActivityRepository port;
  private final UserRepository userPort;

  public CreateFocusActivityUseCase(FocusActivityRepository port, UserRepository userPort) {
    this.port = port;
    this.userPort = userPort;
  }

  public FocusActivity execute(UUID userIdLogado, CreateFocusActivityCommand command) {
    User user = userPort.findById(userIdLogado)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado!"));
    int limit = user.isPremium() ? 6 : 4;

    int currentCount = port.countByUserId(userIdLogado);
    if (currentCount >= limit) {
      throw new LimitExceededException(
          "Limite de " + limit + " atividades por usuário atingido. " +
              (user.isPremium() ? "Você já atingiu o teto máximo."
                  : "Assine o plano Premium para criar até 6 atividades!"));
    }

    int maxIndex = port.getMaxOrderIndexByUserId(userIdLogado);
    int newOrderIndex = maxIndex + 1;

    FocusActivity activity = new FocusActivity(
        null,
        userIdLogado,
        command.name(),
        command.icon(),
        newOrderIndex,
        command.recordType(),
        command.targetTimeMinutes(),
        null
    );

    return port.save(activity);
  }
}
