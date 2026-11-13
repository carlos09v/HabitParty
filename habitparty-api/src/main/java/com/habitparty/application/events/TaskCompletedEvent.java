package com.habitparty.application.events;

import java.util.UUID;

/**
 * Evento publicado após conclusão de tarefa ou hábito para avaliação assíncrona de conquistas.
 */
public record TaskCompletedEvent(UUID userId) {}
