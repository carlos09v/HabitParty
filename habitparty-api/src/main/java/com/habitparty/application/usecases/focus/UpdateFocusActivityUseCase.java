package com.habitparty.application.usecases.focus;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.core.domain.entities.focus.FocusActivity;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class UpdateFocusActivityUseCase {
  private final FocusActivityRepository port;

  public UpdateFocusActivityUseCase(FocusActivityRepository port) {
    this.port = port;
  }

  public FocusActivity execute(UUID userIdLogado, UUID activityId, UpdateFocusActivityCommand command) {
    FocusActivity activity = port.findById(activityId)
        .orElseThrow(() -> new ResourceNotFoundException("Atividade de foco não encontrada."));
    activity.validateOwnership(userIdLogado);

    activity.updateDetails(command.name(), command.icon(), command.recordType(), command.pomoTimeMinutes());

    return port.save(activity);
  }
}
