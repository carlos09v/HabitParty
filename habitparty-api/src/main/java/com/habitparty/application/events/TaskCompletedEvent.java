package com.habitparty.application.events;

import java.util.UUID;

import com.habitparty.core.domain.enums.UserLevel;

/**
 * Evento publicado após conclusão de tarefa ou hábito para avaliação assíncrona de conquistas
 * e notificação de marcos de nível aos amigos.
 */
public record TaskCompletedEvent(UUID userId, UserLevel reachedLevel) {
  public TaskCompletedEvent(UUID userId) {
    this(userId, null);
  }
}
