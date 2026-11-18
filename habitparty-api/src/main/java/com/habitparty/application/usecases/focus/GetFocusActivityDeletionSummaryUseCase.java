package com.habitparty.application.usecases.focus;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.core.domain.entities.focus.FocusActivity;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class GetFocusActivityDeletionSummaryUseCase {
  private final FocusActivityRepository focusActivityPort;
  private final FocusRecordRepository focusRecordPort;

  public GetFocusActivityDeletionSummaryUseCase(
      FocusActivityRepository focusActivityPort,
      FocusRecordRepository focusRecordPort) {
    this.focusActivityPort = focusActivityPort;
    this.focusRecordPort = focusRecordPort;
  }

  @Transactional(readOnly = true)
  public FocusRecordRepository.ActivityDeletionSummary execute(UUID userIdLogado, UUID activityId) {
    FocusActivity activity = focusActivityPort.findById(activityId)
        .orElseThrow(() -> new ResourceNotFoundException("Atividade de foco não encontrada."));
    activity.validateOwnership(userIdLogado);
    return focusRecordPort.summarizeImpactByFocusActivityId(activityId);
  }
}
