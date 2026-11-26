package com.habitparty.adapters.in.events;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.habitparty.application.events.TaskCompletedEvent;
import com.habitparty.application.usecases.achievement.EvaluateUserAchievementsUseCase;

import lombok.RequiredArgsConstructor;

/**
 * Processa avaliação de conquistas fora da transação crítica de conclusão de tarefa,
 * garantindo execução com concorrência limitada após commit bem-sucedido e isolamento entre
 * avaliação de conquistas e notificação de marco de nível.
 */
@Component
@RequiredArgsConstructor
public class UserAchievementsEventListener {

  private static final Logger log = LoggerFactory.getLogger(UserAchievementsEventListener.class);

  private final EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase;

  @Async("applicationTaskExecutor")
  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
  public void onTaskCompleted(TaskCompletedEvent event) {
    if (event == null || event.userId() == null) {
      return;
    }
    try {
      evaluateUserAchievementsUseCase.executeForUserId(event.userId());
    } catch (Exception e) {
      log.warn("Falha assíncrona ao avaliar conquistas do usuário {}: {}", event.userId(), e.getMessage());
    }
    if (event.reachedLevel() != null) {
      try {
        evaluateUserAchievementsUseCase.notifyLevelMilestoneIfReached(event.userId(), event.reachedLevel());
      } catch (Exception e) {
        log.warn("Falha assíncrona ao notificar avanço de nível do usuário {}: {}", event.userId(), e.getMessage());
      }
    }
  }
}
