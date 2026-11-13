package com.habitparty.adapters.in.events;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.habitparty.application.events.TaskCompletedEvent;
import com.habitparty.application.usecases.achievement.EvaluateUserAchievementsUseCase;

import lombok.RequiredArgsConstructor;

/**
 * Processa avaliação de conquistas fora da transação crítica de conclusão de tarefa,
 * garantindo que só dispare após commit bem-sucedido.
 */
@Component
@RequiredArgsConstructor
public class UserAchievementsEventListener {

  private final EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase;

  @Async
  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
  public void onTaskCompleted(TaskCompletedEvent event) {
    if (event != null && event.userId() != null) {
      evaluateUserAchievementsUseCase.executeForUserId(event.userId());
    }
  }
}
